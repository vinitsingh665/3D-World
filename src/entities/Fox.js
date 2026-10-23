import * as THREE from 'three';
import { Animal } from './Animal.js';
import { CreatureModels } from './CreatureModels.js';

export class Fox extends Animal {
  constructor(scene, terrain, options = {}) {
    super('Fox', scene, terrain, {
      walkSpeed: 3.6,
      runSpeed: 8.5,
      turnSpeed: 4.8,
      ...options
    });

    this.huntRadius = 40;
  }

  initModel() {
    const modelData = CreatureModels.createFoxModel();
    this.bindModelData(modelData);
  }

  update(delta, ecosystem) {
    if (!this.isAlive) return;

    this.updateVitals(delta);
    if (!this.isAlive) return;

    this.stateTimer -= delta;

    switch (this.state) {
      case 'IDLE':
        this.currentSpeed = THREE.MathUtils.lerp(this.currentSpeed, 0, delta * 5);
        this.updatePositionOnTerrain();
        if (this.stateTimer <= 0) {
          this.decideNextState(ecosystem);
        }
        break;

      case 'WANDER':
        const sep = ecosystem.getSeparationVector(this, ecosystem.foxes, 3.0);
        this.steerTowards(this.targetPosition, this.walkSpeed, delta, sep);
        if (this.horizontalDistanceTo(this.targetPosition) < 2.0 || this.stateTimer <= 0) {
          this.state = 'IDLE';
          this.stateTimer = 1.5 + Math.random() * 2.5;
        }

        // Hunt rabbits if hungry
        if (this.hunger > 35) {
          const rabbit = ecosystem.getNearestRabbit(this.position, this.huntRadius);
          if (rabbit) {
            this.state = 'HUNT';
            this.targetEntity = rabbit;
          }
        }
        break;

      case 'HUNT':
        if (!this.targetEntity || !this.targetEntity.isAlive) {
          this.state = 'WANDER';
          this.pickWanderPoint(25);
          this.targetEntity = null;
          break;
        }

        const dist = this.horizontalDistanceTo(this.targetEntity.position);
        if (dist <= 2.2) {
          this.targetEntity.die('Fox');
          this.hunger = 0;
          this.state = 'IDLE';
          this.stateTimer = 3.0;
          this.targetEntity = null;
          break;
        }

        this.steerTowards(this.targetEntity.position, this.runSpeed, delta);
        if (this.energy < 20 || dist > this.huntRadius * 1.4) {
          this.state = 'IDLE';
          this.stateTimer = 2.0;
          this.targetEntity = null;
        }
        break;
    }

    this.animateLimbs(delta);
  }

  decideNextState(ecosystem) {
    this.state = 'WANDER';
    this.stateTimer = 4.0 + Math.random() * 5.0;
    this.pickWanderPoint(28);
  }
}
