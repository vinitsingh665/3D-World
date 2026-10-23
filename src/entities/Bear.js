import * as THREE from 'three';
import { Animal } from './Animal.js';
import { CreatureModels } from './CreatureModels.js';

export class Bear extends Animal {
  constructor(scene, terrain, options = {}) {
    super('Bear', scene, terrain, {
      walkSpeed: 2.8,
      runSpeed: 6.2,
      turnSpeed: 2.6,
      ...options
    });
  }

  initModel() {
    const modelData = CreatureModels.createBearModel();
    this.bindModelData(modelData);
  }

  update(delta, ecosystem) {
    if (!this.isAlive) return;

    this.updateVitals(delta);
    if (!this.isAlive) return;

    this.stateTimer -= delta;

    switch (this.state) {
      case 'IDLE':
        this.currentSpeed = THREE.MathUtils.lerp(this.currentSpeed, 0, delta * 3);
        this.updatePositionOnTerrain();
        if (this.stateTimer <= 0) {
          this.decideNextState(ecosystem);
        }
        break;

      case 'WANDER':
        const sep = ecosystem.getSeparationVector(this, ecosystem.bears, 4.5);
        this.steerTowards(this.targetPosition, this.walkSpeed, delta, sep);
        if (this.horizontalDistanceTo(this.targetPosition) < 2.5 || this.stateTimer <= 0) {
          this.state = 'IDLE';
          this.stateTimer = 2.5 + Math.random() * 3.5;
        }
        break;

      case 'EAT':
        this.currentSpeed = 0;
        this.hunger = Math.max(0, this.hunger - delta * 20);
        this.updatePositionOnTerrain();
        if (this.stateTimer <= 0 || this.hunger <= 10) {
          this.state = 'IDLE';
          this.stateTimer = 2.5;
        }
        break;

      case 'DRINK':
        this.currentSpeed = 0;
        this.thirst = Math.max(0, this.thirst - delta * 25);
        this.updatePositionOnTerrain();
        if (this.stateTimer <= 0 || this.thirst <= 10) {
          this.state = 'IDLE';
          this.stateTimer = 2.5;
        }
        break;

      case 'REST':
        this.currentSpeed = 0;
        this.energy = Math.min(100, this.energy + delta * 12);
        this.updatePositionOnTerrain();
        if (this.stateTimer <= 0 || this.energy >= 90) {
          this.state = 'WANDER';
          this.pickWanderPoint(30);
        }
        break;
    }

    this.animateLimbs(delta);
  }

  decideNextState(ecosystem) {
    if (this.thirst > 60) {
      const water = ecosystem.getNearestWaterShore(this.position);
      if (water) {
        this.state = 'DRINK';
        this.targetPosition.copy(water);
        this.stateTimer = 20;
        return;
      }
    }

    if (this.hunger > 50) {
      const food = ecosystem.getNearestFood(this.position, 60);
      if (food) {
        this.state = 'EAT';
        this.targetPosition.copy(food.position);
        this.stateTimer = 20;
        return;
      }
    }

    if (this.energy < 35) {
      this.state = 'REST';
      this.stateTimer = 6.0;
      return;
    }

    this.state = 'WANDER';
    this.stateTimer = 6.0 + Math.random() * 7.0;
    this.pickWanderPoint(32);
  }
}
