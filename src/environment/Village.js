import * as THREE from 'three';

export class Village {
  constructor(scene, terrain) {
    this.scene = scene;
    this.terrain = terrain;
    if (this.terrain) this.terrain.village = this;
    this.buildings = [];
    this.pathPoints = [];
    this.villageCenter = new THREE.Vector3(65, 0, 35);
    this.villageCenter.y = this.terrain.getHeight(this.villageCenter.x, this.villageCenter.z);

    // =========================================================================
    // CIVILIZATION ECONOMY & PROGRESSION
    // =========================================================================
    this.resources = {
      wood: 45,
      stone: 25,
      food: 35,
      iron: 10,
      weapons: 4,
      armor: 2
    };

    this.era = 1;
    this.eraName = 'Age I: Cozy Settlement';
    this.events = [];
    this.logEvent('Village established at the Meadow Plateau.', 'milestone');

    // Visual Stockpile Yard
    this.stockpileLogsMesh = null;
    this.stockpileStoneMesh = null;

    // Farm Plots, Crops & Gateways
    this.farmPlots = [];
    this.wheatCrops = [];
    this.gates = [];
    this.fenceSegments = [];
    this.perimeterPolygon = [];

    // Construction Blueprints & Projects
    this.projects = [
      {
        id: 'cottageC',
        name: 'Cozy Cottage C (Green Roof)',
        type: 'cottage',
        pos: new THREE.Vector3(94, 0, 32),
        cost: { wood: 30, stone: 15 },
        status: 'PLANNED', // PLANNED, BUILDING, COMPLETED
        progress: 0,
        roofColor: 0x16a34a,
        wallColor: 0xfef9c3,
        scaffoldMesh: null
      },
      {
        id: 'blacksmith',
        name: 'Blacksmith Forge & Armory',
        type: 'blacksmith',
        pos: new THREE.Vector3(72, 0, 16),
        cost: { wood: 40, stone: 30 },
        status: 'PLANNED',
        progress: 0,
        scaffoldMesh: null
      },
      {
        id: 'watchtower',
        name: 'North Guard Watchtower',
        type: 'watchtower',
        pos: new THREE.Vector3(48, 0, 56),
        cost: { wood: 35, stone: 25 },
        status: 'PLANNED',
        progress: 0,
        scaffoldMesh: null
      },
      {
        id: 'windmill',
        name: 'Village Windmill & Granary',
        type: 'windmill',
        pos: new THREE.Vector3(104, 0, 24),
        cost: { wood: 50, stone: 20 },
        status: 'PLANNED',
        progress: 0,
        scaffoldMesh: null
      }
    ];

    this.init();
  }

  logEvent(text, type = 'info') {
    const entry = {
      id: Date.now() + Math.random(),
      text,
      type,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    };
    this.events.unshift(entry);
    if (this.events.length > 25) this.events.pop();
  }

  init() {
    this.buildRoadNetwork();
    this.buildVillageStructures();
  }

  buildRoadNetwork() {
    // Generate curved dirt paths connecting village spots across the level meadow
    const pathCurves = [
      // Main thoroughfare through village
      [
        new THREE.Vector3(42, 0, 35),
        new THREE.Vector3(56, 0, 35),
        new THREE.Vector3(68, 0, 36),
        new THREE.Vector3(82, 0, 40),
        new THREE.Vector3(95, 0, 44)
      ],
      // Branch to sawmill
      [
        new THREE.Vector3(56, 0, 35),
        new THREE.Vector3(55, 0, 24),
        new THREE.Vector3(54, 0, 16)
      ],
      // Branch to Cottage A (Yellow roof)
      [
        new THREE.Vector3(68, 0, 36),
        new THREE.Vector3(74, 0, 44),
        new THREE.Vector3(79, 0, 48)
      ],
      // Branch to Cottage B (Blue roof)
      [
        new THREE.Vector3(68, 0, 36),
        new THREE.Vector3(78, 0, 32),
        new THREE.Vector3(84, 0, 28)
      ],
      // Branch to campsite
      [
        new THREE.Vector3(56, 0, 35),
        new THREE.Vector3(46, 0, 40),
        new THREE.Vector3(38, 0, 44)
      ]
    ];

    const dirtMat = new THREE.MeshStandardMaterial({
      color: 0xb57842, // Warm cozy earth trail tone
      roughness: 0.95,
      flatShading: true,
      polygonOffset: true,
      polygonOffsetFactor: -1.5,
      polygonOffsetUnits: -1.5
    });

    pathCurves.forEach(points => {
      // Sample heights on terrain
      points.forEach(p => {
        p.y = this.terrain.getHeight(p.x, p.z) + 0.08;
        this.pathPoints.push(p.clone());
      });

      const curve = new THREE.CatmullRomCurve3(points);
      const divisions = 60;
      const sampled = curve.getPoints(divisions);

      // Create ribbon mesh along curve
      const ribbonGeo = new THREE.BufferGeometry();
      const vertices = [];
      const uvs = [];
      const pathWidth = 2.6;

      for (let i = 0; i < sampled.length; i++) {
        const pt = sampled[i];
        pt.y = this.terrain.getHeight(pt.x, pt.z) + 0.08;

        const forward = (i < sampled.length - 1)
          ? new THREE.Vector3().subVectors(sampled[i + 1], pt).normalize()
          : (i > 0)
            ? new THREE.Vector3().subVectors(pt, sampled[i - 1]).normalize()
            : new THREE.Vector3(0, 0, 1);

        const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

        const pL = pt.clone().addScaledVector(right, -pathWidth * 0.5);
        const pR = pt.clone().addScaledVector(right, pathWidth * 0.5);
        pL.y = this.terrain.getHeight(pL.x, pL.z) + 0.08;
        pR.y = this.terrain.getHeight(pR.x, pR.z) + 0.08;

        vertices.push(pL.x, pL.y, pL.z);
        vertices.push(pR.x, pR.y, pR.z);

        const v = i / (sampled.length - 1);
        uvs.push(0, v, 1, v);
      }

      const indices = [];
      for (let i = 0; i < sampled.length - 1; i++) {
        const i0 = i * 2;
        const i1 = i0 + 1;
        const i2 = i0 + 2;
        const i3 = i0 + 3;

        indices.push(i0, i1, i2);
        indices.push(i1, i3, i2);
      }

      ribbonGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      ribbonGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
      ribbonGeo.setIndex(indices);
      ribbonGeo.computeVertexNormals();

      const ribbonMesh = new THREE.Mesh(ribbonGeo, dirtMat);
      ribbonMesh.receiveShadow = true;
      this.scene.add(ribbonMesh);
    });
  }

  buildVillageStructures() {
    // 1. Cozy Cottage A (Yellow Roof - exactly like screenshot 3)
    this.createCottage(
      new THREE.Vector3(80, 0, 50),
      -0.3,
      0xfbbf24, // Warm golden yellow roof
      0xfef3c7  // Cream stucco walls
    );

    // 2. Cozy Cottage B (Blue Roof - exactly like screenshot 3)
    this.createCottage(
      new THREE.Vector3(86, 0, 28),
      -0.5,
      0x2563eb, // Vibrant blue roof
      0xf1f5f9  // Whitewash timber walls
    );

    // 3. Sawmill / Lumber Workshop (Woodcutter with stacked logs)
    this.createSawmill(new THREE.Vector3(54, 0, 14), 0.25);

    // 4. Campground / Tent
    this.createCampground(new THREE.Vector3(36, 0, 44));

    // 5. Stone Well (in the central town square)
    this.createStoneWell(new THREE.Vector3(64, 0, 38));

    // 6. Cozy Lampposts
    this.createLamppost(new THREE.Vector3(60, 0, 32));
    this.createLamppost(new THREE.Vector3(74, 0, 44));
    this.createLamppost(new THREE.Vector3(50, 0, 20));

    // 7. Visual Resource Stockpile Yard
    this.buildStockpileYard();

    // 8. Defensive Perimeter Palisade & Fortified Guard Gates
    this.buildPerimeterFence();

    // 9. Community Farm & Golden Wheat Fields
    this.buildFarmFields();
  }

