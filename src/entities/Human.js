import * as THREE from 'three';
import { Animal } from './Animal.js';
import { CreatureModels } from './CreatureModels.js';

const VILLAGER_NAMES = [
  'Leo', 'Mia', 'Liam', 'Emma', 'Noah', 'Olivia', 'Lucas', 'Sophia',
  'Ethan', 'Ava', 'Marcus', 'Elena', 'Torin', 'Freya', 'Gideon', 'Rowan'
];
const PROFESSIONS = ['Farmer', 'Lumberjack', 'Stonemason', 'Builder', 'Hunter', 'Guard', 'Blacksmith'];

export class Human extends Animal {
  constructor(scene, terrain, village, options = {}) {
    super('Villager', scene, terrain, {
      walkSpeed: 2.8,
      runSpeed: 5.6,
      ...options
    });

    this.village = village;
    this.name = options.name || VILLAGER_NAMES[Math.floor(Math.random() * VILLAGER_NAMES.length)];
    this.profession = options.profession || PROFESSIONS[Math.floor(Math.random() * PROFESSIONS.length)];
    this.happiness = 98;
    this.health = 100;
    this.maxHealth = 100;
    this.hunger = 20;
    this.thirst = 15;
    this.energy = 90;

    // Assigned home & workstations
    this.homeCottage = (Math.random() < 0.5)
      ? new THREE.Vector3(80, 0, 50)
      : new THREE.Vector3(86, 0, 28);
    this.workstation = this.getProfessionWorkstation();

    // Equipment state
    this.equipment = {
      weapon: 'none',
      helmet: 'straw',
      armor: false,
      shield: false,
      carried: 'none'
    };

    // Inventory & Task tracking
    this.inventory = { wood: 0, stone: 0, meat: 0, food: 0 };
    this.targetResource = null;
    this.targetThreat = null;
    this.targetPrey = null;

    this.state = 'WALK_PATH';
    this.stateTimer = 4 + Math.random() * 5;
    this.targetWaypoint = null;

    this.initModel();
    this.assignInitialGear();
    this.pickPathWaypoint();
  }

  getProfessionWorkstation() {
    switch (this.profession) {
      case 'Farmer':
        return new THREE.Vector3(46 + (Math.random() - 0.5) * 3, 0, 56 + (Math.random() - 0.5) * 3);
      case 'Lumberjack':
        return new THREE.Vector3(54 + (Math.random() - 0.5) * 3, 0, 14 + (Math.random() - 0.5) * 3);
      case 'Stonemason':
        return new THREE.Vector3(38 + (Math.random() - 0.5) * 3, 0, 20 + (Math.random() - 0.5) * 3);
      case 'Builder':
        return new THREE.Vector3(84 + (Math.random() - 0.5) * 4, 0, 32 + (Math.random() - 0.5) * 4);
      case 'Hunter':
        return new THREE.Vector3(45 + (Math.random() - 0.5) * 6, 0, 42 + (Math.random() - 0.5) * 6);
      case 'Guard':
        return new THREE.Vector3(50 + (Math.random() - 0.5) * 8, 0, 50 + (Math.random() - 0.5) * 8);
      case 'Blacksmith':
        return new THREE.Vector3(72 + (Math.random() - 0.5) * 2, 0, 16 + (Math.random() - 0.5) * 2);
      default:
        return new THREE.Vector3(65 + (Math.random() - 0.5) * 5, 0, 35 + (Math.random() - 0.5) * 5);
    }
  }

  initModel() {
    // Pass profession to customize tunic and attire
    const modelData = CreatureModels.createHumanModel({ profession: this.profession });
    this.bindModelData(modelData);
  }

  assignInitialGear() {
    switch (this.profession) {
      case 'Farmer':
        this.equipment.weapon = 'hoe';
        this.equipment.helmet = 'straw';
        this.equipment.armor = false;
        this.equipment.shield = false;
        break;
      case 'Lumberjack':
        this.equipment.weapon = 'axe';
        this.equipment.helmet = 'straw';
        this.equipment.armor = false;
        this.equipment.shield = false;
        break;
      case 'Stonemason':
        this.equipment.weapon = 'pickaxe';
        this.equipment.helmet = 'straw';
        this.equipment.armor = false;
        this.equipment.shield = false;
        break;
      case 'Builder':
        this.equipment.weapon = 'hammer';
        this.equipment.helmet = 'straw';
        this.equipment.armor = false;
        this.equipment.shield = false;
        break;
      case 'Hunter':
        this.equipment.weapon = Math.random() < 0.5 ? 'spear' : 'bow';
        this.equipment.helmet = 'straw';
        this.equipment.armor = false;
        this.equipment.shield = false;
        break;
      case 'Guard':
        this.equipment.weapon = 'sword';
        this.equipment.helmet = 'iron';
        this.equipment.armor = true;
        this.equipment.shield = true;
        this.health = 140;
        this.maxHealth = 140;
        break;
      case 'Blacksmith':
        this.equipment.weapon = 'hammer';
        this.equipment.helmet = 'straw';
        this.equipment.armor = false;
        this.equipment.shield = false;
        break;
    }
    this.applyGearVisuals();
  }

