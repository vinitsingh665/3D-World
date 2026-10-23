import * as THREE from 'three';

let entityIdCounter = 1;

export class Animal {
  constructor(species, scene, terrain, options = {}) {
    this.id = entityIdCounter++;
    this.species = species; // 'Herbivore', 'Sheep', 'Rabbit', 'Fox', 'Wolf', 'Bear', 'Villager'
    this.scene = scene;
    this.terrain = terrain;

    this.position = new THREE.Vector3();
    if (options.position) {
      this.position.copy(options.position);
    }
    this.velocity = new THREE.Vector3();
    this.yaw = Math.random() * Math.PI * 2;
    this.targetYaw = this.yaw;
    this.roll = 0;
    this.pitch = 0;

    // Movement parameters
    this.walkSpeed = options.walkSpeed || 3.5;
    this.runSpeed = options.runSpeed || 7.0;
    this.currentSpeed = 0;
    this.turnSpeed = options.turnSpeed || 3.5;

    // Vitals - tuned for long, realistic lifespans
    this.health = 100;
    this.hunger = options.hunger !== undefined ? options.hunger : Math.random() * 25;
    this.thirst = options.thirst !== undefined ? options.thirst : Math.random() * 25;
    this.energy = 95;
    this.age = options.age || 0;
    this.maxAge = options.maxAge || (350 + Math.random() * 250); // Much longer lifespans!
    this.isAlive = true;

    // State machine
    this.state = 'WANDER';
    this.stateTimer = 3 + Math.random() * 4;
    this.targetPosition = new THREE.Vector3();
    this.targetEntity = null;

    // Organic animation state
    this.legCycle = 0;
    this.hopOffset = 0;
    this.headLookTimer = 0;
    this.headYawOffset = 0;
    this.modelData = null;

    this.tempNormal = new THREE.Vector3();

    this.initModel();
    this.position.y = this.terrain.getHeight(this.position.x, this.position.z);
    if (this.mesh) {
      this.mesh.position.copy(this.position);
      this.mesh.rotation.y = this.yaw;
    }
  }

  initModel() {
    // Overridden by subclasses
  }

  bindModelData(modelData) {
    this.modelData = modelData;
    this.mesh = modelData.root;
    this.mesh.traverse((child) => {
      child.userData.entity = this;
    });
    this.scene.add(this.mesh);
  }

  die(cause = 'natural') {
    if (!this.isAlive) return;
    this.isAlive = false;
    this.state = 'DEAD';
    this.deathCause = cause;
    this.currentSpeed = 0;
    this.health = 0;

    if (this.mesh) {
      this.mesh.rotation.order = 'YXZ';
      this.mesh.rotation.z = Math.PI * 0.48;
      const groundY = this.terrain ? this.terrain.getHeight(this.position.x, this.position.z) : this.position.y;
      this.mesh.position.y = groundY + 0.12;

      // Relax legs if quadruped
      if (this.modelData && this.modelData.legs) {
        this.modelData.legs.forEach(leg => {
          if (leg) leg.rotation.set(0.1, 0, 0);
        });
      }

      setTimeout(() => {
        if (this.mesh && this.mesh.parent) {
          this.scene.remove(this.mesh);
        }
      }, 3500);
    }
  }

  updateVitals(delta) {
    if (!this.isAlive) return;

    this.age += delta * 0.05;
    // Gentle hunger & thirst increase so animals roam happily
    this.hunger += delta * 0.16;
    this.thirst += delta * 0.20;

    if (this.currentSpeed > this.walkSpeed) {
      this.energy = Math.max(0, this.energy - delta * 2.5);
    } else if (this.state === 'REST' || this.state === 'IDLE') {
      this.energy = Math.min(100, this.energy + delta * 9.0);
    } else {
      this.energy = Math.max(0, this.energy - delta * 0.4);
    }

    // Only damage if severely neglected
    if (this.hunger >= 98 || this.thirst >= 98) {
      this.health -= delta * 1.5;
    }

    if (this.age > this.maxAge || this.health <= 0) {
      this.die(this.health <= 0 ? 'Starvation/Thirst' : 'Old Age');
    }
  }

