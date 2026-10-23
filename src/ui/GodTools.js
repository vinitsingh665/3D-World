export class GodTools {
  constructor(container, callbacks = {}) {
    this.container = container;
    this.callbacks = callbacks;
    this.element = null;
    this.activeTab = 'spawn'; // 'spawn' | 'village' | 'world'

    this.init();
  }

  init() {
    this.element = document.createElement('div');
    this.element.className = 'sim-godtools-dock';
    this.element.innerHTML = `
      <!-- Dock Category Tabs -->
      <div class="dock-tabs-row">
        <button class="dock-tab active" data-tab="spawn">
          <span>🐾</span> Creatures & Spawner
        </button>
        <button class="dock-tab" data-tab="village">
          <span>🏰</span> Village Orders & Build
        </button>
        <button class="dock-tab" data-tab="world">
          <span>☀️</span> Atmosphere & Sim
        </button>
      </div>

      <!-- Dock Content Panel -->
      <div class="dock-content">
        <!-- 1. Spawner Tab -->
        <div class="dock-panel active" id="panel-spawn">
          <button class="tool-btn" id="btn-spawn-villager" title="Spawn Villager">
            👨‍🌾 +Villager
          </button>
          <button class="tool-btn" id="btn-spawn-sheep" title="Spawn Woolly Sheep">
            🐑 +Sheep
          </button>
          <button class="tool-btn" id="btn-spawn-rabbit" title="Spawn Hopping Bunny">
            🐇 +Rabbit
          </button>
          <button class="tool-btn" id="btn-spawn-herbivore" title="Spawn Meadow Deer">
            🦌 +Deer
          </button>
          <button class="tool-btn" id="btn-spawn-predator" title="Spawn Timber Wolf">
            🐺 +Wolf
          </button>
          <button class="tool-btn" id="btn-spawn-food" title="Drop Food Cluster">
            🍎 +Food
          </button>
        </div>

        <!-- 2. Village Orders Tab -->
        <div class="dock-panel" id="panel-village">
          <button class="tool-btn civ-btn" id="btn-give-wood" title="Gift 50 Wood to Stockpile">
            🌲 +50 Wood
          </button>
          <button class="tool-btn civ-btn" id="btn-give-stone" title="Gift 50 Stone to Stockpile">
            ⛰️ +50 Stone
          </button>
          <button class="tool-btn civ-btn highlight-btn" id="btn-order-cottage" title="Order Cottage C Construction">
            🏠 Build Cottage
          </button>
          <button class="tool-btn civ-btn highlight-btn" id="btn-order-blacksmith" title="Order Blacksmith Forge Construction">
            ⚔️ Build Forge
          </button>
          <button class="tool-btn civ-btn highlight-btn" id="btn-order-watchtower" title="Order Watchtower Construction">
            🛡️ Build Tower
          </button>
          <button class="tool-btn civ-btn alarm-btn" id="btn-sound-alarm" title="Sound Village Alarm Horn">
            🚨 Sound Alarm
          </button>
        </div>

        <!-- 3. World & Atmosphere Tab -->
        <div class="dock-panel" id="panel-world">
          <div class="time-controls-compact">
            <div class="preset-group">
              <button class="preset-btn" data-time="6" title="Dawn">🌅 Dawn</button>
              <button class="preset-btn" data-time="12" title="Noon">☀️ Noon</button>
              <button class="preset-btn" data-time="18" title="Dusk">🌇 Dusk</button>
              <button class="preset-btn" data-time="0" title="Night">🌙 Night</button>
            </div>
            <input type="range" id="time-slider" min="0" max="24" step="0.2" value="10" class="sim-slider" />
          </div>

          <div class="tool-divider"></div>

          <button class="tool-btn" id="btn-toggle-weather">
            🌧️ Rain: OFF
          </button>
          <button class="tool-btn" id="btn-toggle-pause">
            ⏸️ Pause
          </button>

          <div class="speed-group">
            <button class="speed-btn active-speed" id="btn-speed-1" data-speed="1">1x</button>
            <button class="speed-btn" id="btn-speed-2" data-speed="2">2x</button>
            <button class="speed-btn" id="btn-speed-5" data-speed="5">5x</button>
          </div>

          <div class="tool-divider"></div>

          <button class="tool-btn mode-switch-btn" id="btn-toggle-cam">
            🎥 Switch to FPS [C]
          </button>
        </div>
      </div>
    `;

    this.container.appendChild(this.element);
    this.bindEvents();
  }

  bindEvents() {
    // Tab Switching
    const tabBtns = this.element.querySelectorAll('.dock-tab');
    const panels = this.element.querySelectorAll('.dock-panel');

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        tabBtns.forEach(b => b.classList.toggle('active', b === btn));
        panels.forEach(p => p.classList.toggle('active', p.id === `panel-${tab}`));
        this.activeTab = tab;
      });
    });

    // Spawners
    document.getElementById('btn-spawn-villager')?.addEventListener('click', () => {
      this.callbacks.onSpawnVillager?.();
    });

    document.getElementById('btn-spawn-sheep')?.addEventListener('click', () => {
      this.callbacks.onSpawnSheep?.();
    });

    document.getElementById('btn-spawn-rabbit')?.addEventListener('click', () => {
      this.callbacks.onSpawnRabbit?.();
    });

    document.getElementById('btn-spawn-herbivore')?.addEventListener('click', () => {
      this.callbacks.onSpawnHerbivore?.();
    });

    document.getElementById('btn-spawn-predator')?.addEventListener('click', () => {
      this.callbacks.onSpawnPredator?.();
    });

    document.getElementById('btn-spawn-food')?.addEventListener('click', () => {
      this.callbacks.onSpawnFood?.();
    });

    // Village Orders
    document.getElementById('btn-give-wood')?.addEventListener('click', () => {
      this.callbacks.onGiveWood?.(50);
    });

    document.getElementById('btn-give-stone')?.addEventListener('click', () => {
      this.callbacks.onGiveStone?.(50);
    });

    document.getElementById('btn-order-cottage')?.addEventListener('click', () => {
      this.callbacks.onOrderBuild?.('cottage');
    });

    document.getElementById('btn-order-blacksmith')?.addEventListener('click', () => {
      this.callbacks.onOrderBuild?.('blacksmith');
    });

    document.getElementById('btn-order-watchtower')?.addEventListener('click', () => {
      this.callbacks.onOrderBuild?.('watchtower');
    });

    document.getElementById('btn-sound-alarm')?.addEventListener('click', () => {
      this.callbacks.onSoundAlarm?.();
    });

    // Time Slider
    const slider = document.getElementById('time-slider');
    slider?.addEventListener('input', (e) => {
      this.callbacks.onTimeChange?.(parseFloat(e.target.value));
    });

    // Presets
    document.querySelectorAll('.preset-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const t = parseFloat(btn.dataset.time);
        if (slider) slider.value = t;
        this.callbacks.onTimeChange?.(t);
      });
    });

    // Weather toggle
    const weatherBtn = document.getElementById('btn-toggle-weather');
    let isRain = false;
    weatherBtn?.addEventListener('click', () => {
      isRain = !isRain;
      weatherBtn.textContent = isRain ? '🌧️ Rain: ON' : '🌧️ Rain: OFF';
      weatherBtn.classList.toggle('weather-active', isRain);
      this.callbacks.onWeatherToggle?.(isRain ? 'rain' : 'clear');
    });

    // Pause toggle
    const pauseBtn = document.getElementById('btn-toggle-pause');
    let isPaused = false;
    pauseBtn?.addEventListener('click', () => {
      isPaused = !isPaused;
      pauseBtn.textContent = isPaused ? '▶️ Resume' : '⏸️ Pause';
      pauseBtn.classList.toggle('pause-active', isPaused);
      this.callbacks.onPauseToggle?.(isPaused);
    });

    // Speeds
    const speedButtons = [
      document.getElementById('btn-speed-1'),
      document.getElementById('btn-speed-2'),
      document.getElementById('btn-speed-5')
    ];

    speedButtons.forEach((btn) => {
      btn?.addEventListener('click', () => {
        speedButtons.forEach(b => b?.classList.remove('active-speed'));
        btn.classList.add('active-speed');
        const speed = parseFloat(btn.dataset.speed);
        this.callbacks.onSpeedChange?.(speed);
      });
    });

    // Camera Switch
    const camBtn = document.getElementById('btn-toggle-cam');
    camBtn?.addEventListener('click', () => {
      this.callbacks.onCameraToggle?.();
    });
  }

  updateCameraBtnText(mode) {
    const btn = document.getElementById('btn-toggle-cam');
    if (btn) {
      btn.textContent = mode === 'god' ? '🎥 Switch to FPS [C]' : '🌐 Orbit Mode [C]';
    }
  }

  updateSlider(timeOfDay) {
    const slider = document.getElementById('time-slider');
    if (slider && document.activeElement !== slider) {
      slider.value = timeOfDay;
    }
  }
}
