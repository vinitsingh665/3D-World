import './style.css';
import { Engine } from './core/Engine.js';
import { CameraManager } from './core/CameraManager.js';
import { Terrain } from './environment/Terrain.js';
import { Village } from './environment/Village.js';
import { BiomeScatter } from './environment/BiomeScatter.js';
import { SkyAtmosphere } from './environment/SkyAtmosphere.js';
import { Ecosystem } from './simulation/Ecosystem.js';
import { HUD } from './ui/HUD.js';
import { Inspector } from './ui/Inspector.js';
import { GodTools } from './ui/GodTools.js';

window.addEventListener('DOMContentLoaded', () => {
  const canvasContainer = document.getElementById('canvas-container');
  const uiOverlay = document.getElementById('ui-overlay');
  const fpsCrosshair = document.getElementById('fps-crosshair');

  // 1. Core Engine
  const engine = new Engine(canvasContainer);

  // 2. Procedural World
  const terrain = new Terrain(engine.scene, {
    size: 480,
    segments: 220,
    waterLevel: 0,
    maxHeight: 34,
    seed: 5821
  });

  // 3. Cozy Village Settlement (Cottages, Sawmill, Well, Camp, Dirt Roads)
  const village = new Village(engine.scene, terrain);

  // 4. Vegetation with towering trees and forest clearings
  const biomeScatter = new BiomeScatter(engine.scene, terrain, village);

  // 5. Sky & Atmosphere
  const skyAtmosphere = new SkyAtmosphere(engine.scene, {
    initialTime: 11.0,
    dayDurationSeconds: 160
  });

  // 6. Camera Controller focused on cozy village
  const cameraManager = new CameraManager(engine.camera, engine.renderer.domElement, terrain);
  cameraManager.orbitTarget.set(65, 5.2, 35);
  cameraManager.orbitRadius = 55;
  cameraManager.orbitPhi = Math.PI * 0.32;
  cameraManager.orbitTheta = Math.PI * 0.28;

  // 7. Living Ecosystem & Human Villagers
  const ecosystem = new Ecosystem(engine.scene, terrain, biomeScatter, village);

  // 8. User Interface (HUD, Inspector, God Tools)
  const hud = new HUD(uiOverlay);

  const inspector = new Inspector(uiOverlay, (entity) => {
    cameraManager.focusEntity(entity);
  });

  // Simulation controls state
  let isPaused = false;
  let simSpeedMultiplier = 1.0;

  const godTools = new GodTools(uiOverlay, {
    onSpawnVillager: () => {
      ecosystem.spawnVillager();
    },
    onSpawnSheep: () => {
      const target = cameraManager.orbitTarget;
      ecosystem.spawnSheep(target.x + (Math.random() - 0.5) * 6, target.z + (Math.random() - 0.5) * 6);
    },
    onSpawnRabbit: () => {
      const target = cameraManager.orbitTarget;
      ecosystem.spawnRabbit(target.x + (Math.random() - 0.5) * 6, target.z + (Math.random() - 0.5) * 6);
    },
    onSpawnHerbivore: () => {
      const target = cameraManager.orbitTarget;
      ecosystem.spawnHerbivore(target.x + (Math.random() - 0.5) * 8, target.z + (Math.random() - 0.5) * 8);
    },
    onSpawnPredator: () => {
      const target = cameraManager.orbitTarget;
      ecosystem.spawnPredator(target.x + (Math.random() - 0.5) * 8, target.z + (Math.random() - 0.5) * 8);
    },
    onSpawnFood: () => {
      const target = cameraManager.orbitTarget;
      ecosystem.spawnFoodAt(target.x + (Math.random() - 0.5) * 6, target.z + (Math.random() - 0.5) * 6);
    },
    onGiveWood: (amt) => {
      village.addWood(amt, 'Sky Gift');
    },
    onGiveStone: (amt) => {
      village.addStone(amt, 'Sky Gift');
    },
    onOrderBuild: (type) => {
      const success = village.orderBuild(type);
      if (!success) {
        village.logEvent(`⚠️ Cannot build ${type} yet - stockpiles insufficient.`, 'alert');
      }
    },
    onSoundAlarm: () => {
      const threat = ecosystem.predators[0] || ecosystem.bears[0];
      ecosystem.alertGuards(threat);
      village.logEvent('🚨 TOWN ALARM SOUNDED: Guards rush to arms!', 'alert');
    },
    onTimeChange: (time) => {
      skyAtmosphere.setTimeOfDay(time);
    },
    onWeatherToggle: (type) => {
      skyAtmosphere.setWeather(type);
    },
    onPauseToggle: (paused) => {
      isPaused = paused;
      skyAtmosphere.timePaused = paused;
    },
    onSpeedChange: (speed) => {
      simSpeedMultiplier = speed;
      skyAtmosphere.timeScale = speed;
    },
    onCameraToggle: () => {
      cameraManager.toggleMode();
      godTools.updateCameraBtnText(cameraManager.mode);
    }
  });

  // 6. Raycasting Selection (Click to inspect)
  let clickStartX = 0;
  let clickStartY = 0;

  window.addEventListener('mousedown', (e) => {
    clickStartX = e.clientX;
    clickStartY = e.clientY;
  });

  window.addEventListener('mouseup', (e) => {
    // Only detect as click if mouse hasn't moved substantially (not a drag)
    const dist = Math.hypot(e.clientX - clickStartX, e.clientY - clickStartY);
    if (dist < 5 && cameraManager.mode === 'god') {
      // Don't intercept clicks on UI panels
      if (e.target.closest('#ui-overlay > *:not(#fps-crosshair):not(.click-hint)')) {
        return;
      }

      const hit = engine.raycast(e);
      if (hit && hit.entity) {
        inspector.select(hit.entity);
      }
    }
  });

  // 7. Master Simulation Loop
  engine.onUpdate((rawDelta, elapsedTime) => {
    // Raw delta for camera so camera navigation is always smooth even if simulation is paused
    cameraManager.updateCamera(rawDelta);

    // Crosshair visibility
    if (fpsCrosshair) {
      if (cameraManager.mode === 'fps') {
        fpsCrosshair.classList.add('active');
      } else {
        fpsCrosshair.classList.remove('active');
      }
    }
    godTools.updateCameraBtnText(cameraManager.mode);

    // Simulation updates
    const simDelta = isPaused ? 0 : rawDelta * simSpeedMultiplier;

    terrain.update(elapsedTime);
    skyAtmosphere.update(simDelta);

    if (simDelta > 0) {
      ecosystem.update(simDelta);
    }

    // UI Updates
    inspector.update();
    hud.update(
      ecosystem.getPopulationStats(),
      skyAtmosphere.getTimeFormatted(),
      skyAtmosphere.timeOfDay,
      cameraManager.mode,
      engine.fps
    );
    godTools.updateSlider(skyAtmosphere.timeOfDay);
  });
});