  updateOrientationAndPosition(delta) {
    if (!this.mesh) return;

    // Smooth vertical ground tracking (NO jarring snapping!)
    const targetY = this.terrain.getHeight(this.position.x, this.position.z);
    this.position.y = THREE.MathUtils.lerp(this.position.y, targetY, Math.min(1.0, delta * 12));

    // Align with ground slope (Pitch & Roll for realistic hillside walking)
    this.terrain.getNormal(this.position.x, this.position.z, this.tempNormal);

    // Forward and Right vectors based on current yaw
    const forwardX = Math.sin(this.yaw);
    const forwardZ = Math.cos(this.yaw);
    const rightX = Math.cos(this.yaw);
    const rightZ = -Math.sin(this.yaw);

    // Slope angles
    const targetPitch = -(forwardX * this.tempNormal.x + forwardZ * this.tempNormal.z);
    const targetRoll = -(rightX * this.tempNormal.x + rightZ * this.tempNormal.z);

    this.pitch = THREE.MathUtils.lerp(this.pitch, targetPitch * 0.65, delta * 8);
    this.roll = THREE.MathUtils.lerp(this.roll, targetRoll * 0.65, delta * 8);

    // Apply compound rotation
    this.mesh.position.set(this.position.x, this.position.y + this.hopOffset, this.position.z);
    this.mesh.rotation.set(0, 0, 0);
    this.mesh.rotation.order = 'YXZ';
    this.mesh.rotation.y = this.yaw;
    this.mesh.rotation.x = this.pitch;
    this.mesh.rotation.z = this.roll;
  }

  animateLimbs(delta) {
    if (!this.modelData || !this.isAlive) return;

    const { legs, headGroup, tail } = this.modelData;

    // Specific gait based on species
    if (this.species === 'Rabbit') {
      // Hopping gait!
      if (this.currentSpeed > 0.1) {
        this.legCycle += delta * this.currentSpeed * 4.5;
        this.hopOffset = Math.max(0, Math.sin(this.legCycle)) * 0.35;
        if (legs && legs.length >= 4) {
          const hopFold = Math.sin(this.legCycle) * 0.5;
          legs[0].rotation.x = hopFold;
          legs[1].rotation.x = hopFold;
          legs[2].rotation.x = -hopFold;
          legs[3].rotation.x = -hopFold;
        }
      } else {
        this.hopOffset = THREE.MathUtils.lerp(this.hopOffset, 0, delta * 10);
      }
    } else if (this.species === 'Bear') {
      // Lumbering heavy gait with body roll
      if (this.currentSpeed > 0.1) {
        this.legCycle += delta * this.currentSpeed * 2.8;
        const swing = Math.sin(this.legCycle) * 0.55;
        this.roll += Math.sin(this.legCycle) * 0.05; // side-to-side waddle

        if (legs && legs.length >= 4) {
          legs[0].rotation.x = swing;
          legs[1].rotation.x = -swing;
          legs[2].rotation.x = -swing;
          legs[3].rotation.x = swing;
        }
      }
    } else {
      // Standard realistic quadruped trot (Deer, Sheep, Fox, Wolf)
      if (legs && legs.length >= 4) {
        if (this.currentSpeed > 0.1) {
          const strideRate = this.species === 'Fox' ? 4.8 : 3.6;
          this.legCycle += delta * this.currentSpeed * strideRate;
          const swing = Math.sin(this.legCycle) * 0.6;

          legs[0].rotation.x = swing;
          legs[1].rotation.x = -swing;
          legs[2].rotation.x = -swing;
          legs[3].rotation.x = swing;
        } else {
          for (let i = 0; i < 4; i++) {
            legs[i].rotation.x = THREE.MathUtils.lerp(legs[i].rotation.x, 0, delta * 6);
          }
        }
      }
    }

    // Natural Head Look & Grazing
    if (headGroup) {
      if (this.state === 'EAT' || this.state === 'DRINK') {
        headGroup.rotation.x = THREE.MathUtils.lerp(headGroup.rotation.x, 0.65, delta * 4);
      } else {
        // Natural curious looking left/right when stopped
        if (this.currentSpeed < 0.2) {
          this.headLookTimer -= delta;
          if (this.headLookTimer <= 0) {
            this.headYawOffset = (Math.random() - 0.5) * 0.5;
            this.headLookTimer = 2.0 + Math.random() * 3.0;
          }
          headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, this.headYawOffset, delta * 3);
          headGroup.rotation.x = THREE.MathUtils.lerp(headGroup.rotation.x, 0.1, delta * 3);
        } else {
          headGroup.rotation.y = THREE.MathUtils.lerp(headGroup.rotation.y, 0, delta * 5);
          headGroup.rotation.x = THREE.MathUtils.lerp(headGroup.rotation.x, 0, delta * 5);
        }
      }
    }

