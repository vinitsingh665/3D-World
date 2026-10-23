import * as THREE from 'three';
import { Animal } from './Animal.js';
import { CreatureModels } from './CreatureModels.js';

export class Sheep extends Animal {
  constructor(scene, terrain, options = {}) {
    super('Sheep', scene, terrain, {
      walkSpeed: 2.5,
      runSpeed: 6.0,
      turnSpeed: 3.0,
      ...options
    });

    this.dangerRadius = 26;
    this.flockRadius = 20;
  }

  initModel() {
    const modelData = CreatureModels.createSheepModel();
    this.bindModelData(modelData);
  }

  update(delta, ecosystem) {
    if (!this.isAlive) return;

    this.updateVitals(delta);
    if (!this.isAlive) return;

    this.stateTimer -= delta;

    // Flee danger
    const predator = ecosystem.getNearestPredator(this.position, this.dangerRadius);
    if (predator) {
      this.state = 'FLEE';
      const fleeDir = new THREE.Vector3().subVectors(this.position, predator.position).normalize();
      this.targetPosition.copy(this.position).addScaledVector(fleeDir, 25);
    } else if (this.state === 'FLEE') {
      this.state = 'WANDER';
      this.stateTimer = 2.0;
    }

    switch (this.state) {
      case 'FLEE':
        this.steerTowards(this.targetPosition, this.runSpeed, delta);
        break;

      case 'IDLE':
        this.currentSpeed = THREE.MathUtils.lerp(this.currentSpeed, 0, delta * 4);
        this.updatePositionOnTerrain();
        if (this.stateTimer <= 0) {
          this.decideNextState(ecosystem);
        }
        break;

      case 'WANDER':
        // Flock with separation so sheep spread out over the grass
        const sep = ecosystem.getSeparationVector(this, ecosystem.sheep, 3.2);
        this.steerTowards(this.targetPosition, this.walkSpeed, delta, sep);

        if (this.horizontalDistanceTo(this.targetPosition) < 2.5 || this.stateTimer <= 0) {
          this.state = 'EAT';
          this.stateTimer = 3 + Math.random() * 4; // Graze peaceful in meadow
        }
        break;

      case 'EAT':
        this.currentSpeed = 0;
        this.hunger = Math.max(0, this.hunger - delta * 15);
        this.updatePositionOnTerrain();
        if (this.stateTimer <= 0) {
          this.state = 'IDLE';
          this.stateTimer = 2.0;
        }
        break;

      case 'SEEK_WATER':
        this.steerTowards(this.targetPosition, this.walkSpeed, delta);
        if (this.horizontalDistanceTo(this.targetPosition) < 3.0 || this.terrain.isWater(this.position.x, this.position.z)) {
          this.state = 'DRINK';
          this.stateTimer = 3.5;
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
    }

    this.animateLimbs(delta);
  }

  decideNextState(ecosystem) {
    if (this.thirst > 65) {
      const water = ecosystem.getNearestWaterShore(this.position);
      if (water) {
        this.state = 'SEEK_WATER';
        this.targetPosition.copy(water);
        this.stateTimer = 18;
        return;
      }
    }

    // Herd Cohesion without clumping: if too far from sheep flock (> 30m), steer towards flock
    const flockCenter = ecosystem.getSheepFlockCenter(this, 40);
    if (flockCenter && this.horizontalDistanceTo(flockCenter) > 28) {
      this.state = 'WANDER';
      this.stateTimer = 5 + Math.random() * 5;
      const dir = new THREE.Vector3().subVectors(flockCenter, this.position).normalize();
      const dist = 10 + Math.random() * 12;
      const wx = this.position.x + dir.x * dist + (Math.random() - 0.5) * 6;
      const wz = this.position.z + dir.z * dist + (Math.random() - 0.5) * 6;
      this.targetPosition.set(wx, this.terrain.getHeight(wx, wz), wz);
      return;
    }

    this.state = 'WANDER';
    this.stateTimer = 5 + Math.random() * 6;
    this.pickWanderPoint(24);
  }
}
