import * as THREE from 'three';

export class SkyAtmosphere {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.timeOfDay = options.initialTime !== undefined ? options.initialTime : 10.5; // 10:30 AM
    this.dayDurationSeconds = options.dayDurationSeconds || 160;
    this.timePaused = false;
    this.timeScale = 1.0;

    this.weather = 'clear'; // 'clear' | 'rain'
    this.rainParticles = null;
    this.fireflyParticles = null;
    this.pollenParticles = null;
    this.cloudGroup = null;

    this.initLights();
    this.initStarfield();
    this.initClouds();
    this.initWeatherAndMotes();
    this.applyAtmosphere();
  }

  initLights() {
    // Ambient / Hemisphere lighting with cozy warm tone
    this.hemiLight = new THREE.HemisphereLight(0xffedd5, 0x334155, 0.85);
    this.scene.add(this.hemiLight);

    // Directional Sunlight with soft shadows scaled for larger world
    this.sunLight = new THREE.DirectionalLight(0xfff7ed, 2.0);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.sunLight.shadow.camera.near = 10;
    this.sunLight.shadow.camera.far = 700;

    const d = 260;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.bias = -0.0006;

    this.scene.add(this.sunLight);

    // Sun Visual Billboard with warm corona glow
    const sunGeo = new THREE.SphereGeometry(9, 16, 16);
    const sunMat = new THREE.MeshBasicMaterial({ color: 0xfffae0 });
    this.sunMesh = new THREE.Mesh(sunGeo, sunMat);

    // Sun outer glow ring
    const sunCoronaGeo = new THREE.RingGeometry(9.2, 16, 24);
    const sunCoronaMat = new THREE.MeshBasicMaterial({
      color: 0xfef08a,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.45
    });
    this.sunCorona = new THREE.Mesh(sunCoronaGeo, sunCoronaMat);
    this.sunMesh.add(this.sunCorona);
    this.scene.add(this.sunMesh);

    // Directional Moonlight
    this.moonLight = new THREE.DirectionalLight(0xc7d2fe, 0.45);
    this.scene.add(this.moonLight);

    const moonGeo = new THREE.SphereGeometry(6, 16, 16);
    const moonMat = new THREE.MeshBasicMaterial({ color: 0xf1f5f9 });
    this.moonMesh = new THREE.Mesh(moonGeo, moonMat);
    this.scene.add(this.moonMesh);

    // Atmospheric Fog (tuned for 480m expansive view)
    this.scene.fog = new THREE.FogExp2(0xbae6fd, 0.0024);
  }

  initStarfield() {
    const starCount = 2400;
    const starGeo = new THREE.BufferGeometry();
    const starPos = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      const r = 380 + Math.random() * 40;

      const y = Math.abs(r * Math.cos(phi)) + 10;
      const x = r * Math.sin(phi) * Math.cos(theta);
      const z = r * Math.sin(phi) * Math.sin(theta);

      starPos[i * 3] = x;
      starPos[i * 3 + 1] = y;
      starPos[i * 3 + 2] = z;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
    this.starMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.5,
      transparent: true,
      opacity: 0.0
    });

    this.starField = new THREE.Points(starGeo, this.starMat);
    this.scene.add(this.starField);
  }

  initClouds() {
    this.cloudGroup = new THREE.Group();
    const cloudCount = 36;
    this.clouds = [];

    const cloudMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.9,
      flatShading: true,
      transparent: true,
      opacity: 0.88
    });
    this.cloudMat = cloudMat;

    const baseSphereGeo = new THREE.DodecahedronGeometry(1, 1);

    for (let i = 0; i < cloudCount; i++) {
      const singleCloud = new THREE.Group();
      const puffCount = 5 + Math.floor(Math.random() * 4);

      for (let p = 0; p < puffCount; p++) {
        const puff = new THREE.Mesh(baseSphereGeo, cloudMat);
        const radius = 6 + Math.random() * 7;
        puff.scale.set(radius, radius * 0.65, radius);
        puff.position.set(
          (p - puffCount * 0.5) * 8 + (Math.random() - 0.5) * 4,
          (Math.random() - 0.5) * 3,
          (Math.random() - 0.5) * 6
        );
        puff.castShadow = false;
        puff.receiveShadow = false;
        singleCloud.add(puff);
      }

      // Distribute clouds across high altitude
      const angle = Math.random() * Math.PI * 2;
      const dist = 50 + Math.random() * 180;
      singleCloud.position.set(
        Math.cos(angle) * dist,
        65 + Math.random() * 30,
        Math.sin(angle) * dist
      );

      // Random slow drift velocity
      singleCloud.userData = {
        speed: 1.5 + Math.random() * 2.5
      };

      this.cloudGroup.add(singleCloud);
      this.clouds.push(singleCloud);
    }

    this.scene.add(this.cloudGroup);
  }

  initWeatherAndMotes() {
    // 1. Rain System (for large world)
    const rainCount = 3200;
    const rainGeo = new THREE.BufferGeometry();
    const rainPositions = new Float32Array(rainCount * 3);

    for (let i = 0; i < rainCount; i++) {
      rainPositions[i * 3] = (Math.random() - 0.5) * 320;
      rainPositions[i * 3 + 1] = Math.random() * 80;
      rainPositions[i * 3 + 2] = (Math.random() - 0.5) * 320;
    }

    rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
    this.rainMat = new THREE.PointsMaterial({
      color: 0x7dd3fc,
      size: 0.6,
      transparent: true,
      opacity: 0.0
    });

    this.rainParticles = new THREE.Points(rainGeo, this.rainMat);
    this.scene.add(this.rainParticles);

    // 2. Daytime Golden Pollen / Whimsical Motes
    const pollenCount = 260;
    const pollenGeo = new THREE.BufferGeometry();
    const pollenPos = new Float32Array(pollenCount * 3);

    for (let i = 0; i < pollenCount; i++) {
      pollenPos[i * 3] = (Math.random() - 0.5) * 260;
      pollenPos[i * 3 + 1] = 2.0 + Math.random() * 14;
      pollenPos[i * 3 + 2] = (Math.random() - 0.5) * 260;
    }

    pollenGeo.setAttribute('position', new THREE.BufferAttribute(pollenPos, 3));
    this.pollenMat = new THREE.PointsMaterial({
      color: 0xfef08a,
      size: 1.4,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending
    });

    this.pollenParticles = new THREE.Points(pollenGeo, this.pollenMat);
    this.scene.add(this.pollenParticles);

    // 3. Nighttime Fireflies
    const fireflyCount = 240;
    const fireflyGeo = new THREE.BufferGeometry();
    const fireflyPos = new Float32Array(fireflyCount * 3);

    for (let i = 0; i < fireflyCount; i++) {
      fireflyPos[i * 3] = (Math.random() - 0.5) * 240;
      fireflyPos[i * 3 + 1] = 2.0 + Math.random() * 10;
      fireflyPos[i * 3 + 2] = (Math.random() - 0.5) * 240;
    }

    fireflyGeo.setAttribute('position', new THREE.BufferAttribute(fireflyPos, 3));
    this.fireflyMat = new THREE.PointsMaterial({
      color: 0x86efac,
      size: 1.6,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending
    });

    this.fireflyParticles = new THREE.Points(fireflyGeo, this.fireflyMat);
    this.scene.add(this.fireflyParticles);
  }

  setWeather(type) {
    this.weather = type;
  }

  setTimeOfDay(hours) {
    this.timeOfDay = ((hours % 24) + 24) % 24;
    this.applyAtmosphere();
  }

  getTimeFormatted() {
    const hours = Math.floor(this.timeOfDay);
    const minutes = Math.floor((this.timeOfDay % 1) * 60);
    const pad = (n) => n.toString().padStart(2, '0');
    return `${pad(hours)}:${pad(minutes)}`;
  }

  applyAtmosphere() {
    const t = this.timeOfDay;
    const sunAngle = ((t - 6) / 24) * Math.PI * 2;
    const orbitRadius = 320;

    const sunX = Math.cos(sunAngle) * orbitRadius;
    const sunY = Math.sin(sunAngle) * orbitRadius;
    const sunZ = Math.sin(sunAngle * 0.5) * 60;

    this.sunLight.position.set(sunX, sunY, sunZ);
    this.sunMesh.position.set(sunX, sunY, sunZ);

    if (this.sunCorona) {
      this.sunCorona.lookAt(0, 0, 0);
    }

    // Moon is opposite to the sun
    this.moonLight.position.set(-sunX, -sunY, -sunZ);
    this.moonMesh.position.set(-sunX, -sunY, -sunZ);

    const sunElevation = Math.sin(sunAngle); // > 0 is day, < 0 is night

    // Cozy, vibrant sky color schemes
    const cSkyDawn = new THREE.Color(0xfb923c);     // Warm peach/apricot sunrise
    const cSkyNoon = new THREE.Color(0x38bdf8);     // Vibrant rich cerulean azure
    const cSkyDusk = new THREE.Color(0xf43f5e);     // Cozy strawberry/amber sunset
    const cSkyNight = new THREE.Color(0x090e1a);    // Deep velvety starlight navy

    const cSunDay = new THREE.Color(0xfffae5);      // Warm golden sunlight
    const cSunDawn = new THREE.Color(0xfba25a);     // Warm apricot
    const cSunDusk = new THREE.Color(0xf87171);     // Warm rose
    const cSunNight = new THREE.Color(0x000000);

    const cCloudDay = new THREE.Color(0xffffff);
    const cCloudDawn = new THREE.Color(0xfde047);
    const cCloudDusk = new THREE.Color(0xfca5a5);
    const cCloudNight = new THREE.Color(0x1e293b);

    let skyColor = new THREE.Color();
    let sunColor = new THREE.Color();
    let cloudColor = new THREE.Color();
    let sunIntensity = 0;
    let hemiIntensity = 0.5;
    let starOpacity = 0;
    let pollenOpacity = 0;

    if (t >= 5 && t < 7.5) {
      // Dawn (5:00 - 7:30 AM)
      const ratio = (t - 5) / 2.5;
      skyColor.lerpColors(cSkyNight, cSkyDawn, ratio);
      sunColor.lerpColors(cSunNight, cSunDawn, ratio);
      cloudColor.lerpColors(cCloudNight, cCloudDawn, ratio);
      sunIntensity = ratio * 1.6;
      hemiIntensity = 0.3 + ratio * 0.5;
      starOpacity = 1.0 - ratio;
      pollenOpacity = ratio * 0.4;
    } else if (t >= 7.5 && t < 16.5) {
      // Full Vibrant Day (7:30 AM - 4:30 PM)
      const ratio = Math.sin(((t - 7.5) / 9) * Math.PI);
      skyColor.lerpColors(cSkyDawn, cSkyNoon, Math.min(1.0, (t - 7.5) / 2.5));
      sunColor.copy(cSunDay);
      cloudColor.copy(cCloudDay);
      sunIntensity = 1.4 + ratio * 0.8;
      hemiIntensity = 0.75 + ratio * 0.3;
      starOpacity = 0.0;
      pollenOpacity = 0.75;
    } else if (t >= 16.5 && t < 20) {
      // Golden Hour / Sunset (4:30 PM - 8:00 PM)
      const ratio = (t - 16.5) / 3.5;
      skyColor.lerpColors(cSkyNoon, cSkyDusk, ratio);
      sunColor.lerpColors(cSunDay, cSunDusk, ratio);
      cloudColor.lerpColors(cCloudDay, cCloudDusk, ratio);
      sunIntensity = (1.0 - ratio) * 1.8;
      hemiIntensity = 0.7 - ratio * 0.4;
      starOpacity = ratio * 0.7;
      pollenOpacity = (1.0 - ratio) * 0.4;
    } else {
      // Night (8:00 PM - 5:00 AM)
      skyColor.copy(cSkyNight);
      sunColor.copy(cSunNight);
      cloudColor.copy(cCloudNight);
      sunIntensity = 0;
      hemiIntensity = 0.22;
      starOpacity = 1.0;
      pollenOpacity = 0.0;
    }

    // Weather adjustments
    if (this.weather === 'rain') {
      skyColor.multiplyScalar(0.48);
      cloudColor.multiplyScalar(0.5);
      sunIntensity *= 0.2;
      hemiIntensity *= 0.45;
      this.scene.fog.density = 0.0055;
    } else {
      this.scene.fog.density = 0.0022;
    }

    this.scene.background = skyColor;
    this.scene.fog.color.copy(skyColor);

    this.sunLight.color.copy(sunColor);
    this.sunLight.intensity = sunIntensity;
    this.hemiLight.color.copy(skyColor);
    this.hemiLight.intensity = hemiIntensity;

    if (this.cloudMat) {
      this.cloudMat.color.copy(cloudColor);
    }

    const moonIntensity = sunElevation < 0 ? Math.min(0.65, -sunElevation * 0.7) : 0;
    this.moonLight.intensity = moonIntensity;

    this.starMat.opacity = THREE.MathUtils.lerp(this.starMat.opacity, starOpacity, 0.1);
    if (this.pollenMat) {
      this.pollenMat.opacity = THREE.MathUtils.lerp(this.pollenMat.opacity, pollenOpacity, 0.1);
    }
  }

  update(delta) {
    if (!this.timePaused) {
      const hoursPerSec = 24 / this.dayDurationSeconds;
      this.timeOfDay = (this.timeOfDay + hoursPerSec * delta * this.timeScale) % 24;
      this.applyAtmosphere();
    }

    // Drifting fluffy clouds
    if (this.clouds) {
      const boundary = 280;
      for (let i = 0; i < this.clouds.length; i++) {
        const cloud = this.clouds[i];
        cloud.position.x += cloud.userData.speed * delta;
        if (cloud.position.x > boundary) {
          cloud.position.x = -boundary;
        }
      }
    }

    // Daytime Pollen motes
    if (this.pollenParticles && this.pollenMat.opacity > 0.01) {
      const pos = this.pollenParticles.geometry.attributes.position;
      const count = pos.count;
      const time = performance.now() * 0.0008;

      for (let i = 0; i < count; i++) {
        const x = pos.getX(i) + Math.sin(time + i * 0.3) * 0.06;
        const y = pos.getY(i) + Math.cos(time * 0.7 + i * 0.2) * 0.02;
        const z = pos.getZ(i) + Math.cos(time + i * 0.4) * 0.06;
        pos.setXYZ(i, x, y, z);
      }
      pos.needsUpdate = true;
    }

    // Rain update
    if (this.rainParticles) {
      const targetRainOpacity = this.weather === 'rain' ? 0.78 : 0.0;
      this.rainMat.opacity = THREE.MathUtils.lerp(this.rainMat.opacity, targetRainOpacity, delta * 3);

      if (this.rainMat.opacity > 0.01) {
        const pos = this.rainParticles.geometry.attributes.position;
        const count = pos.count;
        for (let i = 0; i < count; i++) {
          let y = pos.getY(i) - delta * 50;
          if (y < 0) {
            y = 75 + Math.random() * 5;
          }
          pos.setY(i, y);
        }
        pos.needsUpdate = true;
      }
    }

    // Night Fireflies
    if (this.fireflyParticles) {
      const isNight = this.timeOfDay < 5.5 || this.timeOfDay > 18.5;
      const targetFlyOpacity = (isNight && this.weather !== 'rain') ? 0.9 : 0.0;
      this.fireflyMat.opacity = THREE.MathUtils.lerp(this.fireflyMat.opacity, targetFlyOpacity, delta * 2);

      if (this.fireflyMat.opacity > 0.01) {
        const pos = this.fireflyParticles.geometry.attributes.position;
        const count = pos.count;
        const time = performance.now() * 0.001;
        for (let i = 0; i < count; i++) {
          const x = pos.getX(i) + Math.sin(time + i) * 0.05;
          const y = pos.getY(i) + Math.cos(time * 0.8 + i) * 0.03;
          const z = pos.getZ(i) + Math.sin(time * 0.6 + i) * 0.05;
          pos.setXYZ(i, x, y, z);
        }
        pos.needsUpdate = true;
      }
    }
  }
}