  applyGearVisuals() {
    if (!this.modelData || !this.modelData.gear) return;

    const { gear } = this.modelData;

    // Helmets
    if (gear.strawHat) gear.strawHat.visible = (this.equipment.helmet === 'straw');
    if (gear.ironHelmet) gear.ironHelmet.visible = (this.equipment.helmet === 'iron');

    // Body Armor
    if (gear.ironArmor) gear.ironArmor.visible = !!this.equipment.armor;

    // Right-Hand Weapon/Tool (Only active task tool is shown!)
    if (gear.weapons) {
      Object.keys(gear.weapons).forEach(wKey => {
        gear.weapons[wKey].visible = (this.equipment.weapon === wKey);
      });
    }

    // Left-Hand Items & Shield
    if (gear.heldItems) {
      gear.heldItems.shield.visible = !!this.equipment.shield;
      gear.heldItems.log.visible = (this.equipment.carried === 'log');
      gear.heldItems.stone.visible = (this.equipment.carried === 'stone');
      gear.heldItems.meat.visible = (this.equipment.carried === 'meat');
      if (gear.heldItems.wheat) gear.heldItems.wheat.visible = (this.equipment.carried === 'wheat');
    }
  }

  takeDamage(amount, attacker) {
    if (!this.isAlive) return;

    // Armor and shield mitigation
    let actualDamage = amount;
    if (this.equipment.shield) actualDamage *= 0.55;
    if (this.equipment.armor) actualDamage *= 0.7;

    this.health = Math.max(0, this.health - actualDamage);
    this.stateTimer = Math.max(this.stateTimer, 5.0);

    // Alert village guards so defenders rush to defend citizens
    if (attacker && this.ecosystem) {
      this.ecosystem.alertGuards(attacker);
    }

    if (this.profession === 'Guard') {
      if (this.state !== 'ATTACK_BEAST') {
        this.targetThreat = attacker;
        this.state = 'ATTACK_BEAST';
      }
    } else {
      if (this.state !== 'FLEE_DANGER') {
        this.state = 'FLEE_DANGER';
        this.stateTimer = 10.0;
        this.village?.logEvent(`🚨 ${this.name} is under attack by a prowling ${attacker.species || 'Beast'}!`, 'combat');
      }
    }

    if (this.health <= 0) {
      this.die(`Slain by ${attacker?.species || 'Predator'}`);
      this.village?.logEvent(`☠️ ${this.name} the ${this.profession} was tragically lost to a wild ${attacker?.species || 'Predator'}!`, 'combat');
    }
  }

  die(cause = 'natural') {
    if (!this.isAlive) return;
    this.isAlive = false;
    this.state = 'DEAD';
    this.deathCause = cause;
    this.currentSpeed = 0;
    this.health = 0;

    // Transfer carried resources into village stockpiles
    if (this.village) {
      if (this.inventory.wood > 0) {
        this.village.resources.wood += this.inventory.wood;
        this.inventory.wood = 0;
      }
      if (this.inventory.stone > 0) {
        this.village.resources.stone += this.inventory.stone;
        this.inventory.stone = 0;
      }
      if (this.inventory.food > 0) {
        this.village.resources.food += this.inventory.food;
        this.inventory.food = 0;
      }
    }

    // Hide held weapons and tools so they don't stiffly stick into the air
    if (this.modelData && this.modelData.gear) {
      const { gear } = this.modelData;
      if (gear.weapons) {
        Object.values(gear.weapons).forEach(w => { if (w) w.visible = false; });
      }
      if (gear.heldItems) {
        Object.values(gear.heldItems).forEach(h => { if (h) h.visible = false; });
      }
    }

    // Pose body flat on the ground in a peaceful resting pose
    if (this.mesh) {
      const groundY = this.terrain.getHeight(this.position.x, this.position.z);
      this.mesh.rotation.order = 'YXZ';
      this.mesh.rotation.y = this.yaw;
      // Pitch backward onto the ground (lying flat on back)
      this.mesh.rotation.x = -Math.PI * 0.48;
      this.mesh.rotation.z = 0;
      // Lower to ground surface
      this.mesh.position.set(this.position.x, groundY + 0.16, this.position.z);

      // Relax limbs
      if (this.modelData) {
        if (this.modelData.legs) {
          this.modelData.legs.forEach(l => { if (l) l.rotation.set(0, 0, 0); });
        }
        if (this.modelData.arms) {
          this.modelData.arms.forEach(a => { if (a) a.rotation.set(0, 0, 0); });
        }
      }

      // After 3.5 seconds, respectfully lay the villager to rest with a memorial marker
      setTimeout(() => {
        if (this.mesh && this.mesh.parent) {
          this.scene.remove(this.mesh);
        }
        this.createMemorialHeadstone();
      }, 3500);
    }
  }

