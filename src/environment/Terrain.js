import * as THREE from 'three';
import { SimplexNoise } from './SimplexNoise.js';

export class Terrain {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.size = options.size || 480;
    this.segments = options.segments || 220;
    this.waterLevel = options.waterLevel || 0;
    this.maxHeight = options.maxHeight || 34;
    this.seed = options.seed || 4242;

    this.simplex = new SimplexNoise(this.seed);
    this.detailNoise = new SimplexNoise(this.seed + 101);
    this.lakeNoise = new SimplexNoise(this.seed + 202);

    this.mesh = null;
    this.waterMesh = null;
    this.geometry = null;

    this.init();
  }

  // Continuous height calculation at any world (x, z)
  getHeight(x, z) {
    const halfSize = this.size * 0.5;
    const distFromCenter = Math.hypot(x, z);
    const normalizedDist = Math.min(1.0, distFromCenter / (halfSize * 0.94));
    // Island mask with cozy soft slope edge
    const islandMask = Math.cos(normalizedDist * Math.PI * 0.5);

    // Multi-octave continuous terrain scaled for 480m world
    const baseElevation = this.simplex.fbm2D(x * 0.0032, z * 0.0032, 4, 0.48, 2.05);
    const detail = this.detailNoise.fbm2D(x * 0.012, z * 0.012, 3, 0.5, 2.0) * 0.22;
    const ridgeNoise = Math.abs(this.simplex.noise2D(x * 0.007, z * 0.007));
    
    // Cozy inland lake depressions
    const lakePocket = this.lakeNoise.noise2D(x * 0.005, z * 0.005);
    const lakeCarve = (lakePocket > 0.45 && distFromCenter < halfSize * 0.6) ? (lakePocket - 0.45) * 12 : 0;

    // Combine features
    let elevation = (baseElevation + detail + (ridgeNoise > 0.42 ? (ridgeNoise - 0.42) * 0.75 : 0));
    let height = (elevation * 1.35 - 0.12) * this.maxHeight * Math.pow(islandMask, 1.35) - lakeCarve;

    // Dedicated cozy 100% flat meadow plains for village settlement at (65, 35)
    const distToVillage = Math.hypot(x - 65, z - 35);
    if (distToVillage < 52) {
      height = 5.2; // Strictly 100% flat plains for all houses, farms, fences, and roads!
    } else if (distToVillage < 78) {
      const t = (distToVillage - 52) / 26; // 0 to 1
      const blend = 0.5 + 0.5 * Math.cos(t * Math.PI); // Cosine ease: 1 at 52m, 0 at 78m
      height = THREE.MathUtils.lerp(height, 5.2, blend);
    }

    // Deep ocean shoreline border
    if (distFromCenter > halfSize * 0.78) {
      const drop = (distFromCenter - halfSize * 0.78) / (halfSize * 0.22);
      height -= drop * 12;
    }

    return height;
  }

  isWater(x, z) {
    return this.getHeight(x, z) <= this.waterLevel + 0.35;
  }

  getNormal(x, z, target = new THREE.Vector3()) {
    const eps = 0.6;
    const hL = this.getHeight(x - eps, z);
    const hR = this.getHeight(x + eps, z);
    const hD = this.getHeight(x, z - eps);
    const hU = this.getHeight(x, z + eps);

    target.set(hL - hR, 2.0 * eps, hD - hU).normalize();
    return target;
  }

  init() {
    this.buildTerrainMesh();
    this.buildWaterMesh();
  }

  buildTerrainMesh() {
    this.geometry = new THREE.PlaneGeometry(this.size, this.size, this.segments, this.segments);
    this.geometry.rotateX(-Math.PI / 2);

    const posAttr = this.geometry.attributes.position;
    const count = posAttr.count;

    // Rich, vibrant & cozy color palette
    const colors = new Float32Array(count * 3);

    const cWaterShallow = new THREE.Color(0x38bdf8); // Glowing tropical shallow
    const cSand = new THREE.Color(0xfde047);         // Warm golden sunlit sand
    const cSandWarm = new THREE.Color(0xfbbf24);     // Amber shoreline edge
    const cMeadowLush = new THREE.Color(0x86efac);   // Vibrant spring lime
    const cMeadowDeep = new THREE.Color(0x22c55e);   // Rich emerald green
    const cForestWarm = new THREE.Color(0x15803d);   // Cozy deep clover green
    const cRockWarm = new THREE.Color(0x854d0e);     // Warm terracotta / sandstone
    const cRockSlate = new THREE.Color(0x78716c);    // Warm earthen stone
    const cSnowCozy = new THREE.Color(0xf8fafc);     // Soft alpine snow cap

    const tempColor = new THREE.Color();
    const tempNormal = new THREE.Vector3();

    for (let i = 0; i < count; i++) {
      const x = posAttr.getX(i);
      const z = posAttr.getZ(i);
      const y = this.getHeight(x, z);

      posAttr.setY(i, y);

      this.getNormal(x, z, tempNormal);
      const slope = 1.0 - tempNormal.y; // 0 = flat, 1 = cliff

      // Color zoning
      if (y < this.waterLevel) {
        tempColor.copy(cWaterShallow);
      } else if (y < this.waterLevel + 1.8) {
        // Beach transition
        const t = (y - this.waterLevel) / 1.8;
        tempColor.lerpColors(cSand, cMeadowLush, t * 0.5);
      } else if (y < 14.0) {
        // Vibrant lowland meadows & valleys
        const t = (y - (this.waterLevel + 1.8)) / 12.2;
        tempColor.lerpColors(cMeadowLush, cMeadowDeep, t);
        if (slope > 0.42) {
          tempColor.lerp(cRockWarm, (slope - 0.42) * 2.2);
        }
      } else if (y < 24.0) {
        // Forest highlands to rocky cliffs
        const t = (y - 14.0) / 10.0;
        tempColor.lerpColors(cForestWarm, cRockSlate, t);
        if (slope > 0.32) {
          tempColor.lerp(cRockSlate, 0.75);
        }
      } else {
        // Cozy snowy summits
        const t = Math.min(1.0, (y - 24.0) / 5.0);
        tempColor.lerpColors(cRockSlate, cSnowCozy, t);
      }

      colors[i * 3] = tempColor.r;
      colors[i * 3 + 1] = tempColor.g;
      colors[i * 3 + 2] = tempColor.b;
    }

    this.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    this.geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.78,
      metalness: 0.05,
      flatShading: true,
    });

    this.mesh = new THREE.Mesh(this.geometry, material);
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = false;
    this.scene.add(this.mesh);
  }

  buildWaterMesh() {
    const waterGeo = new THREE.PlaneGeometry(this.size * 1.2, this.size * 1.2, 64, 64);
    waterGeo.rotateX(-Math.PI / 2);

    const waterMat = new THREE.MeshStandardMaterial({
      color: 0x06b6d4, // Vibrant cyan/turquoise
      transparent: true,
      opacity: 0.82,
      roughness: 0.12,
      metalness: 0.25,
      flatShading: true
    });

    this.waterMesh = new THREE.Mesh(waterGeo, waterMat);
    this.waterMesh.position.y = this.waterLevel;
    this.waterMesh.receiveShadow = true;
    this.scene.add(this.waterMesh);

    this.waterOriginalPos = waterGeo.attributes.position.array.slice();
  }

  update(elapsedTime) {
    if (!this.waterMesh) return;

    const pos = this.waterMesh.geometry.attributes.position;
    const orig = this.waterOriginalPos;
    const count = pos.count;

    for (let i = 0; i < count; i++) {
      const origX = orig[i * 3];
      const origZ = orig[i * 3 + 2];

      const wave1 = Math.sin(origX * 0.06 + elapsedTime * 1.3) * 0.25;
      const wave2 = Math.cos(origZ * 0.07 + elapsedTime * 1.1) * 0.20;
      const wave3 = Math.sin((origX + origZ) * 0.03 + elapsedTime * 0.7) * 0.14;

      pos.setY(i, wave1 + wave2 + wave3);
    }

    pos.needsUpdate = true;
    this.waterMesh.geometry.computeVertexNormals();
  }
}
