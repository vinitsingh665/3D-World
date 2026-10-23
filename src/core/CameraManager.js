import * as THREE from 'three';

export class CameraManager {
  constructor(camera, domElement, terrain) {
    this.camera = camera;
    this.domElement = domElement;
    this.terrain = terrain;

    this.mode = 'god'; // 'god' | 'fps'
    this.followingEntity = null;

    // God Mode Orbit state
    this.orbitTarget = new THREE.Vector3(0, 5, 0);
    this.orbitRadius = 120;
    this.orbitTheta = Math.PI * 0.25; // Horizontal angle
    this.orbitPhi = Math.PI * 0.32;   // Vertical angle (clamped)
    this.minRadius = 8;
    this.maxRadius = 550;

    // First Person State
    this.fpsPos = new THREE.Vector3(0, 10, 0);
    this.fpsYaw = 0;
    this.fpsPitch = 0;
    this.fpsVelocity = new THREE.Vector3();
    this.isGrounded = true;
    this.verticalVelocity = 0;
    this.playerHeight = 1.8;
    this.isPointerLocked = false;

    // Input tracking
    this.keys = {};
    this.isDragging = false;
    this.dragButton = 0; // 0 = left, 2 = right
    this.prevMouse = { x: 0, y: 0 };

    this.initEvents();
    this.updateCamera(0.016);
  }

