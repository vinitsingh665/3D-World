import * as THREE from 'three';
import { Herbivore } from '../entities/Herbivore.js';
import { Predator } from '../entities/Predator.js';
import { Human } from '../entities/Human.js';
import { Sheep } from '../entities/Sheep.js';
import { Rabbit } from '../entities/Rabbit.js';
import { Fox } from '../entities/Fox.js';
import { Bear } from '../entities/Bear.js';

export class Ecosystem {
  constructor(scene, terrain, biomeScatter, village = null) {
    this.scene = scene;
    this.terrain = terrain;
    this.biomeScatter = biomeScatter;
    this.village = village;

    this.herbivores = []; // Deer
    this.sheep = [];      // Cozy woolly sheep
    this.rabbits = [];    // Hopping bunnies
    this.foxes = [];      // Red foxes
    this.predators = [];  // Wolves
    this.bears = [];      // Brown bears
    this.villagers = [];  // Human villagers

    this.totalBirths = 0;
    this.totalDeaths = 0;

    this.shorelinePoints = [];
    this.findShorelines();
    this.initStartingPopulation();
  }

  findShorelines() {
    const half = this.terrain.size * 0.42;
    const step = 8;
    for (let x = -half; x <= half; x += step) {
      for (let z = -half; z <= half; z += step) {
        const h = this.terrain.getHeight(x, z);
        if (h >= this.terrain.waterLevel && h <= this.terrain.waterLevel + 1.2) {
          this.shorelinePoints.push(new THREE.Vector3(x, h, z));
        }
      }
    }
  }

  initStartingPopulation() {
    const deerCount = 18;
    const sheepCount = 14;
    const rabbitCount = 22;
    const foxCount = 6;
    const wolfCount = 5;
    const bearCount = 4;

    for (let i = 0; i < deerCount; i++) this.spawnRandomDeer();
    for (let i = 0; i < sheepCount; i++) this.spawnRandomSheep();
    for (let i = 0; i < rabbitCount; i++) this.spawnRandomRabbit();
    for (let i = 0; i < foxCount; i++) this.spawnRandomFox();
    for (let i = 0; i < wolfCount; i++) this.spawnRandomWolf();
    for (let i = 0; i < bearCount; i++) this.spawnRandomBear();

    // Initial Specialized Villager Squad
    const startingProfessions = [
      'Farmer', 'Farmer',
      'Lumberjack', 'Lumberjack',
      'Stonemason',
      'Builder',
      'Hunter',
      'Guard', 'Guard',
      'Blacksmith'
    ];
    startingProfessions.forEach(prof => {
      this.spawnVillager(null, null, null, prof);
    });
  }

  findSafeSpawnCoord() {
    const half = this.terrain.size * 0.38;
    for (let attempts = 0; attempts < 35; attempts++) {
      const x = (Math.random() - 0.5) * 2 * half;
      const z = (Math.random() - 0.5) * 2 * half;
      const y = this.terrain.getHeight(x, z);
      if (y > this.terrain.waterLevel + 1.5 && y < 18) {
        return new THREE.Vector3(x, y, z);
      }
    }
    return new THREE.Vector3(65, this.terrain.getHeight(65, 35), 35);
  }

  spawnRandomDeer() {
    const pos = this.findSafeSpawnCoord();
    return this.spawnHerbivore(pos.x, pos.z);
  }

  spawnRandomSheep() {
    // Sheep prefer grazing near the village meadow
    const angle = Math.random() * Math.PI * 2;
    const r = 20 + Math.random() * 45;
    const x = 65 + Math.cos(angle) * r;
    const z = 35 + Math.sin(angle) * r;
    return this.spawnSheep(x, z);
  }

  spawnRandomRabbit() {
    const pos = this.findSafeSpawnCoord();
    return this.spawnRabbit(pos.x, pos.z);
  }

  spawnRandomFox() {
    const pos = this.findSafeSpawnCoord();
    return this.spawnFox(pos.x, pos.z);
  }

