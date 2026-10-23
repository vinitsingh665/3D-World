import * as THREE from 'three';
import { Animal } from './Animal.js';
import { CreatureModels } from './CreatureModels.js';

export class Predator extends Animal {
  constructor(scene, terrain, options = {}) {
    super('Predator', scene, terrain, {
      walkSpeed: 4.2,
      runSpeed: 9.2,
      ...options
    });

    this.huntRadius = 55;
    this.attackDistance = 2.4;
    this.lastReproduceTime = 0;
  }

  initModel() {
    const modelData = CreatureModels.createPredatorModel();
    this.bindModelData(modelData);
  }

  update(delta, ecosystem) {
    if (!this.isAlive) return;

    this.updateVitals(delta);
    if (!this.isAlive) return;

    this.stateTimer -= delta;

    switch (this.state) {
      case 'IDLE':
        this.currentSpeed = THREE.MathUtils.lerp(this.currentSpeed, 0, delta * 4);
        this.updatePositionOnTerrain();
        if (this.stateTimer <= 0) {
          this.decideNextState(ecosystem);
        }
        break;

      case 'WANDER':
        const sep = ecosystem.getSeparationVector(this, ecosystem.predators, 3.5);
        this.steerTowards(this.targetPosition, this.walkSpeed, delta, sep);

        if (this.horizontalDistanceTo(this.targetPosition) < 2.5 || this.stateTimer <= 0) {
          this.state = 'IDLE';
          this.stateTimer = 1.5 + Math.random() * 2.0;
        }

        // Opportunistic hunting while wandering (Deer, Sheep, Rabbits, AND Villagers!)
        if (this.hunger > 30) {
          const target = ecosystem.getNearestPredatorTarget(this.position, this.huntRadius);
          if (target) {
            this.state = 'HUNT';
            this.targetEntity = target;
          }
        }
        break;

      case 'HUNT':
        if (!this.targetEntity || !this.targetEntity.isAlive) {
          this.state = 'WANDER';
          this.pickWanderPoint(30);
          this.targetEntity = null;
          break;
        }

        const distToTarget = this.horizontalDistanceTo(this.targetEntity.position);

        if (distToTarget <= this.attackDistance + 0.6) {
          if (this.targetEntity.species === 'Villager') {
            // Predator attacks human: deals real damage!
            if (this.targetEntity.takeDamage) {
              this.targetEntity.takeDamage(delta * 45, this);
            }
            this.hunger = Math.max(0, this.hunger - delta * 20);

            if (!this.targetEntity.isAlive) {
              this.state = 'EAT';
              this.stateTimer = 5.0;
              this.targetEntity = null;
            }
          } else {
            // Animal prey kill
            this.targetEntity.die('Predation');
            this.state = 'EAT';
            this.stateTimer = 4.0;
            this.targetEntity = null;
          }
          break;
        }

        // Chase target (if target is inside the palisade and predator is outside, funnel through nearest gate!)
        let chaseTarget = this.targetEntity.position;
        if (ecosystem && ecosystem.village) {
          const village = ecosystem.village;
          const predInside = village.isInsideVillage ? village.isInsideVillage(this.position.x, this.position.z) : false;
          const targetInside = village.isInsideVillage ? village.isInsideVillage(this.targetEntity.position.x, this.targetEntity.position.z) : false;
          if (!predInside && targetInside && village.gates && village.gates.length > 0) {
            let nearestGate = null;
            let minGateDist = Infinity;
            village.gates.forEach(g => {
              const gd = Math.hypot(this.position.x - g.pos.x, this.position.z - g.pos.z);
              if (gd < minGateDist) {
                minGateDist = gd;
                nearestGate = g;
              }
            });
            if (nearestGate && minGateDist > 4.0) {
              chaseTarget = nearestGate.pos;
            }
          }
        }

        this.steerTowards(chaseTarget, this.runSpeed, delta);

        // Give up chase if energy runs out or target escapes
        if (this.energy < 15 || distToTarget > this.huntRadius * 1.35) {
          this.state = 'REST';
          this.stateTimer = 4.0;
          this.targetEntity = null;
        }
        break;

      case 'EAT':
        this.currentSpeed = 0;
        this.hunger = Math.max(0, this.hunger - delta * 30);
        this.health = Math.min(100, this.health + delta * 8);
        this.updatePositionOnTerrain();

        if (this.stateTimer <= 0 || this.hunger <= 0) {
          this.state = 'REST';
          this.stateTimer = 4.0;
        }
        break;

      case 'SEEK_WATER':
        this.steerTowards(this.targetPosition, this.walkSpeed, delta);
        if (this.horizontalDistanceTo(this.targetPosition) < 3.0 || this.terrain.isWater(this.position.x, this.position.z)) {
          this.state = 'DRINK';
          this.stateTimer = 3.0;
        }
        break;

      case 'DRINK':
        this.currentSpeed = 0;
        this.thirst = Math.max(0, this.thirst - delta * 25);
        this.updatePositionOnTerrain();

        if (this.stateTimer <= 0 || this.thirst <= 5) {
          this.state = 'IDLE';
          this.stateTimer = 2.0;
        }
        break;

      case 'REST':
        this.currentSpeed = 0;
        this.updatePositionOnTerrain();
        if (this.energy >= 85 || this.stateTimer <= 0) {
          this.state = 'WANDER';
          this.pickWanderPoint(35);
        }
        break;
    }

    // Check Predator Breeding & Reproduction
    if (this.hunger < 40 && this.thirst < 40 && this.energy > 55 && this.age > 16) {
      const now = performance.now();
      if (!this.lastReproduceTime || (now - this.lastReproduceTime > 32000)) {
        const mate = ecosystem.getNearestPredatorMate(this, 18);
        if (mate) {
          this.lastReproduceTime = now;
          mate.lastReproduceTime = now;
          ecosystem.spawnBabyPredator(this.position);
        }
      }
    }

    this.animateLimbs(delta);
  }

  decideNextState(ecosystem) {
    if (this.thirst > 65) {
      const waterSpot = ecosystem.getNearestWaterShore(this.position);
      if (waterSpot) {
        this.state = 'SEEK_WATER';
        this.targetPosition.copy(waterSpot);
        this.stateTimer = 15;
        return;
      }
    }

    if (this.hunger > 30) {
      const target = ecosystem.getNearestPredatorTarget(this.position, this.huntRadius);
      if (target) {
        this.state = 'HUNT';
        this.targetEntity = target;
        return;
      }
    }

    if (this.energy < 30) {
      this.state = 'REST';
      this.stateTimer = 4.0;
      return;
    }

    this.state = 'WANDER';
    this.stateTimer = 4 + Math.random() * 6;
    this.pickWanderPoint(35);
  }
}
