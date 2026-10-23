import * as THREE from 'three';
import { Animal } from './Animal.js';
import { CreatureModels } from './CreatureModels.js';

export class Rabbit extends Animal {
  constructor(scene, terrain, options = {}) {
    super('Rabbit', scene, terrain, {
      walkSpeed: 3.2,
      runSpeed: 7.8,
      turnSpeed: 5.5,
      ...options
    });

    this.dangerRadius = 24;
  }

  initModel() {
    const modelData = CreatureModels.createRabbitModel();
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
      this.targetPosition.copy(this.position).addScaledVector(fleeDir, 28);
    } else if (this.state === 'FLEE') {
      this.state = 'IDLE';
      this.stateTimer = 1.5;
    }

    switch (this.state) {
      case 'FLEE':
        this.steerTowards(this.targetPosition, this.runSpeed, delta);
        break;

      case 'IDLE':
        this.currentSpeed = THREE.MathUtils.lerp(this.currentSpeed, 0, delta * 6);
        this.updatePositionOnTerrain();
        if (this.stateTimer <= 0) {
          this.decideNextState(ecosystem);
        }
        break;

      case 'WANDER':
        const sep = ecosystem.getSeparationVector(this, ecosystem.rabbits, 2.0);
        this.steerTowards(this.targetPosition, this.walkSpeed, delta, sep);
        if (this.horizontalDistanceTo(this.targetPosition) < 1.8 || this.stateTimer <= 0) {
          this.state = 'EAT';
          this.stateTimer = 2.0 + Math.random() * 2.5; // Nibble grass
        }
        break;

      case 'EAT':
        this.currentSpeed = 0;
        this.hunger = Math.max(0, this.hunger - delta * 20);
        this.updatePositionOnTerrain();
        if (this.stateTimer <= 0) {
          this.state = 'IDLE';
          this.stateTimer = 1.5 + Math.random() * 2.0;
        }
        break;
    }

    this.animateLimbs(delta);
  }

  decideNextState(ecosystem) {
    this.state = 'WANDER';
    this.stateTimer = 2.5 + Math.random() * 3.5;
    this.pickWanderPoint(16);
  }
}