  createMemorialHeadstone() {
    const groundY = this.terrain.getHeight(this.position.x, this.position.z);
    const headstoneGroup = new THREE.Group();
    headstoneGroup.position.set(this.position.x, groundY, this.position.z);

    const stoneMat = new THREE.MeshStandardMaterial({ color: 0x475569, roughness: 0.85, flatShading: true });
    const darkStoneMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.9, flatShading: true });
    const flowerMatP = new THREE.MeshStandardMaterial({ color: 0xa855f7, roughness: 0.6, flatShading: true }); // Purple lavender
    const flowerMatY = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.6, flatShading: true }); // Yellow daisy
    const stemMat = new THREE.MeshStandardMaterial({ color: 0x15803d });

    // Base stone mound
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.12, 0.35), darkStoneMat);
    base.position.y = 0.06;
    base.castShadow = true;
    headstoneGroup.add(base);

    // Carved stone tablet with arched top
    const tablet = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.65, 0.14), stoneMat);
    tablet.position.y = 0.44;
    tablet.castShadow = true;
    headstoneGroup.add(tablet);

    const arch = new THREE.Mesh(new THREE.CylinderGeometry(0.21, 0.21, 0.14, 10), stoneMat);
    arch.rotation.z = Math.PI * 0.5;
    arch.position.y = 0.76;
    arch.castShadow = true;
    headstoneGroup.add(arch);

    // Carved cross insignia
    const crossV = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.26, 0.02), darkStoneMat);
    crossV.position.set(0, 0.55, 0.08);
    const crossH = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.04, 0.02), darkStoneMat);
    crossH.position.set(0, 0.61, 0.08);
    headstoneGroup.add(crossV, crossH);

    // Wildflowers blooming at the foot of the memorial
    const offsets = [
      { x: -0.22, z: 0.14, mat: flowerMatP },
      { x: -0.12, z: 0.18, mat: flowerMatY },
      { x: 0.14, z: 0.16, mat: flowerMatP },
      { x: 0.22, z: 0.12, mat: flowerMatY }
    ];
    offsets.forEach(off => {
      const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.22, 4), stemMat);
      stem.position.set(off.x, 0.11, off.z);
      const blossom = new THREE.Mesh(new THREE.SphereGeometry(0.045, 5, 4), off.mat);
      blossom.position.set(off.x, 0.24, off.z);
      headstoneGroup.add(stem, blossom);
    });

    // Cozy candle light
    const candleGlow = new THREE.PointLight(0xfef08a, 0.65, 4);
    candleGlow.position.set(0, 0.6, 0.2);
    headstoneGroup.add(candleGlow);

    // Enable click raycasting on the memorial headstone
    headstoneGroup.userData.entity = this;
    headstoneGroup.traverse(child => {
      child.userData.entity = this;
    });

    this.memorialMesh = headstoneGroup;
    this.scene.add(headstoneGroup);
    this.village?.logEvent(`🪦 A memorial headstone was placed honoring ${this.name} the ${this.profession}.`, 'info');
  }

  updateVitals(delta) {
    if (!this.isAlive) return;

    this.age += delta * 0.05;
    this.hunger = Math.min(65, this.hunger + delta * 0.15);
    this.thirst = Math.min(65, this.thirst + delta * 0.2);

    if (this.state === 'REST_COTTAGE') {
      this.energy = Math.min(100, this.energy + delta * 18);
      this.hunger = Math.max(10, this.hunger - delta * 12);
      this.health = Math.min(this.maxHealth, this.health + delta * 20);
    } else if (this.state === 'VISIT_WELL') {
      this.thirst = Math.max(5, this.thirst - delta * 30);
    } else {
      this.energy = Math.max(25, this.energy - delta * 0.6);
      // Gentle passive recovery when not in combat
      if (this.state !== 'ATTACK_BEAST' && this.state !== 'FLEE_DANGER') {
        this.health = Math.min(this.maxHealth, this.health + delta * 1.5);
      }
    }

    if (this.age > this.maxAge || this.health <= 0) {
      this.die(this.health <= 0 ? 'Starvation/Thirst' : 'Old Age');
    }
  }

  animateLimbs(delta) {
    if (!this.modelData || !this.isAlive) return;

    const { legs, arms } = this.modelData;

    if (legs && legs.length >= 2) {
      if (this.currentSpeed > 0.1) {
        this.legCycle += delta * this.currentSpeed * 4.2;
        const swing = Math.sin(this.legCycle) * 0.6;

        legs[0].rotation.x = swing;
        legs[1].rotation.x = -swing;

        if (arms && arms.length >= 2 && !['CHOP_TREE', 'MINE_ROCK', 'BUILD', 'ATTACK_BEAST', 'FORGE', 'TEND_FARM', 'HARVEST_CROPS'].includes(this.state)) {
          arms[0].rotation.x = -swing * 0.7;
          arms[1].rotation.x = swing * 0.7;
        }
      } else {
        legs[0].rotation.x = THREE.MathUtils.lerp(legs[0].rotation.x, 0, delta * 6);
        legs[1].rotation.x = THREE.MathUtils.lerp(legs[1].rotation.x, 0, delta * 6);

        if (arms && arms.length >= 2 && !['CHOP_TREE', 'MINE_ROCK', 'BUILD', 'ATTACK_BEAST', 'FORGE', 'TEND_FARM', 'HARVEST_CROPS'].includes(this.state)) {
          arms[0].rotation.x = THREE.MathUtils.lerp(arms[0].rotation.x, 0, delta * 6);
          arms[1].rotation.x = THREE.MathUtils.lerp(arms[1].rotation.x, 0, delta * 6);
        }
      }
    }

    // Work / Combat swing animations
    if (arms && arms.length >= 2) {
      const time = performance.now() * 0.01;
      if (['CHOP_TREE', 'MINE_ROCK', 'BUILD', 'FORGE', 'TEND_FARM'].includes(this.state)) {
        arms[1].rotation.x = Math.sin(time) * 0.9 + 0.4; // Right arm tool swing
      } else if (this.state === 'HARVEST_CROPS') {
        arms[0].rotation.x = Math.sin(time * 0.8) * 0.5 - 0.4; // Bend and gather
        arms[1].rotation.x = Math.sin(time * 0.8) * 0.5 - 0.4;
      } else if (this.state === 'ATTACK_BEAST') {
        arms[1].rotation.x = Math.sin(time * 1.5) * 1.1 + 0.3; // Rapid sword slash
        if (this.equipment.shield) {
          arms[0].rotation.x = -0.6; // Raise shield
        }
      }
    }
  }

  update(delta, ecosystem) {
    this.ecosystem = ecosystem;
    if (!this.isAlive) return;

    this.updateVitals(delta);
    this.stateTimer -= delta;

    // Check for nearby predator threats
    this.checkForPredators(ecosystem);

    // Compute anti-crowding separation force so villagers never freeze or clump together!
    const sep = (ecosystem && ecosystem.getSeparationVector)
      ? ecosystem.getSeparationVector(this, ecosystem.villagers, 2.8)
      : null;

    switch (this.state) {
      // -----------------------------------------------------------------------
      // 1. RESOURCE GATHERING & HAULING
      // -----------------------------------------------------------------------
      case 'SEEK_TREE':
        if (!this.targetResource || this.targetResource.isHarvested) {
          this.targetResource = ecosystem.biomeScatter.getNearestTree(this.position, 95);
        }
        if (this.targetResource) {
          this.steerTowards(this.targetResource.position, this.walkSpeed, delta, sep);
          if (this.horizontalDistanceTo(this.targetResource.position) < 3.2) {
            this.state = 'CHOP_TREE';
            this.stateTimer = 4.2;
            this.equipment.weapon = 'axe';
            this.applyGearVisuals();
          } else if (this.stateTimer <= 0) {
            this.decideNextVillagerAction();
          }
        } else {
          this.decideNextVillagerAction();
        }
        break;

      case 'CHOP_TREE':
        this.currentSpeed = 0;
        this.updatePositionOnTerrain();
        if (this.stateTimer <= 0) {
          if (this.targetResource && !this.targetResource.isHarvested) {
            const yieldWood = ecosystem.biomeScatter.chopTree(this.targetResource);
            this.inventory.wood = yieldWood;
            this.equipment.carried = 'log';
            this.equipment.weapon = 'none';
            this.applyGearVisuals();
          }
          this.state = 'HAUL_RESOURCE';
          this.stateTimer = 18.0;
          this.targetResource = null;
        }
        break;

      case 'SEEK_ROCK':
        if (!this.targetResource || this.targetResource.isHarvested) {
          this.targetResource = ecosystem.biomeScatter.getNearestRock(this.position, 95);
        }
        if (this.targetResource) {
          this.steerTowards(this.targetResource.position, this.walkSpeed, delta, sep);
          if (this.horizontalDistanceTo(this.targetResource.position) < 3.0) {
            this.state = 'MINE_ROCK';
            this.stateTimer = 4.0;
            this.equipment.weapon = 'pickaxe';
            this.applyGearVisuals();
          } else if (this.stateTimer <= 0) {
            this.decideNextVillagerAction();
          }
        } else {
          this.decideNextVillagerAction();
        }
        break;

      case 'MINE_ROCK':
        this.currentSpeed = 0;
        this.updatePositionOnTerrain();
        if (this.stateTimer <= 0) {
          if (this.targetResource && !this.targetResource.isHarvested) {
            const yieldStone = ecosystem.biomeScatter.mineRock(this.targetResource);
            this.inventory.stone = yieldStone;
            this.equipment.carried = 'stone';
            this.equipment.weapon = 'none';
            this.applyGearVisuals();
          }
          this.state = 'HAUL_RESOURCE';
          this.stateTimer = 18.0;
          this.targetResource = null;
        }
        break;

      case 'HAUL_RESOURCE':
        const stockpilePos = this.village.stockpilePos || new THREE.Vector3(60, 0, 18);
        this.steerTowards(stockpilePos, this.walkSpeed * 0.95, delta, sep);
        if (this.horizontalDistanceTo(stockpilePos) < 3.5 || this.stateTimer <= 0) {
          if (this.inventory.wood > 0) {
            this.village.addWood(this.inventory.wood, this.name);
            this.inventory.wood = 0;
          }
          if (this.inventory.stone > 0) {
            this.village.addStone(this.inventory.stone, this.name);
            this.inventory.stone = 0;
          }
          if (this.inventory.meat > 0) {
            this.village.addFood(this.inventory.meat, this.name);
            this.inventory.meat = 0;
          }
          if (this.inventory.food > 0) {
            this.village.addFood(this.inventory.food, this.name);
            this.inventory.food = 0;
          }
          this.equipment.carried = 'none';
          this.applyGearVisuals();
          this.decideNextVillagerAction();
        }
        break;

      // -----------------------------------------------------------------------
      // 2. AGRICULTURE & FARMING
      // -----------------------------------------------------------------------
      case 'SEEK_FARM':
        const farmPlot = this.village.getFarmPlot();
        if (farmPlot) {
          const targetFarmPos = Math.random() < 0.5 ? farmPlot.tendingPos : farmPlot.harvestPos;
          this.steerTowards(targetFarmPos, this.walkSpeed, delta, sep);
          if (this.horizontalDistanceTo(targetFarmPos) < 3.2) {
            if (Math.random() < 0.5) {
              this.state = 'TEND_FARM';
              this.stateTimer = 4.2;
            } else {
              this.state = 'HARVEST_CROPS';
              this.stateTimer = 3.8;
            }
            this.equipment.weapon = 'hoe';
            this.applyGearVisuals();
          } else if (this.stateTimer <= 0) {
            this.decideNextVillagerAction();
          }
        } else {
          this.decideNextVillagerAction();
        }
        break;

      case 'TEND_FARM':
        this.currentSpeed = 0;
        this.updatePositionOnTerrain();
        if (this.stateTimer <= 0) {
          this.village.logEvent(`🌱 Farmer ${this.name} weeded and tilled the wheat field rows.`, 'resource');
          this.state = 'HARVEST_CROPS';
          this.stateTimer = 3.5;
        }
        break;

      case 'HARVEST_CROPS':
        this.currentSpeed = 0;
        this.updatePositionOnTerrain();
        if (this.stateTimer <= 0) {
          const harvestedYield = this.village.harvestWheat();
          this.inventory.food = harvestedYield;
          this.equipment.weapon = 'none';
          this.equipment.carried = 'wheat';
          this.applyGearVisuals();
          this.state = 'HAUL_RESOURCE';
          this.stateTimer = 18.0;
          this.village.logEvent(`🌾 Farmer ${this.name} harvested ${harvestedYield} bundles of Golden Wheat!`, 'resource');
        }
        break;

      // -----------------------------------------------------------------------
      // 3. CONSTRUCTION & EXPANSION
      // -----------------------------------------------------------------------
      case 'SEEK_CONSTRUCTION':
        const activeProj = this.village.getActiveProject();
        if (activeProj) {
          this.steerTowards(activeProj.pos, this.walkSpeed, delta, sep);
          if (this.horizontalDistanceTo(activeProj.pos) < 4.5) {
            this.state = 'BUILD';
            this.stateTimer = 12.0;
            this.equipment.weapon = 'hammer';
            this.applyGearVisuals();
          } else if (this.stateTimer <= 0) {
            this.decideNextVillagerAction();
          }
        } else {
          this.decideNextVillagerAction();
        }
        break;

      case 'BUILD':
        this.currentSpeed = 0;
        this.updatePositionOnTerrain();
        const currentBuilding = this.village.getActiveProject();
        if (currentBuilding) {
          this.village.advanceProject(currentBuilding, delta * 7.5);
          if (currentBuilding.status === 'COMPLETED' || this.stateTimer <= 0) {
            this.decideNextVillagerAction();
          }
        } else {
          this.decideNextVillagerAction();
        }
        break;

      // -----------------------------------------------------------------------
      // 4. HUNTING WILDLIFE
      // -----------------------------------------------------------------------
      case 'SEEK_PREY':
        if (!this.targetPrey || !this.targetPrey.isAlive) {
          this.targetPrey = ecosystem.getNearestRabbit(this.position, 60) ||
                            ecosystem.getNearestPrey(this.position, 60);
        }
        if (this.targetPrey && this.targetPrey.isAlive) {
          this.steerTowards(this.targetPrey.position, this.runSpeed * 0.9, delta, sep);
          if (this.horizontalDistanceTo(this.targetPrey.position) < 3.2) {
            this.targetPrey.health -= delta * 60;
            if (this.targetPrey.health <= 0) {
              this.targetPrey.die();
              this.inventory.meat = 20;
              this.equipment.carried = 'meat';
              this.equipment.weapon = 'none';
              this.applyGearVisuals();
              this.state = 'HAUL_RESOURCE';
              this.stateTimer = 18.0;
              this.targetPrey = null;
            }
          } else if (this.stateTimer <= 0) {
            this.decideNextVillagerAction();
          }
        } else {
          this.decideNextVillagerAction();
        }
        break;

      // -----------------------------------------------------------------------
      // 5. COMBAT & VILLAGE DEFENSE
      // -----------------------------------------------------------------------
      case 'ATTACK_BEAST':
        if (this.targetThreat && this.targetThreat.isAlive) {
          this.steerTowards(this.targetThreat.position, this.runSpeed, delta, sep);
          const dist = this.horizontalDistanceTo(this.targetThreat.position);
          if (dist < 3.5) {
            // Guard strikes with sword
            this.targetThreat.health -= delta * 38;
            this.health -= delta * 5; // Minor scratch absorbed by shield/armor

            if (this.targetThreat.health <= 0) {
              this.targetThreat.die();
              this.village.logEvent(`⚔️ Guard ${this.name} heroically slain a marauding ${this.targetThreat.species || 'Beast'}!`, 'combat');
              this.inventory.meat = 25;
              this.equipment.carried = 'meat';
              this.equipment.weapon = 'none';
              this.applyGearVisuals();
              this.targetThreat = null;
              this.state = 'HAUL_RESOURCE';
              this.stateTimer = 18.0;
            }
          }
        } else {
          this.targetThreat = null;
          this.state = 'PATROL_PERIMETER';
          this.stateTimer = 10;
        }
        break;

      case 'FLEE_DANGER':
        // Run screaming back to village center
        const townCenter = this.village.villageCenter || new THREE.Vector3(65, 0, 35);
        this.steerTowards(townCenter, this.runSpeed, delta, sep);
        if (this.horizontalDistanceTo(townCenter) < 8.0 || this.stateTimer <= 0) {
          this.state = 'REST_COTTAGE';
        }
        break;

      case 'PATROL_PERIMETER':
        if (!this.targetWaypoint) {
          // Patrol either a gate or perimeter wall point
          if (this.village.gates && this.village.gates.length > 0 && Math.random() < 0.6) {
            const gate = this.village.gates[Math.floor(Math.random() * this.village.gates.length)];
            this.targetWaypoint = gate.pos.clone().add(new THREE.Vector3((Math.random() - 0.5) * 2, 0, (Math.random() - 0.5) * 2));
          } else {
            const angle = Math.random() * Math.PI * 2;
            const r = 38 + Math.random() * 10;
            const wx = 65 + Math.cos(angle) * r;
            const wz = 35 + Math.sin(angle) * r;
            this.targetWaypoint = new THREE.Vector3(wx, this.terrain.getHeight(wx, wz), wz);
          }
        }
        this.steerTowards(this.targetWaypoint, this.walkSpeed, delta, sep);
        if (this.horizontalDistanceTo(this.targetWaypoint) < 3.5 || this.stateTimer <= 0) {
          this.targetWaypoint = null;
          this.decideNextVillagerAction();
        }
        break;

      // -----------------------------------------------------------------------
      // 6. BLACKSMITH FORGE & CRAFTING
      // -----------------------------------------------------------------------
      case 'FORGE':
        this.currentSpeed = 0;
        this.updatePositionOnTerrain();
        if (this.stateTimer <= 0) {
          this.village.craftEquipment();
          this.decideNextVillagerAction();
        }
        break;

      // -----------------------------------------------------------------------
      // 7. CIVILIAN LIFE (STROLL, WELL, HOME)
      // -----------------------------------------------------------------------
      case 'WALK_PATH':
        if (!this.targetWaypoint) {
          this.pickPathWaypoint();
        }
        this.steerTowards(this.targetWaypoint, this.walkSpeed, delta, sep);
        if (this.horizontalDistanceTo(this.targetWaypoint) < 2.5 || this.stateTimer <= 0) {
          this.targetWaypoint = null;
          this.decideNextVillagerAction();
        }
        break;

      case 'VISIT_WELL':
        const wellPos = new THREE.Vector3(64, 0, 38);
        this.steerTowards(wellPos, this.walkSpeed, delta, sep);
        if (this.horizontalDistanceTo(wellPos) < 3.5 || this.stateTimer <= 0) {
          this.thirst = 10;
          this.decideNextVillagerAction();
        }
        break;

      case 'REST_COTTAGE':
        this.steerTowards(this.homeCottage, this.walkSpeed, delta, sep);
        if (this.horizontalDistanceTo(this.homeCottage) < 3.5 || this.stateTimer <= 0) {
          this.energy = 100;
          this.hunger = 15;
          // Trigger reproduction check if settlement has enough food
          if (ecosystem && ecosystem.checkVillagerReproduction) {
            ecosystem.checkVillagerReproduction(this.homeCottage);
          }
          this.decideNextVillagerAction();
        }
        break;

      case 'IDLE':
      default:
        this.currentSpeed = THREE.MathUtils.lerp(this.currentSpeed, 0, delta * 4);
        this.updatePositionOnTerrain();
        if (this.stateTimer <= 0) {
          this.decideNextVillagerAction();
        }
        break;
    }

    this.animateLimbs(delta);
  }

  checkForPredators(ecosystem) {
    if (!ecosystem) return;

    // Check wolves & bears
    const predators = [...(ecosystem.predators || []), ...(ecosystem.bears || [])];
    for (let i = 0; i < predators.length; i++) {
      const pred = predators[i];
      if (!pred.isAlive) continue;

      const d = this.horizontalDistanceTo(pred.position);

      if (this.profession === 'Guard') {
        if (d < 45 && this.state !== 'ATTACK_BEAST') {
          this.targetThreat = pred;
          this.state = 'ATTACK_BEAST';
          this.stateTimer = 18.0;
          this.equipment.weapon = 'sword';
          this.equipment.shield = true;
          this.applyGearVisuals();
          this.village.logEvent(`🛡️ Guard ${this.name} drew steel blade to defend against prowling ${pred.species || 'Wolf'}!`, 'combat');
          break;
        }
      } else {
        // Unarmed civilian panics if beast gets too close
        if (d < 24 && !['FLEE_DANGER', 'REST_COTTAGE'].includes(this.state)) {
          this.state = 'FLEE_DANGER';
          this.stateTimer = 8.0;
          this.village.logEvent(`⚠️ ${this.name} sounded the alarm: ${pred.species || 'Predator'} spotted!`, 'alert');
          // Alert nearby guards!
          ecosystem.alertGuards(pred);
          break;
        }
      }
    }
  }

  pickPathWaypoint() {
    // Diverse lively village landmarks to explore across the settlement
    const landmarks = [
      new THREE.Vector3(64, 0, 38),  // Central Stone Well
      new THREE.Vector3(80, 0, 50),  // Cottage A (Yellow Roof)
      new THREE.Vector3(86, 0, 28),  // Cottage B (Blue Roof)
      new THREE.Vector3(54, 0, 14),  // Sawmill & Woodpile
      new THREE.Vector3(46, 0, 56),  // Community Farm & Wheat Fields
      new THREE.Vector3(36, 0, 44),  // Campfire Ground
      new THREE.Vector3(34, 0, 35),  // West Gate Archway
      new THREE.Vector3(98, 0, 44),  // East Hill Gate
      new THREE.Vector3(60, 0, 20)   // Stockpile Yard
    ];

    const dest = landmarks[Math.floor(Math.random() * landmarks.length)];
    const px = dest.x + (Math.random() - 0.5) * 5;
    const pz = dest.z + (Math.random() - 0.5) * 5;
    const py = this.terrain.getHeight(px, pz);
    this.targetWaypoint = new THREE.Vector3(px, py, pz);
    this.stateTimer = 10.0 + Math.random() * 8.0;
  }

  decideNextVillagerAction() {
    this.targetWaypoint = null;

    // Vitals first
    if (this.thirst > 50) {
      this.equipment.weapon = 'none';
      this.applyGearVisuals();
      this.state = 'VISIT_WELL';
      this.stateTimer = 12.0;
      return;
    }

    if (this.energy < 35) {
      this.equipment.weapon = 'none';
      this.applyGearVisuals();
      this.state = 'REST_COTTAGE';
      this.stateTimer = 12.0;
      return;
    }

    // Role-specific action with dedicated tools!
    switch (this.profession) {
      case 'Farmer':
        this.equipment.weapon = 'hoe';
        this.equipment.carried = 'none';
        this.applyGearVisuals();
        this.state = 'SEEK_FARM';
        this.stateTimer = 16.0;
        break;

      case 'Lumberjack':
        this.equipment.weapon = 'axe';
        this.equipment.carried = 'none';
        this.applyGearVisuals();
        this.state = 'SEEK_TREE';
        this.stateTimer = 15.0;
        break;

      case 'Stonemason':
        this.equipment.weapon = 'pickaxe';
        this.equipment.carried = 'none';
        this.applyGearVisuals();
        this.state = 'SEEK_ROCK';
        this.stateTimer = 15.0;
        break;

      case 'Builder':
        if (this.village && this.village.getActiveProject()) {
          this.equipment.weapon = 'hammer';
          this.equipment.carried = 'none';
          this.applyGearVisuals();
          this.state = 'SEEK_CONSTRUCTION';
          this.stateTimer = 20.0;
        } else {
          // No construction needed: stroll through town without hammer in hand
          this.equipment.weapon = 'none';
          this.applyGearVisuals();
          this.state = 'WALK_PATH';
          this.pickPathWaypoint();
        }
        break;

      case 'Hunter':
        this.equipment.weapon = 'spear';
        this.equipment.carried = 'none';
        this.applyGearVisuals();
        this.state = 'SEEK_PREY';
        this.stateTimer = 18.0;
        break;

      case 'Guard':
        this.equipment.weapon = 'sword';
        this.equipment.shield = true;
        this.equipment.helmet = 'iron';
        this.equipment.armor = true;
        this.equipment.carried = 'none';
        this.applyGearVisuals();
        this.state = 'PATROL_PERIMETER';
        this.stateTimer = 14.0;
        break;

      case 'Blacksmith':
        this.equipment.weapon = 'hammer';
        this.equipment.carried = 'none';
        this.applyGearVisuals();
        this.state = 'FORGE';
        this.stateTimer = 8.0;
        break;

      default:
        this.equipment.weapon = 'none';
        this.applyGearVisuals();
        this.state = 'WALK_PATH';
        this.pickPathWaypoint();
        break;
    }
  }
}
