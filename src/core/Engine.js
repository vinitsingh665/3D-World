import * as THREE from 'three';

export class Engine {
  constructor(canvasContainer) {
    this.container = canvasContainer;

    // 1. Scene
    this.scene = new THREE.Scene();

    // 2. Camera
    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.2,
      1400
    );

    // 3. Renderer
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.12;

    this.container.appendChild(this.renderer.domElement);

    // 4. Timing & State
    this.clock = new THREE.Clock();
    this.updateCallbacks = [];
    this.raycaster = new THREE.Raycaster();
    this.mouse = new THREE.Vector2();

    this.fps = 60;
    this.frameCount = 0;
    this.lastFpsUpdate = performance.now();

    this.initResize();
    this.startLoop();
  }

  initResize() {
    window.addEventListener('resize', () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
    });
  }

  onUpdate(callback) {
    this.updateCallbacks.push(callback);
  }

  startLoop() {
    const tick = () => {
      requestAnimationFrame(tick);

      // Delta time with clamp to avoid physics explosion on tab switch
      const delta = Math.min(0.08, this.clock.getDelta());
      const elapsedTime = this.clock.getElapsedTime();

      // FPS tracking
      this.frameCount++;
      const now = performance.now();
      if (now - this.lastFpsUpdate >= 1000) {
        this.fps = Math.round((this.frameCount * 1000) / (now - this.lastFpsUpdate));
        this.frameCount = 0;
        this.lastFpsUpdate = now;
      }

      // Invoke all systems
      for (let i = 0; i < this.updateCallbacks.length; i++) {
        this.updateCallbacks[i](delta, elapsedTime);
      }

      this.renderer.render(this.scene, this.camera);
    };

    tick();
  }

  raycast(event) {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.scene.children, true);

    for (let i = 0; i < intersects.length; i++) {
      const obj = intersects[i].object;
      if (obj.userData && obj.userData.entity) {
        return {
          entity: obj.userData.entity,
          point: intersects[i].point
        };
      }
    }

    if (intersects.length > 0) {
      return {
        point: intersects[0].point,
        object: intersects[0].object
      };
    }

    return null;
  }
}
