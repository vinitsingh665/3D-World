import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

export class BiomeScatter {
  constructor(scene, terrain, village = null) {
    this.scene = scene;
    this.terrain = terrain;
    this.village = village;

    this.foodItems = [];
    this.treePositions = [];
    this.harvestableTrees = [];
    this.harvestableRocks = [];
    this.instancedMeshes = [];
    this.init();
  }

  init() {
    this.spawnVegetation();
  }

  spawnVegetation() {
    const terrainSize = this.terrain.size;
    const halfSize = terrainSize * 0.44;

    // Rich proportions matching Screenshot 3: predominantly lush puffy bubble trees with gentle alpine fir accents
    const oakCount = 280;      // Puffy bubble canopy trees
    const firCount = 75;       // Tiered pagoda firs with solid overlapping skirts
    const autumnCount = 70;    // Golden birch accents
    const blossomCount = 50;   // Pink blossom accents
    const rockCount = 180;     // Small river boulders
    const bushCount = 180;     // Berry bushes for grazing
    const flowerCount = 300;   // Wildflower clumps

    // Materials - Clean, vibrant, cozy palette directly from screenshot 3
    const trunkMat = new THREE.MeshStandardMaterial({ color: 0x543217, roughness: 0.85, flatShading: true });
    const birchTrunkMat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, roughness: 0.7, flatShading: true });

    // Saturated, cozy foliage colors
    const oakLeavesMat = new THREE.MeshStandardMaterial({ color: 0x38a169, roughness: 0.7, flatShading: true }); // Warm lush meadow green
    const firLeavesMat = new THREE.MeshStandardMaterial({ color: 0x1f5d39, roughness: 0.75, flatShading: true }); // Deep saturated alpine pine
    const autumnLeavesMat = new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.7, flatShading: true }); // Cozy golden amber
    const blossomLeavesMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.75, flatShading: true }); // Soft cherry pink
    const rockMat = new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.95, flatShading: true });
    const bushMat = new THREE.MeshStandardMaterial({ color: 0x2f855a, roughness: 0.75, flatShading: true });
    const flowerMat = new THREE.MeshStandardMaterial({ color: 0xa855f7, roughness: 0.6, flatShading: true });

    // =========================================================================
    // 1. PUFFY BUBBLE CANOPY DECIDUOUS TREES (Exact match to Screenshot 3)
    // =========================================================================
    const oakTrunkGeo = new THREE.CylinderGeometry(0.55, 0.85, 4.4, 8).toNonIndexed();
    oakTrunkGeo.translate(0, 2.2, 0);

    // Compound bubble cloud canopy (5 interconnected soft rounded dodecahedrons)
    const p1 = new THREE.DodecahedronGeometry(3.2, 1).toNonIndexed();
    p1.translate(0, 6.0, 0);
    const p2 = new THREE.DodecahedronGeometry(2.5, 1).toNonIndexed();
    p2.translate(1.8, 5.2, 0.7);
    const p3 = new THREE.DodecahedronGeometry(2.4, 1).toNonIndexed();
    p3.translate(-1.7, 5.4, -0.6);
    const p4 = new THREE.DodecahedronGeometry(2.2, 1).toNonIndexed();
    p4.translate(0, 8.0, 0);
    const p5 = new THREE.DodecahedronGeometry(2.0, 1).toNonIndexed();
    p5.translate(0.6, 6.8, -1.5);

    const oakLeavesGeo = mergeGeometries([p1, p2, p3, p4, p5], false);
    oakLeavesGeo.computeVertexNormals();

    const oakTrunkMesh = new THREE.InstancedMesh(oakTrunkGeo, trunkMat, oakCount);
    const oakLeavesMesh = new THREE.InstancedMesh(oakLeavesGeo, oakLeavesMat, oakCount);
    oakTrunkMesh.castShadow = true;
    oakLeavesMesh.castShadow = true;
    oakLeavesMesh.receiveShadow = true;

    // 2. Autumn Golden Birch
    const autumnTrunkMesh = new THREE.InstancedMesh(oakTrunkGeo, birchTrunkMat, autumnCount);
    const autumnLeavesMesh = new THREE.InstancedMesh(oakLeavesGeo, autumnLeavesMat, autumnCount);
    autumnTrunkMesh.castShadow = true;
    autumnLeavesMesh.castShadow = true;
    autumnLeavesMesh.receiveShadow = true;

    // 3. Pink Blossom
    const blossomTrunkMesh = new THREE.InstancedMesh(oakTrunkGeo, trunkMat, blossomCount);
    const blossomLeavesMesh = new THREE.InstancedMesh(oakLeavesGeo, blossomLeavesMat, blossomCount);
    blossomTrunkMesh.castShadow = true;
    blossomLeavesMesh.castShadow = true;
    blossomLeavesMesh.receiveShadow = true;

    // =========================================================================
    // 4. SOLID 4-TIER PAGODA PINES (Overlapping solid skirts, completely non-indexed, NO wireframes!)
    // =========================================================================
    const firTrunkGeo = new THREE.CylinderGeometry(0.5, 0.8, 4.6, 8).toNonIndexed();
    firTrunkGeo.translate(0, 2.3, 0);

    // 4 stepped solid umbrella tiers overlapping cleanly
    const f1 = new THREE.ConeGeometry(3.8, 2.6, 8).toNonIndexed();
    f1.translate(0, 4.4, 0);
    const f2 = new THREE.ConeGeometry(3.0, 2.4, 8).toNonIndexed();
    f2.translate(0, 6.1, 0);
    const f3 = new THREE.ConeGeometry(2.2, 2.2, 8).toNonIndexed();
    f3.translate(0, 7.6, 0);
    const f4 = new THREE.ConeGeometry(1.3, 2.0, 8).toNonIndexed();
    f4.translate(0, 9.0, 0);

    const firLeavesGeo = mergeGeometries([f1, f2, f3, f4], false);
    firLeavesGeo.computeVertexNormals();

    const firTrunkMesh = new THREE.InstancedMesh(firTrunkGeo, trunkMat, firCount);
    const firLeavesMesh = new THREE.InstancedMesh(firLeavesGeo, firLeavesMat, firCount);
    firTrunkMesh.castShadow = true;
    firLeavesMesh.castShadow = true;
    firLeavesMesh.receiveShadow = true;

    // =========================================================================
    // 5. ROCKS, BUSHES, WILDFLOWERS
    // =========================================================================
    const rockGeo = new THREE.DodecahedronGeometry(1.2, 0);
    const rockMesh = new THREE.InstancedMesh(rockGeo, rockMat, rockCount);
    rockMesh.castShadow = true;
    rockMesh.receiveShadow = true;

    const bushGeo = new THREE.DodecahedronGeometry(1.0, 1);
    bushGeo.translate(0, 0.6, 0);
    const bushMesh = new THREE.InstancedMesh(bushGeo, bushMat, bushCount);
    bushMesh.castShadow = true;
    bushMesh.receiveShadow = true;

    const flowerGeo = new THREE.DodecahedronGeometry(0.35, 0);
    flowerGeo.translate(0, 0.35, 0);
    const flowerMesh = new THREE.InstancedMesh(flowerGeo, flowerMat, flowerCount);

    // =========================================================================
    // DISTRIBUTE TREES WITH SPACING & LARGE OPEN CLEARINGS
    // =========================================================================
    const dummy = new THREE.Object3D();
    const zeroMatrix = new THREE.Matrix4().makeScale(0, 0, 0);
    const tempNormal = new THREE.Vector3();

    let oakIdx = 0, firIdx = 0, autumnIdx = 0, blossomIdx = 0;
    let rockIdx = 0, bushIdx = 0, flowerIdx = 0;

    const placedTrees = []; // Minimum distance tracking (Poisson disk)
    const minTreeDist = 11.0; // Enforces open spacing between trees!

    const attempts = 4000;
    for (let i = 0; i < attempts; i++) {
      const rx = (Math.random() - 0.5) * 2 * halfSize;
      const rz = (Math.random() - 0.5) * 2 * halfSize;
      const ry = this.terrain.getHeight(rx, rz);

      if (ry <= this.terrain.waterLevel + 1.2) continue;

      // Keep generous 78m radius clearing around village center (65, 35) to protect views
      const distToVillage = Math.hypot(rx - 65, rz - 35);
      if (distToVillage < 78) {
        // Only small flowers or small bushes inside village!
        if (flowerIdx < flowerCount && Math.random() < 0.2) {
          dummy.position.set(rx, ry, rz);
          dummy.scale.set(0.6, 0.6, 0.6);
          dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
          dummy.updateMatrix();
          flowerMesh.setMatrixAt(flowerIdx++, dummy.matrix);
        }
        continue;
      }

      this.terrain.getNormal(rx, rz, tempNormal);
      const slope = 1.0 - tempNormal.y;

      // Rocks on slopes or quarry sites
      if ((slope > 0.30 || (slope > 0.15 && Math.random() < 0.12)) && rockIdx < rockCount) {
        dummy.position.set(rx, ry + 0.3, rz);
        const s = 0.8 + Math.random() * 1.1;
        dummy.scale.set(s * 0.9, s * 0.6, s * 0.9);
        dummy.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        dummy.updateMatrix();
        rockMesh.setMatrixAt(rockIdx, dummy.matrix);

        this.harvestableRocks.push({
          id: rockIdx,
          position: new THREE.Vector3(rx, ry, rz),
          mesh: rockMesh,
          index: rockIdx,
          originalMatrix: dummy.matrix.clone(),
          isHarvested: false,
          stoneYield: 10 + Math.floor(Math.random() * 6),
          respawnTimer: 0
        });

        rockIdx++;
        continue;
      }

      if (slope > 0.38) continue; // Skip steep hills

      // Distance check to ensure trees are nicely spaced, not crowded
      let tooClose = false;
      for (let t = 0; t < placedTrees.length; t++) {
        const dx = rx - placedTrees[t].x;
        const dz = rz - placedTrees[t].z;
        if (dx * dx + dz * dz < minTreeDist * minTreeDist) {
          tooClose = true;
          break;
        }
      }
      if (tooClose) continue;

      // Highlands: Firs
      if (ry >= 10.0 && ry <= 22.0 && firIdx < firCount) {
        dummy.position.set(rx, ry, rz);
        const scale = 0.85 + Math.random() * 0.35;
        dummy.scale.set(scale, scale, scale);
        dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
        dummy.updateMatrix();

        firTrunkMesh.setMatrixAt(firIdx, dummy.matrix);
        firLeavesMesh.setMatrixAt(firIdx, dummy.matrix);

        this.harvestableTrees.push({
          id: this.harvestableTrees.length,
          type: 'fir',
          position: new THREE.Vector3(rx, ry, rz),
          trunkMesh: firTrunkMesh,
          leavesMesh: firLeavesMesh,
          index: firIdx,
          originalMatrix: dummy.matrix.clone(),
          isHarvested: false,
          woodYield: 16,
          respawnTimer: 0
        });

        firIdx++;
        placedTrees.push(new THREE.Vector3(rx, ry, rz));
        this.treePositions.push(new THREE.Vector3(rx, ry, rz));
        continue;
      }

      // Meadows & Lowlands: Puffy Oaks, Golden Birch, Pink Blossoms
      if (ry >= 2.0 && ry < 11.5) {
        const choice = Math.random();

        if (choice < 0.45 && oakIdx < oakCount) {
          dummy.position.set(rx, ry, rz);
          const scale = 0.85 + Math.random() * 0.35;
          dummy.scale.set(scale, scale, scale);
          dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
          dummy.updateMatrix();

          oakTrunkMesh.setMatrixAt(oakIdx, dummy.matrix);
          oakLeavesMesh.setMatrixAt(oakIdx, dummy.matrix);

          this.harvestableTrees.push({
            id: this.harvestableTrees.length,
            type: 'oak',
            position: new THREE.Vector3(rx, ry, rz),
            trunkMesh: oakTrunkMesh,
            leavesMesh: oakLeavesMesh,
            index: oakIdx,
            originalMatrix: dummy.matrix.clone(),
            isHarvested: false,
            woodYield: 15,
            respawnTimer: 0
          });

          oakIdx++;
          placedTrees.push(new THREE.Vector3(rx, ry, rz));
          this.treePositions.push(new THREE.Vector3(rx, ry, rz));
        } else if (choice < 0.65 && autumnIdx < autumnCount) {
          dummy.position.set(rx, ry, rz);
          const scale = 0.8 + Math.random() * 0.35;
          dummy.scale.set(scale, scale, scale);
          dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
          dummy.updateMatrix();

          autumnTrunkMesh.setMatrixAt(autumnIdx, dummy.matrix);
          autumnLeavesMesh.setMatrixAt(autumnIdx, dummy.matrix);

          this.harvestableTrees.push({
            id: this.harvestableTrees.length,
            type: 'birch',
            position: new THREE.Vector3(rx, ry, rz),
            trunkMesh: autumnTrunkMesh,
            leavesMesh: autumnLeavesMesh,
            index: autumnIdx,
            originalMatrix: dummy.matrix.clone(),
            isHarvested: false,
            woodYield: 14,
            respawnTimer: 0
          });

          autumnIdx++;
          placedTrees.push(new THREE.Vector3(rx, ry, rz));
          this.treePositions.push(new THREE.Vector3(rx, ry, rz));
        } else if (choice < 0.78 && blossomIdx < blossomCount) {
          dummy.position.set(rx, ry, rz);
          const scale = 0.8 + Math.random() * 0.35;
          dummy.scale.set(scale, scale, scale);
          dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
          dummy.updateMatrix();

          blossomTrunkMesh.setMatrixAt(blossomIdx, dummy.matrix);
          blossomLeavesMesh.setMatrixAt(blossomIdx, dummy.matrix);

          this.harvestableTrees.push({
            id: this.harvestableTrees.length,
            type: 'blossom',
            position: new THREE.Vector3(rx, ry, rz),
            trunkMesh: blossomTrunkMesh,
            leavesMesh: blossomLeavesMesh,
            index: blossomIdx,
            originalMatrix: dummy.matrix.clone(),
            isHarvested: false,
            woodYield: 12,
            respawnTimer: 0
          });

          blossomIdx++;
          placedTrees.push(new THREE.Vector3(rx, ry, rz));
          this.treePositions.push(new THREE.Vector3(rx, ry, rz));
        } else if (choice < 0.90 && bushIdx < bushCount) {
          dummy.position.set(rx, ry, rz);
          const scale = 0.6 + Math.random() * 0.4;
          dummy.scale.set(scale, scale, scale);
          dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
          dummy.updateMatrix();

          bushMesh.setMatrixAt(bushIdx++, dummy.matrix);
          this.foodItems.push({
            position: new THREE.Vector3(rx, ry, rz),
            nutrition: 35,
            active: true,
            type: 'bush'
          });
        } else if (flowerIdx < flowerCount) {
          dummy.position.set(rx, ry, rz);
          const scale = 0.5 + Math.random() * 0.5;
          dummy.scale.set(scale, scale, scale);
          dummy.rotation.set(0, Math.random() * Math.PI * 2, 0);
          dummy.updateMatrix();

          flowerMesh.setMatrixAt(flowerIdx++, dummy.matrix);
        }
      }
    }

    // Set counts
    oakTrunkMesh.count = oakIdx;
    oakLeavesMesh.count = oakIdx;
    firTrunkMesh.count = firIdx;
    firLeavesMesh.count = firIdx;
    autumnTrunkMesh.count = autumnIdx;
    autumnLeavesMesh.count = autumnIdx;
    blossomTrunkMesh.count = blossomIdx;
    blossomLeavesMesh.count = blossomIdx;
    rockMesh.count = rockIdx;
    bushMesh.count = bushIdx;
    flowerMesh.count = flowerIdx;

    [
      oakTrunkMesh, oakLeavesMesh,
      firTrunkMesh, firLeavesMesh,
      autumnTrunkMesh, autumnLeavesMesh,
      blossomTrunkMesh, blossomLeavesMesh,
      rockMesh, bushMesh, flowerMesh
    ].forEach(mesh => {
      mesh.instanceMatrix.needsUpdate = true;
      this.scene.add(mesh);
      this.instancedMeshes.push(mesh);
    });
  }

  getNearestTree(pos, radius = 120) {
    let closest = null;
    let minDist = radius;

    for (let i = 0; i < this.harvestableTrees.length; i++) {
      const tree = this.harvestableTrees[i];
      if (tree.isHarvested) continue;

      const d = pos.distanceTo(tree.position);
      if (d < minDist) {
        minDist = d;
        closest = tree;
      }
    }
    return closest;
  }

  chopTree(tree) {
    if (!tree || tree.isHarvested) return 0;

    tree.isHarvested = true;
    tree.respawnTimer = 110 + Math.random() * 40; // 2-3 mins regrowth

    // Hide instanced tree meshes
    const zeroMatrix = new THREE.Matrix4().makeScale(0, 0, 0);
    tree.trunkMesh.setMatrixAt(tree.index, zeroMatrix);
    tree.leavesMesh.setMatrixAt(tree.index, zeroMatrix);
    tree.trunkMesh.instanceMatrix.needsUpdate = true;
    tree.leavesMesh.instanceMatrix.needsUpdate = true;

    return tree.woodYield;
  }

  getNearestRock(pos, radius = 120) {
    let closest = null;
    let minDist = radius;

    for (let i = 0; i < this.harvestableRocks.length; i++) {
      const rock = this.harvestableRocks[i];
      if (rock.isHarvested) continue;

      const d = pos.distanceTo(rock.position);
      if (d < minDist) {
        minDist = d;
        closest = rock;
      }
    }
    return closest;
  }

  mineRock(rock) {
    if (!rock || rock.isHarvested) return 0;

    rock.isHarvested = true;
    rock.respawnTimer = 140 + Math.random() * 50; // Quarry deposit slowly replenishment

    const zeroMatrix = new THREE.Matrix4().makeScale(0, 0, 0);
    rock.mesh.setMatrixAt(rock.index, zeroMatrix);
    rock.mesh.instanceMatrix.needsUpdate = true;

    return rock.stoneYield;
  }

  update(delta) {
    // Nature regrowth cycle
    for (let i = 0; i < this.harvestableTrees.length; i++) {
      const tree = this.harvestableTrees[i];
      if (tree.isHarvested) {
        tree.respawnTimer -= delta;
        if (tree.respawnTimer <= 0) {
          tree.isHarvested = false;
          tree.trunkMesh.setMatrixAt(tree.index, tree.originalMatrix);
          tree.leavesMesh.setMatrixAt(tree.index, tree.originalMatrix);
          tree.trunkMesh.instanceMatrix.needsUpdate = true;
          tree.leavesMesh.instanceMatrix.needsUpdate = true;
        }
      }
    }

    for (let i = 0; i < this.harvestableRocks.length; i++) {
      const rock = this.harvestableRocks[i];
      if (rock.isHarvested) {
        rock.respawnTimer -= delta;
        if (rock.respawnTimer <= 0) {
          rock.isHarvested = false;
          rock.mesh.setMatrixAt(rock.index, rock.originalMatrix);
          rock.mesh.instanceMatrix.needsUpdate = true;
        }
      }
    }
  }

  getFoodNear(pos, radius = 70) {
    let closest = null;
    let minDist = radius;

    for (let i = 0; i < this.foodItems.length; i++) {
      const food = this.foodItems[i];
      if (!food.active) continue;

      const d = pos.distanceTo(food.position);
      if (d < minDist) {
        minDist = d;
        closest = food;
      }
    }
    return closest;
  }
}