  createCottage(pos, rotationY, roofColor, wallColor) {
    const group = new THREE.Group();
    const y = this.terrain.getHeight(pos.x, pos.z);
    group.position.set(pos.x, y, pos.z);
    group.rotation.y = rotationY;

    // Materials
    const wallMat = new THREE.MeshStandardMaterial({ color: wallColor, roughness: 0.85, flatShading: true });
    const beamMat = new THREE.MeshStandardMaterial({ color: 0x5c3317, roughness: 0.9, flatShading: true });
    const roofMat = new THREE.MeshStandardMaterial({ color: roofColor, roughness: 0.65, flatShading: true });
    const doorMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.8, flatShading: true });
    const winMat = new THREE.MeshBasicMaterial({ color: 0xfef08a }); // Warm interior light glow
    const chimneyMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.95, flatShading: true });

    // House Base
    const width = 7.0, height = 4.2, depth = 6.0;
    const body = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), wallMat);
    body.position.y = height * 0.5;
    body.castShadow = true;
    body.receiveShadow = true;
    group.add(body);

    // Timber Corner Beams
    const beamGeo = new THREE.BoxGeometry(0.5, height + 0.1, 0.5);
    const corners = [
      [width * 0.5, height * 0.5, depth * 0.5],
      [-width * 0.5, height * 0.5, depth * 0.5],
      [width * 0.5, height * 0.5, -depth * 0.5],
      [-width * 0.5, height * 0.5, -depth * 0.5]
    ];
    corners.forEach(([cx, cy, cz]) => {
      const beam = new THREE.Mesh(beamGeo, beamMat);
      beam.position.set(cx, cy, cz);
      beam.castShadow = true;
      group.add(beam);
    });

    // Pitched Roof (Triangular prism)
    const roofHeight = 3.2;
    const roofGeo = new THREE.ConeGeometry(5.8, roofHeight, 4);
    roofGeo.rotateY(Math.PI * 0.25);
    roofGeo.scale(1.2, 1.0, 1.0);
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.y = height + roofHeight * 0.5 - 0.2;
    roof.castShadow = true;
    roof.receiveShadow = true;
    group.add(roof);

    // Door
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.4, 0.2), doorMat);
    door.position.set(0, 1.2, depth * 0.5 + 0.05);
    group.add(door);

    // Windows
    const winGeo = new THREE.BoxGeometry(1.1, 1.1, 0.15);
    const win1 = new THREE.Mesh(winGeo, winMat);
    win1.position.set(2.0, 2.2, depth * 0.5 + 0.05);
    const win2 = new THREE.Mesh(winGeo, winMat);
    win2.position.set(-2.0, 2.2, depth * 0.5 + 0.05);
    group.add(win1, win2);

    // Stone Chimney
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.9, 5.5, 0.9), chimneyMat);
    chimney.position.set(2.2, height + 1.2, -1.5);
    chimney.castShadow = true;
    group.add(chimney);

    // Chimney Smoke puff particles
    const smokePuff = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.5, 0),
      new THREE.MeshBasicMaterial({ color: 0xe2e8f0, transparent: true, opacity: 0.65 })
    );
    smokePuff.position.set(2.2, height + 4.2, -1.5);
    group.add(smokePuff);

    this.scene.add(group);
    this.buildings.push({ type: 'cottage', position: group.position });
  }

  createSawmill(pos, rotationY) {
    const group = new THREE.Group();
    const y = this.terrain.getHeight(pos.x, pos.z);
    group.position.set(pos.x, y, pos.z);
    group.rotation.y = rotationY;

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85, flatShading: true });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.75, flatShading: true });
    const logMat = new THREE.MeshStandardMaterial({ color: 0x5c3317, roughness: 0.9, flatShading: true });
    const plankMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8, flatShading: true });

    // Open Timber Shed with 4 Pillars
    const pillarGeo = new THREE.CylinderGeometry(0.25, 0.25, 3.8, 6);
    const pillars = [
      [3.0, 1.9, 2.5], [-3.0, 1.9, 2.5],
      [3.0, 1.9, -2.5], [-3.0, 1.9, -2.5]
    ];
    pillars.forEach(([px, py, pz]) => {
      const p = new THREE.Mesh(pillarGeo, woodMat);
      p.position.set(px, py, pz);
      p.castShadow = true;
      group.add(p);
    });

    // Sloped Wooden Roof
    const roofGeo = new THREE.BoxGeometry(7.2, 0.4, 6.2);
    roofGeo.rotateX(0.15);
    const roof = new THREE.Mesh(roofGeo, roofMat);
    roof.position.set(0, 3.8, 0);
    roof.castShadow = true;
    group.add(roof);

    // Stacks of Timber Logs outside (like screenshot 2)
    const logGeo = new THREE.CylinderGeometry(0.35, 0.35, 3.2, 6);
    logGeo.rotateZ(Math.PI * 0.5);

    const logCoords = [
      [4.2, 0.35, 0], [4.2, 0.35, 0.8], [4.2, 0.35, -0.8],
      [4.2, 0.95, 0.4], [4.2, 0.95, -0.4],
      [4.2, 1.55, 0]
    ];
    logCoords.forEach(([lx, ly, lz]) => {
      const log = new THREE.Mesh(logGeo, logMat);
      log.position.set(lx, ly, lz);
      log.castShadow = true;
      group.add(log);
    });

    // Stacked Planks
    const plankGeo = new THREE.BoxGeometry(1.4, 0.2, 2.4);
    for (let i = 0; i < 5; i++) {
      const plk = new THREE.Mesh(plankGeo, plankMat);
      plk.position.set(-4.0, 0.1 + i * 0.2, 0.5);
      plk.castShadow = true;
      group.add(plk);
    }

    this.scene.add(group);
    this.buildings.push({ type: 'sawmill', position: group.position });
  }

  createCampground(pos) {
    const group = new THREE.Group();
    const y = this.terrain.getHeight(pos.x, pos.z);
    group.position.set(pos.x, y, pos.z);

    const canvasMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.9, flatShading: true }); // Tan tent canvas
    const tentFrameMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.95, flatShading: true });

    // A-Frame Tent
    const tentGeo = new THREE.ConeGeometry(3.5, 3.2, 4);
    tentGeo.rotateY(Math.PI * 0.25);
    const tent = new THREE.Mesh(tentGeo, canvasMat);
    tent.position.set(0, 1.6, 0);
    tent.castShadow = true;
    group.add(tent);

    // Stone Fire Pit
    const stoneRingGeo = new THREE.DodecahedronGeometry(0.3, 0);
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const st = new THREE.Mesh(stoneRingGeo, stoneMat);
      st.position.set(Math.cos(angle) * 1.4, 0.2, Math.sin(angle) * 1.4 + 4.5);
      group.add(st);
    }

    // Campfire Fire glow
    const fireGeo = new THREE.ConeGeometry(0.5, 0.9, 5);
    const fireMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
    const fire = new THREE.Mesh(fireGeo, fireMat);
    fire.position.set(0, 0.5, 4.5);
    group.add(fire);

    // Warm Campfire PointLight
    const fireLight = new THREE.PointLight(0xf97316, 1.2, 18);
    fireLight.position.set(0, 1.2, 4.5);
    group.add(fireLight);

    this.scene.add(group);
    this.buildings.push({ type: 'camp', position: group.position });
  }

  createStoneWell(pos) {
    const group = new THREE.Group();
    const y = this.terrain.getHeight(pos.x, pos.z);
    group.position.set(pos.x, y, pos.z);

    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9, flatShading: true });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x0284c7, roughness: 0.7, flatShading: true });

    // Circular stone well body
    const baseGeo = new THREE.CylinderGeometry(1.6, 1.6, 1.2, 8);
    const base = new THREE.Mesh(baseGeo, stoneMat);
    base.position.y = 0.6;
    base.castShadow = true;
    group.add(base);

    // Water inside
    const water = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 1.4, 0.1, 8),
      new THREE.MeshStandardMaterial({ color: 0x06b6d4, roughness: 0.1 })
    );
    water.position.y = 0.8;
    group.add(water);

    // 2 Wooden posts & Roof
    const postGeo = new THREE.CylinderGeometry(0.12, 0.12, 2.6, 5);
    const p1 = new THREE.Mesh(postGeo, woodMat);
    p1.position.set(1.4, 1.8, 0);
    const p2 = new THREE.Mesh(postGeo, woodMat);
    p2.position.set(-1.4, 1.8, 0);
    group.add(p1, p2);

    // Mini Roof
    const wellRoof = new THREE.Mesh(new THREE.ConeGeometry(2.2, 1.2, 4), roofMat);
    wellRoof.position.y = 3.5;
    wellRoof.rotateY(Math.PI * 0.25);
    wellRoof.castShadow = true;
    group.add(wellRoof);

    this.scene.add(group);
    this.buildings.push({ type: 'well', position: group.position });
  }

  createLamppost(pos) {
    const group = new THREE.Group();
    const y = this.terrain.getHeight(pos.x, pos.z);
    group.position.set(pos.x, y, pos.z);

    const postGeo = new THREE.CylinderGeometry(0.12, 0.15, 3.2, 6);
    const postMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.8 });
    const post = new THREE.Mesh(postGeo, postMat);
    post.position.y = 1.6;
    post.castShadow = true;
    group.add(post);

    // Glowing Lantern
    const lanternGeo = new THREE.DodecahedronGeometry(0.35, 0);
    const lanternMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const lantern = new THREE.Mesh(lanternGeo, lanternMat);
    lantern.position.set(0, 3.3, 0.4);
    group.add(lantern);

    const lanternLight = new THREE.PointLight(0xfef08a, 0.8, 14);
    lanternLight.position.set(0, 3.2, 0.4);
    group.add(lanternLight);

    this.scene.add(group);
  }

  // =========================================================================
  // RESOURCE STOCKPILE YARD
  // =========================================================================
  buildStockpileYard() {
    const group = new THREE.Group();
    const pos = new THREE.Vector3(60, 0, 18);
    const y = this.terrain.getHeight(pos.x, pos.z);
    group.position.set(pos.x, y, pos.z);

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x64748b, roughness: 0.9, flatShading: true });
    const postMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.9 });

    // Fence perimeter around yard
    const fencePosts = [
      [-3.5, -2.5], [3.5, -2.5], [-3.5, 2.5], [3.5, 2.5], [0, -2.5]
    ];
    fencePosts.forEach(([fx, fz]) => {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.2, 5), postMat);
      p.position.set(fx, 0.6, fz);
      group.add(p);
    });

    // 1. Stack of Lumber Logs
    this.stockpileLogsMesh = new THREE.Group();
    for (let row = 0; row < 3; row++) {
      const count = 4 - row;
      for (let i = 0; i < count; i++) {
        const log = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 2.8, 6), woodMat);
        log.rotation.z = Math.PI * 0.5;
        log.position.set(-1.8 + i * 0.42 + row * 0.21, 0.2 + row * 0.35, -0.6);
        log.castShadow = true;
        this.stockpileLogsMesh.add(log);
      }
    }
    group.add(this.stockpileLogsMesh);

    // 2. Pyramid of Chiseled Stone Blocks
    this.stockpileStoneMesh = new THREE.Group();
    for (let row = 0; row < 2; row++) {
      const count = 3 - row;
      for (let i = 0; i < count; i++) {
        const blk = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.45, 0.55), stoneMat);
        blk.position.set(1.0 + i * 0.6 + row * 0.3, 0.25 + row * 0.45, 0.4);
        blk.castShadow = true;
        this.stockpileStoneMesh.add(blk);
      }
    }
    group.add(this.stockpileStoneMesh);

    this.scene.add(group);
    this.stockpilePos = new THREE.Vector3(pos.x, y, pos.z);
    this.updateStockpileVisuals();
  }

  updateStockpileVisuals() {
    if (this.stockpileLogsMesh) {
      const s = Math.min(2.0, Math.max(0.3, this.resources.wood / 40));
      this.stockpileLogsMesh.scale.set(s, s, s);
    }
    if (this.stockpileStoneMesh) {
      const s = Math.min(2.0, Math.max(0.3, this.resources.stone / 30));
      this.stockpileStoneMesh.scale.set(s, s, s);
    }
  }

  addWood(amount, villagerName = 'Lumberjack') {
    this.resources.wood += amount;
    this.updateStockpileVisuals();
    this.logEvent(`🪓 ${villagerName} deposited ${amount} Wood logs (Total: ${this.resources.wood})`, 'resource');
    this.checkAutoStartProject();
  }

  addStone(amount, villagerName = 'Stonemason') {
    this.resources.stone += amount;
    this.updateStockpileVisuals();
    this.logEvent(`⛏️ ${villagerName} deposited ${amount} Stone blocks (Total: ${this.resources.stone})`, 'resource');
    this.checkAutoStartProject();
  }

  addFood(amount, villagerName = 'Hunter') {
    this.resources.food += amount;
    this.logEvent(`🍖 ${villagerName} brought back ${amount} Food to granary (Total: ${this.resources.food})`, 'resource');
  }

  // =========================================================================
  // CONSTRUCTION & TOWN PLANNING
  // =========================================================================
  checkAutoStartProject() {
    // If no project is currently building, check if any planned project can be afforded
    const active = this.getActiveProject();
    if (active) return;

    for (let i = 0; i < this.projects.length; i++) {
      const proj = this.projects[i];
      if (proj.status === 'PLANNED') {
        if (this.resources.wood >= proj.cost.wood && this.resources.stone >= proj.cost.stone) {
          this.startProject(proj);
          break;
        }
      }
    }
  }

  getActiveProject() {
    return this.projects.find(p => p.status === 'BUILDING');
  }

  startProject(project) {
    if (!project || project.status !== 'PLANNED') return;

    this.resources.wood -= project.cost.wood;
    this.resources.stone -= project.cost.stone;
    this.updateStockpileVisuals();

    project.status = 'BUILDING';
    project.progress = 0;

    // Spawn construction scaffolding at site
    project.scaffoldMesh = this.createScaffolding(project.pos, { w: 7, h: 5.5, d: 6 });
    this.logEvent(`🔨 Builders began constructing ${project.name}!`, 'building');
  }

  advanceProject(project, deltaProgress) {
    if (!project || project.status !== 'BUILDING') return;

    project.progress = Math.min(100, project.progress + deltaProgress);

    if (project.progress >= 100) {
      this.completeProject(project);
    }
  }

  completeProject(project) {
    project.status = 'COMPLETED';

    // Remove scaffolding
    if (project.scaffoldMesh) {
      this.scene.remove(project.scaffoldMesh);
      project.scaffoldMesh = null;
    }

    // Build the finished building
    let buildingPos = project.pos.clone();
    if (project.type === 'cottage') {
      this.createCottage(project.pos, 0.2, project.roofColor || 0x16a34a, project.wallColor || 0xfef9c3);
    } else if (project.type === 'blacksmith') {
      this.createBlacksmith(project.pos, 0.4);
    } else if (project.type === 'watchtower') {
      this.createWatchtower(project.pos);
    } else if (project.type === 'windmill') {
      this.createWindmill(project.pos);
    } else if (project.type === 'marketSquare') {
      this.createMarketSquare(project.pos);
    } else if (project.type === 'farmPlotExpansion') {
      this.createFarmPlotExpansion(project.pos);
    } else if (project.type === 'barracks') {
      this.createBarracks(project.pos, 0.2);
    } else if (project.type === 'townHall') {
      this.createTownHall(project.pos, 0.1);
    }

    // Construct dynamic road connector to the nearest village road
    const nearestRoadPoint = this.getNearestPathPoint(project.pos);
    if (nearestRoadPoint) {
      this.createRoadConnector(project.pos, nearestRoadPoint);
      // Erect cozy street lamppost along the new street connector
      const mid = new THREE.Vector3().addVectors(project.pos, nearestRoadPoint).multiplyScalar(0.5);
      this.createLamppost(new THREE.Vector3(mid.x + 1.8, 0, mid.z + 1.2));
    }

    // Check Era Progression & Civilization Milestones
    if (project.type === 'blacksmith' && this.era < 2) {
      this.era = 2;
      this.eraName = 'Age II: Stone Township & Forge';
      this.resources.iron += 30;
      this.logEvent(`⚔️ Civilization Advanced! Reached ${this.eraName}!`, 'milestone');
    } else if (project.type === 'watchtower' && this.era < 3) {
      this.era = 3;
      this.eraName = 'Age III: Fortified Citadel';
      this.resources.weapons += 12;
      this.resources.armor += 8;
      this.logEvent(`🛡️ Civilization Advanced! Reached ${this.eraName}!`, 'milestone');
    } else if (project.type === 'townHall' && this.era < 4) {
      this.era = 4;
      this.eraName = 'Age IV: Flourishing Realm';
      this.resources.wood += 50;
      this.resources.stone += 50;
      this.resources.food += 50;
      this.logEvent(`👑 Civilization Advanced! Reached ${this.eraName}!`, 'milestone');
    } else {
      this.logEvent(`🎉 Finished construction of ${project.name}!`, 'milestone');
    }

    // Check and queue next expansion blueprints
    this.checkQueueNextExpansionProjects();
    this.checkAutoStartProject();
  }

  checkQueueNextExpansionProjects() {
    const uncompleted = this.projects.filter(p => p.status !== 'COMPLETED');
    if (uncompleted.length > 0) return;

    this.expansionStage = (this.expansionStage || 0) + 1;

    if (this.expansionStage === 1) {
      // Tier 2: Commerce & Agricultural Expansion
      this.projects.push(
        {
          id: 'marketSquare',
          name: 'Vibrant Village Market & Stalls',
          type: 'marketSquare',
          pos: new THREE.Vector3(76, 0, 36),
          cost: { wood: 45, stone: 30 },
          status: 'PLANNED',
          progress: 0,
          scaffoldMesh: null
        },
        {
          id: 'farmPlotExpansion',
          name: 'Community Farm Plot B (Carrots & Pumpkins)',
          type: 'farmPlotExpansion',
          pos: new THREE.Vector3(36, 0, 64),
          cost: { wood: 35, stone: 15 },
          status: 'PLANNED',
          progress: 0,
          scaffoldMesh: null
        }
      );
      this.logEvent('📜 Town Council approved Stage II Expansion: Market Square & Farm Plot B!', 'milestone');
    } else if (this.expansionStage === 2) {
      // Tier 3: Housing & Fortified Garrison
      this.projects.push(
        {
          id: 'cottageD',
          name: 'Cozy Cottage D (Terracotta Roof)',
          type: 'cottage',
          pos: new THREE.Vector3(102, 0, 36),
          cost: { wood: 35, stone: 20 },
          status: 'PLANNED',
          progress: 0,
          roofColor: 0xea580c,
          wallColor: 0xfef9c3,
          scaffoldMesh: null
        },
        {
          id: 'barracks',
          name: 'Guard Barracks & Archery Range',
          type: 'barracks',
          pos: new THREE.Vector3(42, 0, 24),
          cost: { wood: 50, stone: 40 },
          status: 'PLANNED',
          progress: 0,
          scaffoldMesh: null
        }
      );
      this.logEvent('📜 Town Council approved Stage III Expansion: Cottage D & Guard Barracks!', 'milestone');
    } else if (this.expansionStage === 3) {
      // Tier 4: Grand Town Hall & Capital Realm
      this.projects.push(
        {
          id: 'townHall',
          name: 'Grand Town Hall & Clocktower',
          type: 'townHall',
          pos: new THREE.Vector3(68, 0, 48),
          cost: { wood: 65, stone: 55 },
          status: 'PLANNED',
          progress: 0,
          scaffoldMesh: null
        },
        {
          id: 'cottageE',
          name: 'Cozy Cottage E (Cobalt Blue Roof)',
          type: 'cottage',
          pos: new THREE.Vector3(88, 0, 62),
          cost: { wood: 40, stone: 25 },
          status: 'PLANNED',
          progress: 0,
          roofColor: 0x1d4ed8,
          wallColor: 0xf1f5f9,
          scaffoldMesh: null
        }
      );
      this.logEvent('📜 Town Council approved Stage IV Expansion: Grand Town Hall & Cottage E!', 'milestone');
    } else {
      // Continuing cyclical expansion: more settler cottages and estates
      const cottageNum = this.expansionStage + 2;
      const angle = (this.expansionStage * 0.9) % (Math.PI * 2);
      const rad = 24 + (this.expansionStage % 3) * 7;
      const px = 65 + Math.cos(angle) * rad;
      const pz = 35 + Math.sin(angle) * rad;
      const colors = [0x16a34a, 0x2563eb, 0xd97706, 0x9333ea, 0xdc2626];
      const roofCol = colors[this.expansionStage % colors.length];

      this.projects.push({
        id: `cottage_${cottageNum}`,
        name: `Settler Cottage #${cottageNum}`,
        type: 'cottage',
        pos: new THREE.Vector3(px, 0, pz),
        cost: { wood: 35, stone: 20 },
        status: 'PLANNED',
        progress: 0,
        roofColor: roofCol,
        wallColor: 0xfef9c3,
        scaffoldMesh: null
      });
      this.logEvent(`📜 Town Council approved construction of Settler Cottage #${cottageNum}!`, 'milestone');
    }
  }

  getNearestPathPoint(pos) {
    if (this.pathPoints.length === 0) return null;
    let closest = null;
    let minDist = Infinity;
    for (let i = 0; i < this.pathPoints.length; i++) {
      const pt = this.pathPoints[i];
      const d = pos.distanceTo(pt);
      if (d < minDist) {
        minDist = d;
        closest = pt;
      }
    }
    return closest;
  }

  createRoadConnector(fromPos, toPos) {
    const dirtMat = new THREE.MeshStandardMaterial({
      color: 0xb57842,
      roughness: 0.95,
      flatShading: true,
      polygonOffset: true,
      polygonOffsetFactor: -1.5,
      polygonOffsetUnits: -1.5
    });

    const mid = new THREE.Vector3().addVectors(fromPos, toPos).multiplyScalar(0.5);
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(fromPos.x, this.terrain.getHeight(fromPos.x, fromPos.z), fromPos.z),
      new THREE.Vector3(mid.x, this.terrain.getHeight(mid.x, mid.z), mid.z),
      new THREE.Vector3(toPos.x, this.terrain.getHeight(toPos.x, toPos.z), toPos.z)
    ]);

    const sampled = curve.getPoints(24);
    const ribbonGeo = new THREE.BufferGeometry();
    const vertices = [];
    const uvs = [];
    const pathWidth = 2.4;

    for (let i = 0; i < sampled.length; i++) {
      const pt = sampled[i];
      pt.y = this.terrain.getHeight(pt.x, pt.z) + 0.08;
      this.pathPoints.push(pt.clone());

      const forward = (i < sampled.length - 1)
        ? new THREE.Vector3().subVectors(sampled[i + 1], pt).normalize()
        : (i > 0)
          ? new THREE.Vector3().subVectors(pt, sampled[i - 1]).normalize()
          : new THREE.Vector3(0, 0, 1);

      const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
      const pL = pt.clone().addScaledVector(right, -pathWidth * 0.5);
      const pR = pt.clone().addScaledVector(right, pathWidth * 0.5);
      pL.y = this.terrain.getHeight(pL.x, pL.z) + 0.08;
      pR.y = this.terrain.getHeight(pR.x, pR.z) + 0.08;

      vertices.push(pL.x, pL.y, pL.z, pR.x, pR.y, pR.z);
      const v = i / (sampled.length - 1);
      uvs.push(0, v, 1, v);
    }

    const indices = [];
    for (let i = 0; i < sampled.length - 1; i++) {
      const i0 = i * 2, i1 = i0 + 1, i2 = i0 + 2, i3 = i0 + 3;
      indices.push(i0, i1, i2, i1, i3, i2);
    }

    ribbonGeo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    ribbonGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    ribbonGeo.setIndex(indices);
    ribbonGeo.computeVertexNormals();

    const roadMesh = new THREE.Mesh(ribbonGeo, dirtMat);
    roadMesh.receiveShadow = true;
    this.scene.add(roadMesh);
  }

  // =========================================================================
  // SPECIALIZED BUILDING CONSTRUCTORS
  // =========================================================================
  createScaffolding(pos, size = { w: 7, h: 5.5, d: 6 }) {
    const group = new THREE.Group();
    const y = this.terrain.getHeight(pos.x, pos.z);
    group.position.set(pos.x, y, pos.z);

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.9 });
    const plankMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.85 });

    // 4 Corner Poles
    const poleGeo = new THREE.CylinderGeometry(0.12, 0.12, size.h, 5);
    const hw = size.w * 0.5, hd = size.d * 0.5;
    [[-hw, -hd], [hw, -hd], [-hw, hd], [hw, hd]].forEach(([px, pz]) => {
      const pole = new THREE.Mesh(poleGeo, woodMat);
      pole.position.set(px, size.h * 0.5, pz);
      group.add(pole);
    });

    // Horizontal crossbars
    const barGeoX = new THREE.BoxGeometry(size.w, 0.15, 0.15);
    const bar1 = new THREE.Mesh(barGeoX, woodMat);
    bar1.position.set(0, size.h * 0.5, -hd);
    const bar2 = new THREE.Mesh(barGeoX, woodMat);
    bar2.position.set(0, size.h * 0.5, hd);
    group.add(bar1, bar2);

    // Plank work platform
    const platform = new THREE.Mesh(new THREE.BoxGeometry(size.w - 0.4, 0.12, size.d - 0.4), plankMat);
    platform.position.set(0, size.h * 0.52, 0);
    group.add(platform);

    // Blueprint banner / stake flag
    const flagPole = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 2.0, 4), woodMat);
    flagPole.position.set(0, size.h + 1.0, 0);
    const flag = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.5, 0.04), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
    flag.position.set(0.4, size.h + 1.5, 0);
    group.add(flagPole, flag);

    this.scene.add(group);
    return group;
  }

  createBlacksmith(pos, rotationY = 0) {
    const group = new THREE.Group();
    const y = this.terrain.getHeight(pos.x, pos.z);
    group.position.set(pos.x, y, pos.z);
    group.rotation.y = rotationY;

    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.95, flatShading: true });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x543217, roughness: 0.85 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.7, flatShading: true });
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.8, roughness: 0.4 });
    const coalMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });

    // Open timber workshop
    const w = 7.5, h = 4.0, d = 6.0;
    const postGeo = new THREE.BoxGeometry(0.4, h, 0.4);
    [[-w * 0.45, -d * 0.45], [w * 0.45, -d * 0.45], [-w * 0.45, d * 0.45], [w * 0.45, d * 0.45]].forEach(([px, pz]) => {
      const p = new THREE.Mesh(postGeo, woodMat);
      p.position.set(px, h * 0.5, pz);
      group.add(p);
    });

    // Pitched Roof
    const roof = new THREE.Mesh(new THREE.ConeGeometry(5.6, 2.5, 4), roofMat);
    roof.position.y = h + 1.1;
    roof.rotateY(Math.PI * 0.25);
    roof.scale.set(1.25, 1.0, 1.0);
    group.add(roof);

    // Stone Forge & Chimney
    const furnace = new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.2, 2.2), stoneMat);
    furnace.position.set(-1.8, 1.1, -1.2);
    const chimney = new THREE.Mesh(new THREE.BoxGeometry(1.2, 5.0, 1.2), stoneMat);
    chimney.position.set(-1.8, 3.2, -1.2);
    group.add(furnace, chimney);

    // Glowing coals & furnace light
    const coals = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 1.0), coalMat);
    coals.position.set(-1.8, 1.2, -0.4);
    group.add(coals);

    const forgeLight = new THREE.PointLight(0xf97316, 1.8, 12);
    forgeLight.position.set(-1.8, 1.6, -0.2);
    group.add(forgeLight);

    // Anvil
    const anvilStump = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 0.9, 7), woodMat);
    anvilStump.position.set(1.2, 0.45, 0.2);
    const anvilBase = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 0.4), ironMat);
    anvilBase.position.set(1.2, 1.0, 0.2);
    group.add(anvilStump, anvilBase);

    // Weapon display rack
    const rack = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.8, 1.8), woodMat);
    rack.position.set(2.6, 0.9, -1.6);
    group.add(rack);

    this.scene.add(group);
    this.buildings.push({ type: 'blacksmith', position: group.position });
  }

  createWatchtower(pos) {
    const group = new THREE.Group();
    const y = this.terrain.getHeight(pos.x, pos.z);
    group.position.set(pos.x, y, pos.z);

    const woodMat = new THREE.MeshStandardMaterial({ color: 0x543217, roughness: 0.85 });
    const plankMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.8 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.65, flatShading: true });

    // 4 Tall timber stilts
    const height = 8.5;
    const stiltGeo = new THREE.CylinderGeometry(0.25, 0.35, height, 6);
    const hw = 2.4, hd = 2.4;
    [[-hw, -hd], [hw, -hd], [-hw, hd], [hw, hd]].forEach(([px, pz]) => {
      const stilt = new THREE.Mesh(stiltGeo, woodMat);
      stilt.position.set(px, height * 0.5, pz);
      group.add(stilt);
    });

    // Guard platform
    const platform = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.4, 5.8), plankMat);
    platform.position.y = height;
    group.add(platform);

    // Protective railings
    const railMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    const r1 = new THREE.Mesh(new THREE.BoxGeometry(5.6, 1.0, 0.15), railMat);
    r1.position.set(0, height + 0.6, -2.7);
    const r2 = new THREE.Mesh(new THREE.BoxGeometry(5.6, 1.0, 0.15), railMat);
    r2.position.set(0, height + 0.6, 2.7);
    const r3 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.0, 5.6), railMat);
    r3.position.set(-2.7, height + 0.6, 0);
    const r4 = new THREE.Mesh(new THREE.BoxGeometry(0.15, 1.0, 5.6), railMat);
    r4.position.set(2.7, height + 0.6, 0);
    group.add(r1, r2, r3, r4);

    // Watchtower canopy roof
    const roof = new THREE.Mesh(new THREE.ConeGeometry(4.2, 2.6, 4), roofMat);
    roof.position.y = height + 3.2;
    roof.rotateY(Math.PI * 0.25);
    group.add(roof);

    // Brass warning bell
    const bellMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.8, roughness: 0.2 });
    const bell = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.5, 8), bellMat);
    bell.position.set(0, height + 2.2, 0);
    group.add(bell);

    this.scene.add(group);
    this.buildings.push({ type: 'watchtower', position: group.position });
  }

  createWindmill(pos) {
    const group = new THREE.Group();
    const y = this.terrain.getHeight(pos.x, pos.z);
    group.position.set(pos.x, y, pos.z);

    const stoneMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.9, flatShading: true });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.7, flatShading: true }); // Blue roof
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    const bladeMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.6, flatShading: true });

    // Round Stone Tower Base
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(2.4, 3.2, 6.5, 8), stoneMat);
    tower.position.y = 3.25;
    tower.castShadow = true;
    group.add(tower);

    // Conical Roof
    const roof = new THREE.Mesh(new THREE.ConeGeometry(3.0, 2.8, 8), roofMat);
    roof.position.y = 7.8;
    roof.castShadow = true;
    group.add(roof);

    // 4 Rotating Windmill Blades
    this.windmillSails = new THREE.Group();
    this.windmillSails.position.set(0, 6.4, 2.5);

    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.5, 8), woodMat);
    hub.rotation.x = Math.PI * 0.5;
    this.windmillSails.add(hub);

    for (let b = 0; b < 4; b++) {
      const angle = b * (Math.PI * 0.5);
      const bladeArm = new THREE.Group();
      bladeArm.rotation.z = angle;

      const spar = new THREE.Mesh(new THREE.BoxGeometry(0.12, 3.8, 0.12), woodMat);
      spar.position.y = 1.9;
      const sail = new THREE.Mesh(new THREE.BoxGeometry(0.85, 2.8, 0.04), bladeMat);
      sail.position.set(0.45, 2.2, 0);

      bladeArm.add(spar, sail);
      this.windmillSails.add(bladeArm);
    }
    group.add(this.windmillSails);

    this.scene.add(group);
    this.buildings.push({ type: 'windmill', position: group.position, rx: 4.0, rz: 4.0 });
  }

  // =========================================================================
  // EXPANSION BUILDINGS: MARKET, FARM B, BARRACKS, TOWN HALL
  // =========================================================================
  createMarketSquare(pos) {
    const group = new THREE.Group();
    const y = this.terrain.getHeight(pos.x, pos.z);
    group.position.set(pos.x, y, pos.z);

    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.95, flatShading: true });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
    const crateMat = new THREE.MeshStandardMaterial({ color: 0xb45309, roughness: 0.8 });
    const redStripeMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.7 });
    const blueStripeMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.7 });
    const greenStripeMat = new THREE.MeshStandardMaterial({ color: 0x16a34a, roughness: 0.7 });
    const whiteStripeMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.7 });

    // Cobblestone Marketplace Plaza Bed
    const plaza = new THREE.Mesh(new THREE.BoxGeometry(11, 0.15, 9), stoneMat);
    plaza.position.y = 0.08;
    plaza.receiveShadow = true;
    group.add(plaza);

    // Helper: Build a vibrant market stall with striped awning
    const buildStall = (sx, sz, rotY, awningColor1) => {
      const stall = new THREE.Group();
      stall.position.set(sx, 0.1, sz);
      stall.rotation.y = rotY;

      // Wooden counter table
      const counter = new THREE.Mesh(new THREE.BoxGeometry(3.0, 1.1, 1.4), woodMat);
      counter.position.y = 0.55;
      counter.castShadow = true;
      stall.add(counter);

      // 4 Canopy Awning Posts
      const postGeo = new THREE.CylinderGeometry(0.06, 0.06, 2.8, 5);
      [[-1.4, -0.6], [1.4, -0.6], [-1.4, 0.6], [1.4, 0.6]].forEach(([px, pz]) => {
        const p = new THREE.Mesh(postGeo, woodMat);
        p.position.set(px, 1.4, pz);
        stall.add(p);
      });

      // Striped Sloped Fabric Awning
      const awn1 = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.08, 0.9), awningColor1);
      awn1.position.set(0, 2.75, -0.4);
      awn1.rotation.x = 0.2;
      const awn2 = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.08, 0.9), whiteStripeMat);
      awn2.position.set(0, 2.75, 0.4);
      awn2.rotation.x = -0.2;
      stall.add(awn1, awn2);

      // Produce Display Crates
      const crate1 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.35, 0.6), crateMat);
      crate1.position.set(-0.8, 1.25, 0.1);
      const crate2 = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.35, 0.6), crateMat);
      crate2.position.set(0.6, 1.25, 0.1);
      stall.add(crate1, crate2);

      // Apples & Produce Spheres
      const appleMat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
      for (let i = 0; i < 4; i++) {
        const apple = new THREE.Mesh(new THREE.SphereGeometry(0.09, 5, 5), appleMat);
        apple.position.set(-0.9 + (i % 2) * 0.2, 1.48, (i > 1 ? 0.18 : -0.05));
        stall.add(apple);
      }

      // Bread Loaves
      const breadMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 });
      const loaf = new THREE.Mesh(new THREE.SphereGeometry(0.14, 6, 5), breadMat);
      loaf.scale.set(1.4, 0.8, 0.9);
      loaf.position.set(0.6, 1.48, 0.1);
      stall.add(loaf);

      group.add(stall);
    };

    // Stall 1: Fruit & Baker (Red)
    buildStall(-2.8, -2.0, 0, redStripeMat);
    // Stall 2: Fish & Merchant (Blue)
    buildStall(2.8, -2.0, 0, blueStripeMat);
    // Stall 3: Apothecary & Herbs (Green)
    buildStall(0, 2.2, Math.PI, greenStripeMat);

    // Central Market Square Lamppost
    const lampPost = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 3.6, 6), woodMat);
    lampPost.position.set(0, 1.8, 0);
    group.add(lampPost);
    const lampLight = new THREE.PointLight(0xfef08a, 1.2, 14);
    lampLight.position.set(0, 3.6, 0);
    group.add(lampLight);

    // Village Noticeboard Stake
    const board = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.1, 0.1), woodMat);
    board.position.set(-4.2, 1.8, 2.6);
    const paper = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.8, 0.04), whiteStripeMat);
    paper.position.set(-4.2, 1.8, 2.7);
    group.add(board, paper);

    this.scene.add(group);
    this.buildings.push({ type: 'marketSquare', position: group.position, rx: 5.5, rz: 4.5 });
  }

  createFarmPlotExpansion(pos) {
    const farmGroup = new THREE.Group();
    const y = this.terrain.getHeight(pos.x, pos.z);
    farmGroup.position.set(pos.x, y, pos.z);

    const soilMat = new THREE.MeshStandardMaterial({ color: 0x3d2514, roughness: 0.95, flatShading: true });
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
    const carrotMat = new THREE.MeshStandardMaterial({ color: 0xf97316, roughness: 0.5 });
    const leafMat = new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.6 });
    const pumpkinMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.6, flatShading: true });
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x15803d });

    // 1. Tilled Soil Bed (16m x 12m)
    const soilBed = new THREE.Mesh(new THREE.BoxGeometry(16, 0.2, 12), soilMat);
    soilBed.position.y = 0.1;
    soilBed.receiveShadow = true;
    farmGroup.add(soilBed);

    // 2. Carrot Rows (Orange carrots with bushy green tops)
    const carrotConeGeo = new THREE.ConeGeometry(0.08, 0.35, 6);
    const carrotLeafGeo = new THREE.CylinderGeometry(0.02, 0.05, 0.4, 4);

    for (let c = -6.0; c <= 6.0; c += 1.8) {
      for (let r of [-3.2, -1.2]) {
        const carrot = new THREE.Group();
        carrot.position.set(c + (Math.random() - 0.5) * 0.3, 0.22, r + (Math.random() - 0.5) * 0.2);

        const root = new THREE.Mesh(carrotConeGeo, carrotMat);
        root.rotation.x = Math.PI;
        root.position.y = 0.1;
        const leaves = new THREE.Mesh(carrotLeafGeo, leafMat);
        leaves.position.y = 0.35;

        carrot.add(root, leaves);
        farmGroup.add(carrot);

        this.wheatCrops.push({
          mesh: carrot,
          originalY: carrot.position.y,
          ripe: true,
          harvestTimer: 0
        });
      }
    }

    // 3. Pumpkin Patch (Plump orange pumpkins with dark green curly stems)
    const pumpkinGeo = new THREE.SphereGeometry(0.38, 8, 7);
    pumpkinGeo.scale(1.15, 0.85, 1.15);
    const pStemGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.22, 5);

    for (let c = -5.5; c <= 5.5; c += 2.2) {
      for (let r of [1.4, 3.4]) {
        const pumpkin = new THREE.Group();
        pumpkin.position.set(c + (Math.random() - 0.5) * 0.4, 0.4, r + (Math.random() - 0.5) * 0.3);

        const fruit = new THREE.Mesh(pumpkinGeo, pumpkinMat);
        fruit.castShadow = true;
        const stem = new THREE.Mesh(pStemGeo, stemMat);
        stem.position.y = 0.35;
        stem.rotation.z = 0.25;

        pumpkin.add(fruit, stem);
        farmGroup.add(pumpkin);

        this.wheatCrops.push({
          mesh: pumpkin,
          originalY: pumpkin.position.y,
          ripe: true,
          harvestTimer: 0
        });
      }
    }

    // 4. Split-Rail Boundary Fence with Open South Entrance
    const postGeo = new THREE.CylinderGeometry(0.08, 0.09, 1.2, 5);
    for (let x = -8; x <= 8; x += 3.2) {
      if (Math.abs(x) > 2.0) {
        const pN = new THREE.Mesh(postGeo, fenceMat);
        pN.position.set(x, 0.6, -6);
        farmGroup.add(pN);
      }
      const pS = new THREE.Mesh(postGeo, fenceMat);
      pS.position.set(x, 0.6, 6);
      farmGroup.add(pS);
    }
    for (let z = -5; z <= 5; z += 2.5) {
      const pL = new THREE.Mesh(postGeo, fenceMat);
      pL.position.set(-8, 0.6, z);
      const pR = new THREE.Mesh(postGeo, fenceMat);
      pR.position.set(8, 0.6, z);
      farmGroup.add(pL, pR);
    }

    this.scene.add(farmGroup);
    this.farmPlots.push({
      center: new THREE.Vector3(pos.x, y, pos.z),
      harvestPos: new THREE.Vector3(pos.x, y, pos.z - 2.5),
      tendingPos: new THREE.Vector3(pos.x + 3.0, y, pos.z + 1.5)
    });
    this.buildings.push({ type: 'farmExpansion', position: farmGroup.position, rx: 8.5, rz: 6.5 });
  }

  createBarracks(pos, rotationY = 0) {
    const group = new THREE.Group();
    const y = this.terrain.getHeight(pos.x, pos.z);
    group.position.set(pos.x, y, pos.z);
    group.rotation.y = rotationY;

    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.95, flatShading: true });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x543217, roughness: 0.85 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.7, flatShading: true }); // Slate grey roof
    const bannerMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.6 }); // Guard royal blue
    const strawMat = new THREE.MeshStandardMaterial({ color: 0xfef08a, roughness: 0.9 });
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.8, roughness: 0.3 });

    // Fortified Garrison Barracks Body
    const w = 8.5, h = 4.8, d = 5.5;
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), stoneMat);
    body.position.y = h * 0.5;
    body.castShadow = true;
    group.add(body);

    // Slate Gable Roof with Battlements
    const roof = new THREE.Mesh(new THREE.ConeGeometry(6.4, 2.8, 4), roofMat);
    roof.position.y = h + 1.2;
    roof.rotateY(Math.PI * 0.25);
    roof.scale.set(1.35, 1.0, 1.0);
    roof.castShadow = true;
    group.add(roof);

    // Sturdy Reinforced Timber Door
    const door = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.6, 0.2), woodMat);
    door.position.set(0, 1.3, d * 0.5 + 0.05);
    group.add(door);

    // Wall Lantern
    const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, 0.3), new THREE.MeshBasicMaterial({ color: 0xfef08a }));
    lantern.position.set(1.4, 2.4, d * 0.5 + 0.2);
    group.add(lantern);
    const lampLight = new THREE.PointLight(0xfef08a, 1.2, 10);
    lampLight.position.set(1.4, 2.4, d * 0.5 + 0.3);
    group.add(lampLight);

    // Outside Training Yard & Combat Sparring Dummy
    const dummyPost = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 2.2, 6), woodMat);
    dummyPost.position.set(3.2, 1.1, 4.2);
    const dummyBody = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.35, 1.0, 6), strawMat);
    dummyBody.position.set(3.2, 1.4, 4.2);
    const dummyHelmet = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.4, 6), ironMat);
    dummyHelmet.position.set(3.2, 2.05, 4.2);
    group.add(dummyPost, dummyBody, dummyHelmet);

    // Archery Target on Tripod
    const targetFace = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.1, 16), bannerMat);
    targetFace.rotation.x = Math.PI * 0.5;
    targetFace.position.set(-3.2, 1.6, 4.2);
    const bullseye = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.12, 16), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
    bullseye.rotation.x = Math.PI * 0.5;
    bullseye.position.set(-3.2, 1.6, 4.22);
    group.add(targetFace, bullseye);

    // Guard Heraldic Banner Flag
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.2, 5), woodMat);
    pole.position.set(-w * 0.45, h + 1.6, d * 0.45);
    const flag = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.04), bannerMat);
    flag.position.set(-w * 0.45 + 0.45, h + 2.6, d * 0.45);
    group.add(pole, flag);

    this.scene.add(group);
    this.buildings.push({ type: 'barracks', position: group.position, rx: 5.5, rz: 4.8 });
  }

  createTownHall(pos, rotationY = 0) {
    const group = new THREE.Group();
    const y = this.terrain.getHeight(pos.x, pos.z);
    group.position.set(pos.x, y, pos.z);
    group.rotation.y = rotationY;

    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.95, flatShading: true });
    const wallMat = new THREE.MeshStandardMaterial({ color: 0xfef9c3, roughness: 0.85 }); // Cream stucco upper floor
    const beamMat = new THREE.MeshStandardMaterial({ color: 0x543217, roughness: 0.85 });
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x991b1b, roughness: 0.65, flatShading: true }); // Regal crimson roof
    const winMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });
    const bellMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, metalness: 0.85, roughness: 0.2 });

    // 1. Solid Stone Lower Floor (10m x 7m x 3.6m)
    const baseW = 10.0, baseH = 3.6, baseD = 7.0;
    const lowerFloor = new THREE.Mesh(new THREE.BoxGeometry(baseW, baseH, baseD), stoneMat);
    lowerFloor.position.y = baseH * 0.5;
    lowerFloor.castShadow = true;
    group.add(lowerFloor);

    // 2. Timber-Framed Upper Floor (9.6m x 6.6m x 3.2m)
    const upperFloor = new THREE.Mesh(new THREE.BoxGeometry(baseW - 0.4, 3.2, baseD - 0.4), wallMat);
    upperFloor.position.y = baseH + 1.6;
    upperFloor.castShadow = true;
    group.add(upperFloor);

    // 3. Steep Peaked Crimson Shingle Roof
    const roof = new THREE.Mesh(new THREE.ConeGeometry(7.5, 3.8, 4), roofMat);
    roof.position.y = baseH + 3.2 + 1.7;
    roof.rotateY(Math.PI * 0.25);
    roof.scale.set(1.35, 1.0, 1.0);
    roof.castShadow = true;
    group.add(roof);

    // 4. Grand Central Clocktower & Bell Tower (Height: 12.5m)
    const towerW = 2.8, towerH = 6.2;
    const tower = new THREE.Mesh(new THREE.BoxGeometry(towerW, towerH, towerW), stoneMat);
    tower.position.set(0, baseH + 3.2 + towerH * 0.5, 0);
    tower.castShadow = true;
    group.add(tower);

    // Belfry Arched Open Roof
    const belfryRoof = new THREE.Mesh(new THREE.ConeGeometry(2.4, 2.4, 4), roofMat);
    belfryRoof.position.set(0, baseH + 3.2 + towerH + 1.1, 0);
    belfryRoof.rotateY(Math.PI * 0.25);
    belfryRoof.castShadow = true;
    group.add(belfryRoof);

    // Brass Town Bell inside Belfry
    const bell = new THREE.Mesh(new THREE.ConeGeometry(0.45, 0.6, 8), bellMat);
    bell.position.set(0, baseH + 3.2 + towerH - 0.3, 0);
    group.add(bell);

    // Four-Sided Clock Face
    const clockMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.3 });
    const clockGeo = new THREE.CylinderGeometry(0.65, 0.65, 0.08, 16);
    clockGeo.rotateX(Math.PI * 0.5);
    const clockF = new THREE.Mesh(clockGeo, clockMat);
    clockF.position.set(0, baseH + 3.2 + towerH * 0.6, towerW * 0.5 + 0.05);
    group.add(clockF);

    // 5. Arched Entrance Double Door
    const door = new THREE.Mesh(new THREE.BoxGeometry(2.2, 2.8, 0.2), beamMat);
    door.position.set(0, 1.4, baseD * 0.5 + 0.05);
    group.add(door);

    // 6. Lit Town Hall Windows
    const winGeo = new THREE.BoxGeometry(1.2, 1.2, 0.15);
    [-2.8, 2.8].forEach(wx => {
      const w1 = new THREE.Mesh(winGeo, winMat);
      w1.position.set(wx, 2.0, baseD * 0.5 + 0.05);
      const w2 = new THREE.Mesh(winGeo, winMat);
      w2.position.set(wx, baseH + 1.6, baseD * 0.5 + 0.05);
      group.add(w1, w2);
    });

    // 7. Stone Entrance Steps
    const steps = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.35, 1.6), stoneMat);
    steps.position.set(0, 0.175, baseD * 0.5 + 0.8);
    group.add(steps);

    this.scene.add(group);
    this.buildings.push({ type: 'townHall', position: group.position, rx: 6.5, rz: 5.2 });
  }

  craftEquipment() {
    // If Blacksmith exists, craft weapons/armor using resources
    const hasBlacksmith = this.buildings.some(b => b.type === 'blacksmith');
    if (!hasBlacksmith) return;

    if (this.resources.iron >= 5 && this.resources.wood >= 4) {
      this.resources.iron -= 5;
      this.resources.wood -= 4;
      this.resources.weapons += 2;
      this.resources.armor += 1;
      this.logEvent('🛡️ Blacksmith crafted Iron Weapons & Shields for town guards!', 'crafting');
    }
  }

  orderBuild(type) {
    const proj = this.projects.find(p => p.type === type && p.status === 'PLANNED');
    if (proj) {
      if (this.resources.wood >= proj.cost.wood && this.resources.stone >= proj.cost.stone) {
        this.startProject(proj);
        return true;
      }
    }
    return false;
  }

  isInsideVillage(x, z) {
    if (!this.perimeterPolygon || this.perimeterPolygon.length < 3) {
      return Math.hypot(x - this.villageCenter.x, z - this.villageCenter.z) < 35;
    }
    let inside = false;
    const poly = this.perimeterPolygon;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
      const xi = poly[i].x, zi = poly[i].z;
      const xj = poly[j].x, zj = poly[j].z;
      const intersect = ((zi > z) !== (zj > z)) &&
        (x < (xj - xi) * (z - zi) / (zj - zi) + xi);
      if (intersect) inside = !inside;
    }
    return inside;
  }

  // =========================================================================
  // DEFENSIVE PERIMETER PALISADE & GUARD GATES
  // =========================================================================
  buildPerimeterFence() {
    const fenceGroup = new THREE.Group();
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x543217, roughness: 0.9, flatShading: true });
    const beamMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85, flatShading: true });
    const ironMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.4 });
    const lampGlowMat = new THREE.MeshBasicMaterial({ color: 0xfef08a });

    this.fenceSegments = [];
    this.perimeterPolygon = [];
    this.gates = [];

    // 3 Major Fortified Village Gateways:
    // West Wilderness Gate: Road passes along X at z = 35. Pillars span Z from 32.8 to 37.2
    // East Hill Gate: Road passes along X at z = 44. Pillars span Z from 41.8 to 46.2
    // South River Gate: Road passes along Z at x = 54. Pillars span X from 51.8 to 56.2
    const gateDefs = [
      {
        name: 'West Wilderness Gate',
        pos: new THREE.Vector3(34, 0, 35),
        rotY: Math.PI * 0.5,
        insidePos: new THREE.Vector3(38.0, 0, 35.0),
        outsidePos: new THREE.Vector3(29.5, 0, 35.0)
      },
      {
        name: 'North-East Hill Gate',
        pos: new THREE.Vector3(96, 0, 44),
        rotY: Math.PI * 0.5,
        insidePos: new THREE.Vector3(91.5, 0, 44.0),
        outsidePos: new THREE.Vector3(100.5, 0, 44.0)
      },
      {
        name: 'South River Gate',
        pos: new THREE.Vector3(54, 0, 10),
        rotY: 0,
        insidePos: new THREE.Vector3(54.0, 0, 14.5),
        outsidePos: new THREE.Vector3(54.0, 0, 5.5)
      }
    ];

    gateDefs.forEach(g => {
      g.pos.y = this.terrain.getHeight(g.pos.x, g.pos.z);
      g.insidePos.y = this.terrain.getHeight(g.insidePos.x, g.insidePos.z);
      g.outsidePos.y = this.terrain.getHeight(g.outsidePos.x, g.outsidePos.z);
      this.gates.push(g);

      // Create Fortified Archway Gate
      const gateGroup = new THREE.Group();
      gateGroup.position.copy(g.pos);
      gateGroup.rotation.y = g.rotY;

      // 2 Massive Timber Gate Pillars
      const pillarGeo = new THREE.CylinderGeometry(0.35, 0.42, 4.4, 6);
      const capGeo = new THREE.ConeGeometry(0.5, 0.9, 6);
      [-2.2, 2.2].forEach(px => {
        const p = new THREE.Mesh(pillarGeo, woodMat);
        p.position.set(px, 2.2, 0);
        p.castShadow = true;
        const cap = new THREE.Mesh(capGeo, beamMat);
        cap.position.set(px, 4.85, 0);
        gateGroup.add(p, cap);

        // Hanging Iron Lantern with cozy amber light
        const lanternPole = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.08, 0.08), ironMat);
        lanternPole.position.set(px + (px > 0 ? -0.2 : 0.2), 3.8, 0.4);
        const lantern = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.32, 0.22), lampGlowMat);
        lantern.position.set(px + (px > 0 ? -0.35 : 0.35), 3.5, 0.4);
        gateGroup.add(lanternPole, lantern);

        const gateLight = new THREE.PointLight(0xfef08a, 1.2, 10);
        gateLight.position.set(px + (px > 0 ? -0.35 : 0.35), 3.5, 0.4);
        gateGroup.add(gateLight);
      });

      // Overhead Sturdy Gate Lintel / Crossbeam
      const lintel = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.45, 0.5), beamMat);
      lintel.position.set(0, 4.2, 0);
      lintel.castShadow = true;
      gateGroup.add(lintel);

      // Wooden Arch Bracing
      const braceL = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.2, 0.25), woodMat);
      braceL.position.set(-1.6, 3.7, 0);
      braceL.rotation.z = -0.7;
      const braceR = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.2, 0.25), woodMat);
      braceR.position.set(1.6, 3.7, 0);
      braceR.rotation.z = 0.7;
      gateGroup.add(braceL, braceR);

      this.scene.add(gateGroup);
    });

    // 3 Connected Palisade Wall Chains directly connecting all Gate Pillars:
    // Chain 1: North Wall (West Gate North Pillar -> East Gate North Pillar)
    // Chain 2: South-East Wall (East Gate South Pillar -> South Gate East Pillar)
    // Chain 3: South-West Wall (South Gate West Pillar -> West Gate South Pillar)
    const wallChains = [
      // Chain 1: North Perimeter (West Pillar (34, 37.2) -> East Pillar (96, 46.2))
      [
        new THREE.Vector3(34.0, 0, 37.2),
        new THREE.Vector3(33.0, 0, 46.0),
        new THREE.Vector3(35.0, 0, 58.0),
        new THREE.Vector3(44.0, 0, 68.0),
        new THREE.Vector3(62.0, 0, 70.0),
        new THREE.Vector3(78.0, 0, 66.0),
        new THREE.Vector3(90.0, 0, 56.0),
        new THREE.Vector3(96.0, 0, 46.2)
      ],
      // Chain 2: South-East Perimeter (East Pillar (96, 41.8) -> South Pillar (56.2, 10.0))
      [
        new THREE.Vector3(96.0, 0, 41.8),
        new THREE.Vector3(95.0, 0, 30.0),
        new THREE.Vector3(88.0, 0, 18.0),
        new THREE.Vector3(74.0, 0, 10.5),
        new THREE.Vector3(56.2, 0, 10.0)
      ],
      // Chain 3: South-West Perimeter (South Pillar (51.8, 10.0) -> West Pillar (34, 32.8))
      [
        new THREE.Vector3(51.8, 0, 10.0),
        new THREE.Vector3(42.0, 0, 10.5),
        new THREE.Vector3(30.0, 0, 16.0),
        new THREE.Vector3(28.0, 0, 26.0),
        new THREE.Vector3(34.0, 0, 32.8)
      ]
    ];

    const postGeo = new THREE.CylinderGeometry(0.18, 0.22, 2.5, 6);
    const spikeGeo = new THREE.ConeGeometry(0.2, 0.55, 6);
    const railMat = beamMat;

    wallChains.forEach(chainWaypoints => {
      // Set heights on terrain
      chainWaypoints.forEach(p => {
        p.y = this.terrain.getHeight(p.x, p.z);
      });

      const curve = new THREE.CatmullRomCurve3(chainWaypoints, false, 'centripetal');
      const length = curve.getLength();
      const numSteps = Math.max(3, Math.round(length / 2.3));
      const sampledPoints = curve.getPoints(numSteps);

      let prevPoint = null;

      for (let i = 0; i < sampledPoints.length; i++) {
        const curPos = sampledPoints[i];
        curPos.y = this.terrain.getHeight(curPos.x, curPos.z);

        // Store for perimeter polygon containment test
        this.perimeterPolygon.push({ x: curPos.x, z: curPos.z });

        // Palisade sharpened log post
        const postGroup = new THREE.Group();
        postGroup.position.set(curPos.x, curPos.y, curPos.z);
        const post = new THREE.Mesh(postGeo, woodMat);
        post.position.y = 1.25;
        post.castShadow = true;
        const spike = new THREE.Mesh(spikeGeo, woodMat);
        spike.position.y = 2.75;
        spike.castShadow = true;
        postGroup.add(post, spike);
        fenceGroup.add(postGroup);

        // Horizontal interlocking timber rails
        if (prevPoint) {
          const segDist = curPos.distanceTo(prevPoint);
          const midX = (curPos.x + prevPoint.x) * 0.5;
          const midY = (curPos.y + prevPoint.y) * 0.5;
          const midZ = (curPos.z + prevPoint.z) * 0.5;

          const railGeo = new THREE.BoxGeometry(0.14, 0.16, segDist);
          const topRail = new THREE.Mesh(railGeo, railMat);
          topRail.position.set(midX, midY + 1.8, midZ);
          topRail.lookAt(curPos.x, curPos.y + 1.8, curPos.z);
          topRail.castShadow = true;

          const bottomRail = new THREE.Mesh(railGeo, railMat);
          bottomRail.position.set(midX, midY + 0.9, midZ);
          bottomRail.lookAt(curPos.x, curPos.y + 0.9, curPos.z);
          bottomRail.castShadow = true;

          fenceGroup.add(topRail, bottomRail);

          // Add collision segment
          const dx = curPos.x - prevPoint.x;
          const dz = curPos.z - prevPoint.z;
          this.fenceSegments.push({
            x1: prevPoint.x,
            z1: prevPoint.z,
            x2: curPos.x,
            z2: curPos.z,
            lenSq: dx * dx + dz * dz
          });
        }

        prevPoint = curPos;
      }
    });

    this.scene.add(fenceGroup);
    this.logEvent('🛡️ Village perimeter palisade & fortified gates established!', 'milestone');
  }

  // =========================================================================
  // COMMUNITY FARM & GOLDEN WHEAT FIELDS
  // =========================================================================
  buildFarmFields() {
    const farmGroup = new THREE.Group();
    const farmCenter = new THREE.Vector3(46, 0, 56);
    farmCenter.y = this.terrain.getHeight(farmCenter.x, farmCenter.z);
    farmGroup.position.copy(farmCenter);

    // Materials
    const soilMat = new THREE.MeshStandardMaterial({ color: 0x3d2514, roughness: 0.95, flatShading: true }); // Rich dark loam
    const furrowMat = new THREE.MeshStandardMaterial({ color: 0x2b180d, roughness: 0.9, flatShading: true }); // Deep tilled trench
    const fenceMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.85 });
    const wheatStemMat = new THREE.MeshStandardMaterial({ color: 0x84cc16, roughness: 0.7, flatShading: true });
    const wheatHeadMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.5, flatShading: true });
    const scarecrowClothMat = new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.8 }); // Blue shirt
    const scarecrowHatMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.7 });

    // 1. Tilled Soil Field Bed (18m wide x 14m deep)
    const soilBed = new THREE.Mesh(new THREE.BoxGeometry(18, 0.22, 14), soilMat);
    soilBed.position.y = 0.11;
    soilBed.receiveShadow = true;
    farmGroup.add(soilBed);

    // 2. Parallel Tilled Soil Furrows
    for (let r = -4.5; r <= 4.5; r += 3.0) {
      const furrow = new THREE.Mesh(new THREE.BoxGeometry(16.5, 0.12, 1.6), furrowMat);
      furrow.position.set(0, 0.24, r);
      furrow.receiveShadow = true;
      farmGroup.add(furrow);
    }

    // 3. Lush Golden Wheat Crops (36 clusters across rows)
    const stemGeo = new THREE.CylinderGeometry(0.035, 0.04, 0.75, 5);
    const headGeo = new THREE.CylinderGeometry(0.09, 0.06, 0.45, 6);

    for (let r = -4.5; r <= 4.5; r += 3.0) {
      for (let c = -7.0; c <= 7.0; c += 1.8) {
        const crop = new THREE.Group();
        crop.position.set(c + (Math.random() - 0.5) * 0.4, 0.26, r + (Math.random() - 0.5) * 0.3);

        const stem = new THREE.Mesh(stemGeo, wheatStemMat);
        stem.position.y = 0.375;
        stem.castShadow = true;

        const head = new THREE.Mesh(headGeo, wheatHeadMat);
        head.position.y = 0.85;
        head.rotation.z = (Math.random() - 0.5) * 0.25;
        head.castShadow = true;

        crop.add(stem, head);
        farmGroup.add(crop);

        this.wheatCrops.push({
          mesh: crop,
          originalY: crop.position.y,
          ripe: true,
          harvestTimer: 0
        });
      }
    }

    // 4. Rustic Wooden Farm Border Fence & Open South Gate
    const fPostGeo = new THREE.CylinderGeometry(0.09, 0.1, 1.2, 5);
    const fRailMat = fenceMat;

    for (let x = -9; x <= 9; x += 3) {
      if (Math.abs(x) > 2.0) { // Keep gate opening at center
        const p1 = new THREE.Mesh(fPostGeo, fenceMat);
        p1.position.set(x, 0.6, -7);
        p1.castShadow = true;
        farmGroup.add(p1);
      }
      const p2 = new THREE.Mesh(fPostGeo, fenceMat);
      p2.position.set(x, 0.6, 7);
      p2.castShadow = true;
      farmGroup.add(p2);
    }
    for (let z = -6; z <= 6; z += 3) {
      const pL = new THREE.Mesh(fPostGeo, fenceMat);
      pL.position.set(-9, 0.6, z);
      pL.castShadow = true;
      const pR = new THREE.Mesh(fPostGeo, fenceMat);
      pR.position.set(9, 0.6, z);
      pR.castShadow = true;
      farmGroup.add(pL, pR);
    }

    // Horizontal rails
    const railN = new THREE.Mesh(new THREE.BoxGeometry(18, 0.1, 0.08), fRailMat);
    railN.position.set(0, 0.8, 7);
    const railW = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 14), fRailMat);
    railW.position.set(-9, 0.8, 0);
    const railE = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.1, 14), fRailMat);
    railE.position.set(9, 0.8, 0);
    const railS1 = new THREE.Mesh(new THREE.BoxGeometry(7, 0.1, 0.08), fRailMat);
    railS1.position.set(-5.5, 0.8, -7);
    const railS2 = new THREE.Mesh(new THREE.BoxGeometry(7, 0.1, 0.08), fRailMat);
    railS2.position.set(5.5, 0.8, -7);
    farmGroup.add(railN, railW, railE, railS1, railS2);

    // 5. Cozy Country Scarecrow in Center
    const scarecrow = new THREE.Group();
    scarecrow.position.set(0, 0.2, 0);

    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 2.4, 5), fenceMat);
    post.position.y = 1.2;
    post.castShadow = true;
    const crossArms = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.08), fenceMat);
    crossArms.position.y = 1.7;
    scarecrow.add(post, crossArms);

    const scBody = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.65, 0.32), scarecrowClothMat);
    scBody.position.y = 1.45;
    scBody.castShadow = true;
    const scHead = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 8), new THREE.MeshStandardMaterial({ color: 0xfde047 }));
    scHead.position.y = 1.95;
    const scHat = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.3, 8), scarecrowHatMat);
    scHat.position.y = 2.18;
    scHat.rotation.z = 0.15;
    scarecrow.add(scBody, scHead, scHat);
    farmGroup.add(scarecrow);

    // 6. Water barrel & farm tool storage
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.36, 0.85, 8), fenceMat);
    barrel.position.set(-7.5, 0.5, -5.5);
    barrel.castShadow = true;
    const sack = new THREE.Mesh(new THREE.SphereGeometry(0.35, 6, 6), new THREE.MeshStandardMaterial({ color: 0xd97706 }));
    sack.scale.set(1.0, 1.2, 0.8);
    sack.position.set(-6.5, 0.35, -5.6);
    farmGroup.add(barrel, sack);

    this.scene.add(farmGroup);
    this.farmPlots.push({
      center: farmCenter,
      harvestPos: new THREE.Vector3(farmCenter.x, farmCenter.y, farmCenter.z - 2.5),
      tendingPos: new THREE.Vector3(farmCenter.x + 3.0, farmCenter.y, farmCenter.z + 1.5)
    });

    this.logEvent('🌾 Golden Wheat Farm planted and tilled to nourish the settlement!', 'milestone');
  }

  getFarmPlot() {
    return (this.farmPlots && this.farmPlots.length > 0) ? this.farmPlots[0] : null;
  }

  harvestWheat() {
    let harvestedCount = 0;
    this.wheatCrops.forEach(c => {
      if (c.ripe && Math.random() < 0.45) {
        c.ripe = false;
        c.harvestTimer = 18;
        c.mesh.scale.set(0.2, 0.2, 0.2);
        harvestedCount++;
      }
    });
    return Math.max(8, harvestedCount * 2);
  }

  update(delta) {
    // Rotate windmill blades
    if (this.windmillSails) {
      this.windmillSails.rotation.z += delta * 0.6;
    }

    // Periodic town growth: windmill produces food
    const hasWindmill = this.buildings.some(b => b.type === 'windmill');
    if (hasWindmill) {
      this.foodTimer = (this.foodTimer || 0) + delta;
      if (this.foodTimer > 8) {
        this.foodTimer = 0;
        this.resources.food += 3;
      }
    }

    // Market Square generates trade resources periodically
    const hasMarket = this.buildings.some(b => b.type === 'marketSquare');
    if (hasMarket) {
      this.marketTimer = (this.marketTimer || 0) + delta;
      if (this.marketTimer > 12) {
        this.marketTimer = 0;
        this.resources.food += 2;
        this.resources.wood += 2;
        this.resources.stone += 2;
      }
    }

    // Regrow harvested wheat and farm crops
    if (this.wheatCrops) {
      this.wheatCrops.forEach(c => {
        if (!c.ripe) {
          c.harvestTimer -= delta;
          if (c.harvestTimer <= 0) {
            c.ripe = true;
            c.mesh.scale.set(1, 1, 1);
          } else {
            const growth = 1.0 - (c.harvestTimer / 18);
            const s = 0.25 + growth * 0.75;
            c.mesh.scale.set(s, s, s);
          }
        }
      });
    }

    // Periodic check to auto-start projects and plan next expansion stages
    this.projectCheckTimer = (this.projectCheckTimer || 0) + delta;
    if (this.projectCheckTimer > 3.0) {
      this.projectCheckTimer = 0;
      this.checkQueueNextExpansionProjects();
      this.checkAutoStartProject();
    }
  }

  // =========================================================================
  // PHYSICAL BARRIERS & OBSTACLE COLLISION DETECTION (PREVENTS WALL HACK!)
  // =========================================================================
  resolveMovementCollision(prevX, prevZ, nextX, nextZ, creatureRadius = 0.45) {
    let resolvedX = nextX;
    let resolvedZ = nextZ;
    let blocked = false;

    // 1. Village Fortified Palisade Walls (Line-Segment Collision against Wall Chains)
    const minWallDist = 0.65 + creatureRadius;
    const minWallDistSq = minWallDist * minWallDist;

    const segmentsIntersect = (x1, y1, x2, y2, x3, y3, x4, y4) => {
      const det = (x2 - x1) * (y4 - y3) - (y2 - y1) * (x4 - x3);
      if (Math.abs(det) < 1e-6) return false;
      const lambda = ((y4 - y3) * (x4 - x1) + (x3 - x4) * (y4 - y1)) / det;
      const gamma = ((y1 - y2) * (x4 - x1) + (x2 - x1) * (y4 - y1)) / det;
      return (lambda >= 0 && lambda <= 1) && (gamma >= 0 && gamma <= 1);
    };

    if (this.fenceSegments && this.fenceSegments.length > 0) {
      for (let i = 0; i < this.fenceSegments.length; i++) {
        const seg = this.fenceSegments[i];

        // Raycast crossing test: prevents stepping across fence in high speed frames
        if (segmentsIntersect(prevX, prevZ, resolvedX, resolvedZ, seg.x1, seg.z1, seg.x2, seg.z2)) {
          blocked = true;
          resolvedX = prevX;
          resolvedZ = prevZ;
          break;
        }

        // Closest point on line segment test: keeps physical barrier distance
        const dx = seg.x2 - seg.x1;
        const dz = seg.z2 - seg.z1;
        const lenSq = seg.lenSq || (dx * dx + dz * dz);
        if (lenSq === 0) continue;

        let t = ((resolvedX - seg.x1) * dx + (resolvedZ - seg.z1) * dz) / lenSq;
        t = Math.max(0, Math.min(1, t));

        const projX = seg.x1 + t * dx;
        const projZ = seg.z1 + t * dz;
        const distSq = (resolvedX - projX) * (resolvedX - projX) + (resolvedZ - projZ) * (resolvedZ - projZ);

        if (distSq < minWallDistSq) {
          blocked = true;
          const dist = Math.sqrt(distSq);
          if (dist > 0.001) {
            const push = (minWallDist - dist) + 0.04;
            resolvedX += ((resolvedX - projX) / dist) * push;
            resolvedZ += ((resolvedZ - projZ) / dist) * push;
          } else {
            resolvedX = prevX;
            resolvedZ = prevZ;
          }
        }
      }
    }

    // 2. Farm Fence Collision (x: 37 to 55, z: 49 to 63)
    const farmMinX = 37.0 - creatureRadius;
    const farmMaxX = 55.0 + creatureRadius;
    const farmMinZ = 49.0 - creatureRadius;
    const farmMaxZ = 63.0 + creatureRadius;

    const wasInsideFarm = (prevX >= 37.2 && prevX <= 54.8 && prevZ >= 49.2 && prevZ <= 62.8);
    const isNowInsideFarm = (resolvedX >= farmMinX && resolvedX <= farmMaxX && resolvedZ >= farmMinZ && resolvedZ <= farmMaxZ);

    if (wasInsideFarm !== isNowInsideFarm) {
      // Check if crossing through the South farm gate opening (x in [43.5, 48.5] at z ~ 49)
      const nearFarmGate = (Math.abs(resolvedZ - 49) < 2.0 && resolvedX >= 43.5 && resolvedX <= 48.5);
      if (!nearFarmGate) {
        blocked = true;
        if (wasInsideFarm) {
          resolvedX = Math.max(37.6, Math.min(54.4, resolvedX));
          resolvedZ = Math.max(49.6, Math.min(62.4, resolvedZ));
        } else {
          if (prevX < 37) resolvedX = Math.min(resolvedX, 37.0 - creatureRadius - 0.1);
          else if (prevX > 55) resolvedX = Math.max(resolvedX, 55.0 + creatureRadius + 0.1);
          if (prevZ > 63) resolvedZ = Math.max(resolvedZ, 63.0 + creatureRadius + 0.1);
          else if (prevZ < 49) resolvedZ = Math.min(resolvedZ, 49.0 - creatureRadius - 0.1);
        }
      }
    }

    // 3. Dynamic Solid Buildings Collision (All constructed village structures)
    const baseObstacles = [
      { x: 80, z: 50, rx: 4.0, rz: 3.5 }, // Cottage A
      { x: 86, z: 28, rx: 4.0, rz: 3.5 }, // Cottage B
      { x: 54, z: 14, rx: 4.4, rz: 3.5 }, // Sawmill
      { x: 64, z: 38, radius: 2.1 }        // Stone Well
    ];

    const allObstacles = [...baseObstacles];
    if (this.buildings) {
      for (let i = 0; i < this.buildings.length; i++) {
        const b = this.buildings[i];
        if (['cottage', 'blacksmith', 'watchtower', 'windmill', 'marketSquare', 'barracks', 'townHall'].includes(b.type)) {
          const p = b.position || b.pos;
          if (p) {
            allObstacles.push({
              x: p.x,
              z: p.z,
              rx: b.rx || 3.8,
              rz: b.rz || 3.4
            });
          }
        }
      }
    }

    for (let i = 0; i < allObstacles.length; i++) {
      const b = allObstacles[i];
      if (b.radius) {
        const d = Math.hypot(resolvedX - b.x, resolvedZ - b.z);
        const minDist = b.radius + creatureRadius;
        if (d < minDist) {
          blocked = true;
          const a = Math.atan2(resolvedZ - b.z, resolvedX - b.x);
          resolvedX = b.x + Math.cos(a) * minDist;
          resolvedZ = b.z + Math.sin(a) * minDist;
        }
      } else {
        const dx = Math.abs(resolvedX - b.x);
        const dz = Math.abs(resolvedZ - b.z);
        const halfX = b.rx + creatureRadius;
        const halfZ = b.rz + creatureRadius;
        if (dx < halfX && dz < halfZ) {
          blocked = true;
          const penX = halfX - dx;
          const penZ = halfZ - dz;
          if (penX < penZ) {
            resolvedX = b.x + (resolvedX > b.x ? halfX : -halfX);
          } else {
            resolvedZ = b.z + (resolvedZ > b.z ? halfZ : -halfZ);
          }
        }
      }
    }

    return { x: resolvedX, z: resolvedZ, blocked };
  }

  // If moving between inside and outside the village palisade, route cleanly through the open gate
  getGateWaypoint(currentPos, targetPos) {
    if (!this.gates || this.gates.length === 0) return null;

    const curInside = this.isInsideVillage(currentPos.x, currentPos.z);
    const tarInside = this.isInsideVillage(targetPos.x, targetPos.z);

    // If both inside or both outside, direct travel is fine
    if (curInside === tarInside) return null;

    let bestGate = null;
    let minRouteCost = Infinity;

    if (curInside && !tarInside) {
      // Inside heading OUT: find gate that minimizes path to insidePos then outsidePos to targetPos
      for (let i = 0; i < this.gates.length; i++) {
        const g = this.gates[i];
        const inPt = g.insidePos || g.pos;
        const outPt = g.outsidePos || g.pos;
        const cost = Math.hypot(currentPos.x - inPt.x, currentPos.z - inPt.z) +
                     Math.hypot(targetPos.x - outPt.x, targetPos.z - outPt.z);
        if (cost < minRouteCost) {
          minRouteCost = cost;
          bestGate = g;
        }
      }

      if (bestGate) {
        const inPt = bestGate.insidePos || bestGate.pos;
        const outPt = bestGate.outsidePos || bestGate.pos;

        const dirX = outPt.x - inPt.x;
        const dirZ = outPt.z - inPt.z;
        const lenSq = dirX * dirX + dirZ * dirZ;

        if (lenSq > 0.001) {
          // Progress vector along insidePos -> outsidePos
          const toCurX = currentPos.x - inPt.x;
          const toCurZ = currentPos.z - inPt.z;
          const progress = (toCurX * dirX + toCurZ * dirZ) / lenSq;

          // If creature has not yet reached the inside threshold, steer to inside staging point
          if (progress < 0.25) {
            return inPt;
          }
          // Once at or past inside threshold, steer through the gate towards outside point
          return outPt;
        }
        return outPt;
      }
    } else {
      // Outside heading IN: find gate that minimizes path to outsidePos then insidePos to targetPos
      for (let i = 0; i < this.gates.length; i++) {
        const g = this.gates[i];
        const inPt = g.insidePos || g.pos;
        const outPt = g.outsidePos || g.pos;
        const cost = Math.hypot(currentPos.x - outPt.x, currentPos.z - outPt.z) +
                     Math.hypot(targetPos.x - inPt.x, targetPos.z - inPt.z);
        if (cost < minRouteCost) {
          minRouteCost = cost;
          bestGate = g;
        }
      }

      if (bestGate) {
        const inPt = bestGate.insidePos || bestGate.pos;
        const outPt = bestGate.outsidePos || bestGate.pos;

        const dirX = inPt.x - outPt.x;
        const dirZ = inPt.z - outPt.z;
        const lenSq = dirX * dirX + dirZ * dirZ;

        if (lenSq > 0.001) {
          // Progress vector along outsidePos -> insidePos
          const toCurX = currentPos.x - outPt.x;
          const toCurZ = currentPos.z - outPt.z;
          const progress = (toCurX * dirX + toCurZ * dirZ) / lenSq;

          // If creature has not yet reached outside threshold, steer to outside point
          if (progress < 0.25) {
            return outPt;
          }
          // Once at or past outside threshold, steer through the gate into the settlement
          return inPt;
        }
        return inPt;
      }
    }

    return null;
  }
}