  spawnRandomWolf() {
    const pos = this.findSafeSpawnCoord();
    return this.spawnPredator(pos.x, pos.z);
  }

  spawnRandomBear() {
    const pos = this.findSafeSpawnCoord();
    return this.spawnBear(pos.x, pos.z);
  }

  // Direct Spawners
  spawnHerbivore(x, z) {
    const d = new Herbivore(this.scene, this.terrain, {
      position: new THREE.Vector3(x, this.terrain.getHeight(x, z), z),
      age: 15 + Math.random() * 30
    });
    this.herbivores.push(d);
    this.totalBirths++;
    return d;
  }

  spawnSheep(x, z) {
    const s = new Sheep(this.scene, this.terrain, {
      position: new THREE.Vector3(x, this.terrain.getHeight(x, z), z),
      age: 15 + Math.random() * 30
    });
    this.sheep.push(s);
    this.totalBirths++;
    return s;
  }

  spawnRabbit(x, z) {
    const r = new Rabbit(this.scene, this.terrain, {
      position: new THREE.Vector3(x, this.terrain.getHeight(x, z), z),
      age: 8 + Math.random() * 20
    });
    this.rabbits.push(r);
    this.totalBirths++;
    return r;
  }

  spawnFox(x, z) {
    const f = new Fox(this.scene, this.terrain, {
      position: new THREE.Vector3(x, this.terrain.getHeight(x, z), z),
      age: 15 + Math.random() * 25
    });
    this.foxes.push(f);
    this.totalBirths++;
    return f;
  }

  spawnPredator(x, z) {
    const p = new Predator(this.scene, this.terrain, {
      position: new THREE.Vector3(x, this.terrain.getHeight(x, z), z),
      age: 20 + Math.random() * 30
    });
    this.predators.push(p);
    this.totalBirths++;
    return p;
  }

  spawnBear(x, z) {
    const b = new Bear(this.scene, this.terrain, {
      position: new THREE.Vector3(x, this.terrain.getHeight(x, z), z),
      age: 25 + Math.random() * 40
    });
    this.bears.push(b);
    this.totalBirths++;
    return b;
  }

  spawnVillager(x = null, z = null, name = null, profession = null) {
    let spawnX = x;
    let spawnZ = z;

    if (spawnX === null || spawnZ === null) {
      if (this.village && this.village.pathPoints && this.village.pathPoints.length > 0) {
        const pt = this.village.pathPoints[Math.floor(Math.random() * this.village.pathPoints.length)];
        spawnX = pt.x + (Math.random() - 0.5) * 3;
        spawnZ = pt.z + (Math.random() - 0.5) * 3;
      } else {
        spawnX = 65 + (Math.random() - 0.5) * 15;
        spawnZ = 35 + (Math.random() - 0.5) * 15;
      }
    }

    const villager = new Human(this.scene, this.terrain, this.village, {
      position: new THREE.Vector3(spawnX, this.terrain.getHeight(spawnX, spawnZ), spawnZ),
      name,
      profession
    });
    this.villagers.push(villager);
    return villager;
  }