  initEvents() {
    // Mouse events for God Mode orbit/pan
    this.domElement.addEventListener('mousedown', (e) => {
      if (this.mode === 'god') {
        this.isDragging = true;
        this.dragButton = e.button;
        this.prevMouse.x = e.clientX;
        this.prevMouse.y = e.clientY;
      } else if (this.mode === 'fps' && !this.isPointerLocked) {
        this.domElement.requestPointerLock?.();
      }
    });

    window.addEventListener('mouseup', () => {
      this.isDragging = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (this.mode === 'god' && this.isDragging) {
        const dx = e.clientX - this.prevMouse.x;
        const dy = e.clientY - this.prevMouse.y;
        this.prevMouse.x = e.clientX;
        this.prevMouse.y = e.clientY;

        if (this.dragButton === 0) {
          // Orbit rotate
          this.orbitTheta -= dx * 0.007;
          this.orbitPhi = Math.max(0.1, Math.min(Math.PI * 0.48, this.orbitPhi - dy * 0.007));
        } else if (this.dragButton === 2) {
          // Pan scaled with zoom level
          const forward = new THREE.Vector3();
          this.camera.getWorldDirection(forward);
          forward.y = 0;
          forward.normalize();
          const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();

          const panFactor = Math.max(0.04, (this.orbitRadius / 100) * 0.1);
          this.orbitTarget.addScaledVector(right, -dx * panFactor);
          this.orbitTarget.addScaledVector(forward, dy * panFactor);
          this.followingEntity = null; // Break follow on manual pan
        }
      } else if (this.mode === 'fps' && this.isPointerLocked) {
        const sensitivity = 0.0022;
        this.fpsYaw -= e.movementX * sensitivity;
        this.fpsPitch = Math.max(-Math.PI * 0.45, Math.min(Math.PI * 0.45, this.fpsPitch - e.movementY * sensitivity));
      }
    });

    // Zoom
    this.domElement.addEventListener('wheel', (e) => {
      if (this.mode === 'god') {
        e.preventDefault();
        const factor = e.deltaY > 0 ? 1.1 : 0.9;
        this.orbitRadius = Math.max(this.minRadius, Math.min(this.maxRadius, this.orbitRadius * factor));
      }
    }, { passive: false });

    // Pointer lock change
    document.addEventListener('pointerlockchange', () => {
      this.isPointerLocked = (document.pointerLockElement === this.domElement);
    });

    // Context menu prevent
    this.domElement.addEventListener('contextmenu', (e) => e.preventDefault());

    // Keyboard controls
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'KeyC') {
        this.toggleMode();
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });
  }

  toggleMode() {
    if (this.mode === 'god') {
      this.setMode('fps');
    } else {
      this.setMode('god');
    }
  }

  setMode(newMode) {
    this.mode = newMode;
    if (this.mode === 'fps') {
      // Initialize FPS pos near current camera or orbit target
      this.fpsPos.copy(this.orbitTarget);
      const ground = this.terrain.getHeight(this.fpsPos.x, this.fpsPos.z);
      this.fpsPos.y = ground + this.playerHeight;
      this.fpsYaw = this.orbitTheta + Math.PI;
      this.fpsPitch = 0;
      this.followingEntity = null;
      this.domElement.requestPointerLock?.();
    } else {
      if (document.exitPointerLock && this.isPointerLocked) {
        document.exitPointerLock();
      }
      this.orbitTarget.copy(this.fpsPos);
      this.orbitRadius = 50;
    }
  }

  focusEntity(entity) {
    this.followingEntity = entity;
  }

  updateCamera(delta) {
    if (this.mode === 'god') {
      // If following entity, smoothly track it
      if (this.followingEntity && this.followingEntity.isAlive) {
        this.orbitTarget.lerp(this.followingEntity.position, delta * 5.0);
      }

      // Calculate spherical coordinates to cartesian
      const sinPhi = Math.sin(this.orbitPhi);
      const cosPhi = Math.cos(this.orbitPhi);
      const sinTheta = Math.sin(this.orbitTheta);
      const cosTheta = Math.cos(this.orbitTheta);

      const eyeX = this.orbitTarget.x + this.orbitRadius * sinPhi * sinTheta;
      const eyeY = this.orbitTarget.y + this.orbitRadius * cosPhi;
      const eyeZ = this.orbitTarget.z + this.orbitRadius * sinPhi * cosTheta;

      // Keep camera above terrain
      const terrainHeightAtEye = this.terrain.getHeight(eyeX, eyeZ);
      const safeY = Math.max(eyeY, terrainHeightAtEye + 2.0);

      this.camera.position.set(eyeX, safeY, eyeZ);
      this.camera.lookAt(this.orbitTarget);

    } else if (this.mode === 'fps') {
      // FPS Movement handling
      const moveSpeed = this.keys['ShiftLeft'] ? 18.0 : 10.0;
      const moveVec = new THREE.Vector3();

      if (this.keys['KeyW']) moveVec.z -= 1;
      if (this.keys['KeyS']) moveVec.z += 1;
      if (this.keys['KeyA']) moveVec.x -= 1;
      if (this.keys['KeyD']) moveVec.x += 1;

      moveVec.normalize();

      // Transform direction based on fpsYaw
      const cosYaw = Math.cos(this.fpsYaw);
      const sinYaw = Math.sin(this.fpsYaw);

      const worldMoveX = (moveVec.x * cosYaw + moveVec.z * sinYaw) * moveSpeed * delta;
      const worldMoveZ = (-moveVec.x * sinYaw + moveVec.z * cosYaw) * moveSpeed * delta;

      const nextX = this.fpsPos.x + worldMoveX;
      const nextZ = this.fpsPos.z + worldMoveZ;

      // Restrict world boundaries
      const half = this.terrain.size * 0.44;
      if (Math.abs(nextX) < half && Math.abs(nextZ) < half) {
        this.fpsPos.x = nextX;
        this.fpsPos.z = nextZ;
      }

      // Jump & Gravity
      const terrainH = this.terrain.getHeight(this.fpsPos.x, this.fpsPos.z);
      const groundY = terrainH + this.playerHeight;

      if (this.keys['Space'] && this.isGrounded) {
        this.verticalVelocity = 9.0;
        this.isGrounded = false;
      }

      if (!this.isGrounded) {
        this.verticalVelocity -= 22.0 * delta; // Gravity
        this.fpsPos.y += this.verticalVelocity * delta;

        if (this.fpsPos.y <= groundY) {
          this.fpsPos.y = groundY;
          this.verticalVelocity = 0;
          this.isGrounded = true;
        }
      } else {
        // Smooth ground following
        this.fpsPos.y = THREE.MathUtils.lerp(this.fpsPos.y, groundY, delta * 15);
      }

      // Set camera orientation
      this.camera.position.copy(this.fpsPos);

      const lookTarget = new THREE.Vector3(
        this.fpsPos.x + Math.sin(this.fpsYaw) * Math.cos(this.fpsPitch),
        this.fpsPos.y + Math.sin(this.fpsPitch),
        this.fpsPos.z - Math.cos(this.fpsYaw) * Math.cos(this.fpsPitch)
      );

      this.camera.lookAt(lookTarget);
    }
  }
}