    // Tail motion
    if (tail) {
      const wagSpeed = this.state === 'HUNT' ? 12 : 3;
      tail.rotation.y = Math.sin(performance.now() * 0.005 * wagSpeed) * 0.25;
    }
  }

  horizontalDistanceTo(target) {
    if (!target) return Infinity;
    const pos = (target.position !== undefined) ? target.position : target;
    return Math.hypot(this.position.x - pos.x, this.position.z - pos.z);
  }

  steerTowards(targetPos, desiredSpeed, delta, separationVec = null) {
    const toTarget = new THREE.Vector3().subVectors(targetPos, this.position);
    toTarget.y = 0;

    // Apply repulsive separation force if nearby creatures are crowding
    if (separationVec) {
      toTarget.addScaledVector(separationVec, 2.0);
    }

    const dist = toTarget.length();

    if (dist > 0.6) {
      const targetAngle = Math.atan2(toTarget.x, toTarget.z);

      // Shortest angle difference
      let angleDiff = targetAngle - this.yaw;
      while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
      while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

      // Realistic smooth turning with momentum
      const effectiveTurnSpeed = this.turnSpeed * (1.2 - Math.min(0.5, this.currentSpeed / (this.runSpeed + 1)));
      this.yaw += angleDiff * Math.min(1.0, effectiveTurnSpeed * delta);

      // Smooth acceleration curve (NO instant speed snapping!)
      this.currentSpeed = THREE.MathUtils.lerp(this.currentSpeed, desiredSpeed, delta * 3.5);

      // Bank into turn
      this.roll -= angleDiff * 0.15;

      // Advance position
      let nextX = this.position.x + Math.sin(this.yaw) * this.currentSpeed * delta;
      let nextZ = this.position.z + Math.cos(this.yaw) * this.currentSpeed * delta;

      // Physical Barrier & Fence Collision Check (PREVENTS WALL HACK!)
      const village = this.village || (this.terrain && this.terrain.village);
      if (village && village.resolveMovementCollision) {
        const col = village.resolveMovementCollision(this.position.x, this.position.z, nextX, nextZ, 0.45);
        if (col.blocked) {
          // Deflect heading along the fence/wall and absorb impact
          this.yaw += (Math.random() < 0.5 ? 1 : -1) * 0.65;
          this.currentSpeed *= 0.6;
        }
        nextX = col.x;
        nextZ = col.z;
      }

      if (this.terrain.isWater(nextX, nextZ)) {
        // Smoothly steer away from water
        this.yaw += Math.PI * 0.45;
        this.currentSpeed *= 0.5;
      } else {
        this.position.x = nextX;
        this.position.z = nextZ;
      }
    } else {
      // Natural deceleration to stop
      this.currentSpeed = THREE.MathUtils.lerp(this.currentSpeed, 0, delta * 5.0);
    }

    this.updateOrientationAndPosition(delta);
  }

  updatePositionOnTerrain() {
    this.updateOrientationAndPosition(0.016);
  }

  pickWanderPoint(radius = 28) {
    const village = this.village || (this.terrain && this.terrain.village);
    const isInsideVillage = (village && village.isInsideVillage)
      ? village.isInsideVillage(this.position.x, this.position.z)
      : (Math.hypot(this.position.x - 65, this.position.z - 35) < 35);

    for (let attempts = 0; attempts < 15; attempts++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 7 + Math.random() * radius;
      const x = this.position.x + Math.cos(angle) * dist;
      const z = this.position.z + Math.sin(angle) * dist;

      // Keep wander destination on the same side of the palisade fence
      if (village && village.isInsideVillage) {
        const targetInside = village.isInsideVillage(x, z);
        if (isInsideVillage !== targetInside) continue;
      }

      const half = this.terrain.size * 0.42;
      if (Math.abs(x) < half && Math.abs(z) < half && !this.terrain.isWater(x, z)) {
        const y = this.terrain.getHeight(x, z);
        this.targetPosition.set(x, y, z);
        return;
      }
    }
  }
}