  spawnFoodAt(x, z) {
    const y = this.terrain.getHeight(x, z);
    const foodItem = {
      position: new THREE.Vector3(x, y, z),
      nutrition: 40,
      active: true,
      type: 'dropped_food'
    };
    this.biomeScatter.foodItems.push(foodItem);

    const geo = new THREE.SphereGeometry(0.6, 6, 6);
    const mat = new THREE.MeshStandardMaterial({ color: 0xef4444, roughness: 0.3 });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + 0.3, z);
    this.scene.add(mesh);
  }

  // Spatial queries
  getNearestPredator(pos, radius) {
    let nearest = null;
    let minDist = radius;

    const list = [...this.predators, ...this.foxes, ...this.bears];
    for (let i = 0; i < list.length; i++) {
      const pred = list[i];
      if (!pred.isAlive) continue;
      const d = pos.distanceTo(pred.position);
      if (d < minDist) {
        minDist = d;
        nearest = pred;
      }
    }
    return nearest;
  }

  getNearestPrey(pos, radius) {
    let nearest = null;
    let minDist = radius;

    const list = [...this.herbivores, ...this.sheep, ...this.rabbits];
    for (let i = 0; i < list.length; i++) {
      const prey = list[i];
      if (!prey.isAlive) continue;
      const d = pos.distanceTo(prey.position);
      if (d < minDist) {
        minDist = d;
        nearest = prey;
      }
    }
    return nearest;
  }

  // Comprehensive hunting target search for predators (including humans!)
  getNearestPredatorTarget(pos, radius) {
    let nearest = null;
    let minDist = radius;

    // Potential prey: Herbivores, Sheep, Rabbits, AND Villagers!
    const targets = [
      ...this.herbivores,
      ...this.sheep,
      ...this.rabbits,
      ...this.villagers
    ];

    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      if (!target.isAlive) continue;

      const d = pos.distanceTo(target.position);
      if (d < minDist) {
        let score = d;
        if (target.species === 'Villager') {
          // If guard with sword/armor, predator is slightly more cautious unless hungry
          if (target.profession === 'Guard') {
            score *= 1.3;
          } else {
            // Unarmed civilians (Lumberjack, Stonemason) outside are tempting targets!
            score *= 0.85;
          }
        }
        if (score < minDist) {
          minDist = score;
          nearest = target;
        }
      }
    }
    return nearest;
  }

  getNearestRabbit(pos, radius) {
    let nearest = null;
    let minDist = radius;

    for (let i = 0; i < this.rabbits.length; i++) {
      const r = this.rabbits[i];
      if (!r.isAlive) continue;
      const d = pos.distanceTo(r.position);
      if (d < minDist) {
        minDist = d;
        nearest = r;
      }
    }
    return nearest;
  }

  getNearestFood(pos, radius) {
    return this.biomeScatter.getFoodNear(pos, radius);
  }

  getNearestWaterShore(pos) {
    if (this.shorelinePoints.length === 0) return null;
    let nearest = null;
    let minDist = Infinity;

    for (let i = 0; i < this.shorelinePoints.length; i++) {
      const shore = this.shorelinePoints[i];
      const d = pos.distanceTo(shore);
      if (d < minDist) {
        minDist = d;
        nearest = shore;
      }
    }
    return nearest;
  }

  // Separation force to prevent animals/creatures from clumping into frozen heaps
  getSeparationVector(entity, list, minDistance = 3.5) {
    const sep = new THREE.Vector3();
    let count = 0;

    for (let i = 0; i < list.length; i++) {
      const other = list[i];
      if (other === entity || !other.isAlive) continue;

      const dx = entity.position.x - other.position.x;
      const dz = entity.position.z - other.position.z;
      const dist = Math.hypot(dx, dz);

      if (dist > 0.01 && dist < minDistance) {
        const force = (minDistance - dist) / dist;
        sep.x += dx * force;
        sep.z += dz * force;
        count++;
      }
    }

    if (count > 0) {
      sep.divideScalar(count);
      sep.normalize();
      return sep;
    }
    return null;
  }

  getFlockCenter(herbivore, radius) {
    let count = 0;
    const center = new THREE.Vector3();

    for (let i = 0; i < this.herbivores.length; i++) {
      const other = this.herbivores[i];
      if (other === herbivore || !other.isAlive) continue;

      const d = herbivore.position.distanceTo(other.position);
      if (d < radius) {
        center.add(other.position);
        count++;
      }
    }

    if (count > 0) {
      center.divideScalar(count);
      return center;
    }
    return null;
  }

  getSheepFlockCenter(sheep, radius) {
    let count = 0;
    const center = new THREE.Vector3();

    for (let i = 0; i < this.sheep.length; i++) {
      const other = this.sheep[i];
      if (other === sheep || !other.isAlive) continue;

      const d = sheep.position.distanceTo(other.position);
      if (d < radius) {
        center.add(other.position);
        count++;
      }
    }

    if (count > 0) {
      center.divideScalar(count);
      return center;
    }
    return null;
  }

  getNearestMate(herbivore, radius) {
    for (let i = 0; i < this.herbivores.length; i++) {
      const other = this.herbivores[i];
      if (other === herbivore || !other.isAlive) continue;
      if (other.hunger < 35 && other.thirst < 35 && other.age > 15) {
        if (herbivore.position.distanceTo(other.position) < radius) {
          return other;
        }
      }
    }
    return null;
  }

  spawnBabyHerbivore(parentPos) {
    const offset = new THREE.Vector3((Math.random() - 0.5) * 4, 0, (Math.random() - 0.5) * 4);
    const pos = parentPos.clone().add(offset);
    pos.y = this.terrain.getHeight(pos.x, pos.z);

    const baby = new Herbivore(this.scene, this.terrain, {
      position: pos,
      age: 0,
      hunger: 10,
      thirst: 10
    });
    if (baby.mesh) baby.mesh.scale.set(0.6, 0.6, 0.6);
    this.herbivores.push(baby);
    this.totalBirths++;
  }

  spawnBabySheep(parentPos) {
    const offset = new THREE.Vector3((Math.random() - 0.5) * 3, 0, (Math.random() - 0.5) * 3);
    const pos = parentPos.clone().add(offset);
    pos.y = this.terrain.getHeight(pos.x, pos.z);

    const lamb = new Sheep(this.scene, this.terrain, {
      position: pos,
      age: 0,
      hunger: 10,
      thirst: 10
    });
    if (lamb.mesh) lamb.mesh.scale.set(0.6, 0.6, 0.6);
    this.sheep.push(lamb);
    this.totalBirths++;
  }

  // Predator reproduction
  getNearestPredatorMate(predator, radius) {
    for (let i = 0; i < this.predators.length; i++) {
      const other = this.predators[i];
      if (other === predator || !other.isAlive) continue;
      if (other.hunger < 45 && other.thirst < 45 && other.age > 16) {
        if (predator.position.distanceTo(other.position) < radius) {
          return other;
        }
      }
    }
    return null;
  }

  spawnBabyPredator(parentPos) {
    const offset = new THREE.Vector3((Math.random() - 0.5) * 4, 0, (Math.random() - 0.5) * 4);
    const pos = parentPos.clone().add(offset);
    pos.y = this.terrain.getHeight(pos.x, pos.z);

    const pup = new Predator(this.scene, this.terrain, {
      position: pos,
      age: 0,
      hunger: 15,
      thirst: 15
    });
    if (pup.mesh) pup.mesh.scale.set(0.65, 0.65, 0.65);
    this.predators.push(pup);
    this.totalBirths++;
    if (this.village) {
      this.village.logEvent('🐺 A wild Wolf pup was born to the pack in the hills!', 'milestone');
    }
  }

  checkVillagerReproduction(cottagePos) {
    if (!this.village) return;
    const now = performance.now();
    if (this.lastVillagerBirth && (now - this.lastVillagerBirth < 14000)) return;

    const liveVillagers = this.villagers.filter(v => v.isAlive);
    const cottagesCount = this.village.buildings.filter(b => b.type === 'cottage').length + 2;
    const maxPop = cottagesCount * 4 + 4; // Scales with village housing

    if (this.village.resources.food >= 35 && liveVillagers.length < maxPop) {
      this.lastVillagerBirth = now;
      this.village.resources.food -= 12;
      this.spawnBabyVillager(cottagePos);
    }
  }

  spawnBabyVillager(spawnPos) {
    const liveVillagers = this.villagers.filter(v => v.isAlive);
    const profCounts = {
      Farmer: 0,
      Lumberjack: 0,
      Stonemason: 0,
      Builder: 0,
      Guard: 0,
      Hunter: 0,
      Blacksmith: 0
    };
    liveVillagers.forEach(v => {
      if (profCounts[v.profession] !== undefined) profCounts[v.profession]++;
    });

    // Assign lowest represented profession to keep village balanced
    let chosenProf = 'Farmer';
    let minCount = Infinity;
    Object.keys(profCounts).forEach(prof => {
      if (profCounts[prof] < minCount) {
        minCount = profCounts[prof];
        chosenProf = prof;
      }
    });

    const sx = spawnPos ? spawnPos.x + (Math.random() - 0.5) * 4 : 65;
    const sz = spawnPos ? spawnPos.z + (Math.random() - 0.5) * 4 : 35;
    const baby = this.spawnVillager(sx, sz, null, chosenProf);
    if (baby.mesh) {
      baby.mesh.scale.set(0.72, 0.72, 0.72); // Youthful scale!
    }
    this.totalBirths++;
    if (this.village) {
      this.village.logEvent(`👶 A healthy new villager, ${baby.name} the ${chosenProf}, was born into the settlement!`, 'milestone');
    }
    return baby;
  }

  alertGuards(threat) {
    for (let i = 0; i < this.villagers.length; i++) {
      const v = this.villagers[i];
      if (v.isAlive && v.profession === 'Guard' && v.state !== 'ATTACK_BEAST') {
        v.targetThreat = threat;
        v.state = 'ATTACK_BEAST';
        v.stateTimer = 22.0;
      }
    }
  }

  update(delta) {
    // Update environmental vegetation regeneration
    if (this.biomeScatter && this.biomeScatter.update) {
      this.biomeScatter.update(delta);
    }

    // Update village simulation & buildings
    if (this.village && this.village.update) {
      this.village.update(delta);
    }

    const updateList = (list) => {
      for (let i = list.length - 1; i >= 0; i--) {
        const entity = list[i];
        if (!entity.isAlive) {
          if (!entity.mesh || !entity.mesh.parent) {
            list.splice(i, 1);
            this.totalDeaths++;
          }
        } else {
          entity.update(delta, this);
        }
      }
    };

    updateList(this.herbivores);
    updateList(this.sheep);
    updateList(this.rabbits);
    updateList(this.foxes);
    updateList(this.predators);
    updateList(this.bears);
    updateList(this.villagers);

    // Natural balance maintenance
    if (this.herbivores.length < 10) this.spawnRandomDeer();
    if (this.sheep.length < 8) this.spawnRandomSheep();
    if (this.rabbits.length < 12) this.spawnRandomRabbit();
    if (this.predators.length < 6) this.spawnRandomWolf();
    if (this.foxes.length < 4) this.spawnRandomFox();
    if (this.bears.length < 3) this.spawnRandomBear();

    // Village Population Growth: recruit/grow when settlement food is abundant
    this.villageGrowthTimer = (this.villageGrowthTimer || 0) + delta;
    if (this.villageGrowthTimer > 15) {
      this.villageGrowthTimer = 0;
      if (this.village && this.village.resources.food >= 40 && this.villagers.filter(v => v.isAlive).length < 22) {
        this.checkVillagerReproduction(this.village.villageCenter);
      }
    }
  }

  getPopulationStats() {
    const livePrey = this.herbivores.filter(h => h.isAlive).length +
                     this.sheep.filter(s => s.isAlive).length +
                     this.rabbits.filter(r => r.isAlive).length;

    const livePredators = this.predators.filter(p => p.isAlive).length +
                          this.foxes.filter(f => f.isAlive).length +
                          this.bears.filter(b => b.isAlive).length;

    return {
      herbivores: livePrey,
      predators: livePredators,
      villagers: this.villagers.filter(v => v.isAlive).length,
      sheep: this.sheep.filter(s => s.isAlive).length,
      rabbits: this.rabbits.filter(r => r.isAlive).length,
      bears: this.bears.filter(b => b.isAlive).length,
      foodItems: this.biomeScatter.foodItems.filter(f => f.active).length,
      births: this.totalBirths,
      deaths: this.totalDeaths,
      villageResources: this.village ? this.village.resources : null,
      villageEra: this.village ? this.village.eraName : null,
      villageEvents: this.village ? this.village.events : [],
      activeProject: this.village ? this.village.getActiveProject() : null
    };
  }
}
