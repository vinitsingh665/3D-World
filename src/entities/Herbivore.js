import * as THREE from 'three';
import { Animal } from './Animal.js';
import { CreatureModels } from './CreatureModels.js';

export class Herbivore extends Animal {
  constructor(scene, terrain, options = {}) {
    super('Herbivore', scene, terrain, {
      walkSpeed: 3.8,
      runSpeed: 8.2,
      ...options
    });

    this.dangerRadius = 32;
    this.sightRadius = 45;
    this.flockRadius = 24;
    this.lastReproduceTime = 0;
  }

  initModel() {
    const modelData = CreatureModels.createHerbivoreModel();
    this.bindModelData(modelData);
  }

  update(delta, ecosystem) {
    if (!this.isAlive) return;

    this.updateVitals(delta);
    if (!this.isAlive) return;

    this.stateTimer -= delta;

    // 1. Check Danger (Highest priority: Survival)
    const nearestPredator = ecosystem.getNearestPredator(this.position, this.dangerRadius);
    if (nearestPredator) {
      this.state = 'FLEE';
      this.targetEntity = nearestPredator;
      // Flee directly opposite to predator
      const fleeDir = new THREE.Vector3().subVectors(this.position, nearestPredator.position).normalize();
      this.targetPosition.copy(this.position).addScaledVector(fleeDir, 30);
    } else if (this.state === 'FLEE') {
      // Escaped danger
      this.state = 'WANDER';
      this.stateTimer = 1.0;
      this.targetEntity = null;
    }

    // 2. Behavioral State Machine
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
        // Flock with separation so deer never freeze in tight clumps
        const sep = ecosystem.getSeparationVector(this, ecosystem.herbivores, 4.0);
        this.steerTowards(this.targetPosition, this.walkSpeed, delta, sep);

        if (this.horizontalDistanceTo(this.targetPosition) < 2.5 || this.stateTimer <= 0) {
          this.state = 'IDLE';
          this.stateTimer = 1.5 + Math.random() * 2.5;
        }
        break;

      case 'SEEK_FOOD':
        if (!this.targetEntity || !this.targetEntity.active) {
          this.state = 'WANDER';
          this.pickWanderPoint(30);
          break;
        }

        this.steerTowards(this.targetEntity.position, this.walkSpeed * 1.2, delta);

        if (this.horizontalDistanceTo(this.targetEntity.position) < 2.5) {
          this.state = 'EAT';
          this.stateTimer = 3.0;
        }
        break;

      case 'EAT':
        this.currentSpeed = 0;
        this.hunger = Math.max(0, this.hunger - delta * 20);
        this.health = Math.min(100, this.health + delta * 5);
        this.updatePositionOnTerrain();

        if (this.stateTimer <= 0 || this.hunger <= 5) {
          this.state = 'IDLE';
          this.stateTimer = 2.0;
          this.targetEntity = null;
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
        if (this.energy >= 90 || this.stateTimer <= 0) {
          this.state = 'WANDER';
          this.pickWanderPoint(30);
        }
        break;
    }

    // Check Reproduction
    if (this.hunger < 30 && this.thirst < 30 && this.energy > 60 && this.age > 15) {
      const now = performance.now();
      if (now - this.lastReproduceTime > 35000) { // at most once every 35s
        const mate = ecosystem.getNearestMate(this, 14);
        if (mate) {
          this.lastReproduceTime = now;
          mate.lastReproduceTime = now;
          ecosystem.spawnBabyHerbivore(this.position);
        }
      }
    }

    this.animateLimbs(delta);
  }

  decideNextState(ecosystem) {
    if (this.thirst > 60) {
      const waterSpot = ecosystem.getNearestWaterShore(this.position);
      if (waterSpot) {
        this.state = 'SEEK_WATER';
        this.targetPosition.copy(waterSpot);
        this.stateTimer = 15;
        return;
      }
    }

    if (this.hunger > 50) {
      const food = ecosystem.getNearestFood(this.position, this.sightRadius);
      if (food) {
        this.state = 'SEEK_FOOD';
        this.targetEntity = food;
        this.stateTimer = 15;
        return;
      }
    }

    if (this.energy < 25) {
      this.state = 'REST';
      this.stateTimer = 4.0;
      return;
    }

    // Herd Cohesion without clumping: if separated far from herd (> 35m), steer towards herd
    const flockCenter = ecosystem.getFlockCenter(this, 50);
    if (flockCenter && this.horizontalDistanceTo(flockCenter) > 32) {
      this.state = 'WANDER';
      this.stateTimer = 5 + Math.random() * 5;
      const dir = new THREE.Vector3().subVectors(flockCenter, this.position).normalize();
      const dist = 12 + Math.random() * 14;
      const wx = this.position.x + dir.x * dist + (Math.random() - 0.5) * 8;
      const wz = this.position.z + dir.z * dist + (Math.random() - 0.5) * 8;
      this.targetPosition.set(wx, this.terrain.getHeight(wx, wz), wz);
      return;
    }

    this.state = 'WANDER';
    this.stateTimer = 4 + Math.random() * 5;
    this.pickWanderPoint(30);
  }
}
