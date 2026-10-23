export class HUD {
  constructor(container) {
    this.container = container;
    this.element = null;
    this.toastElement = null;
    this.toastTimeout = null;
    this.lastEventId = null;

    this.init();
  }

  init() {
    // 1. Single Unified Top Navigation & Status Bar
    this.element = document.createElement('div');
    this.element.className = 'sim-hud-top';
    this.element.innerHTML = `
      <!-- Left: Logo & Civilization Era -->
      <div class="hud-left-group">
        <div class="brand-badge">🌿 3D BIOSPHERE</div>
        <div class="hud-fps" id="hud-fps">60 FPS</div>
        <div class="civ-era-pill" id="civ-era-pill" title="Current Civilization Era">
          <span class="era-icon">🏰</span>
          <span class="era-name" id="civ-era-name">Age I: Settlement</span>
        </div>
      </div>

      <!-- Center: Stockpile Resources & Construction Project -->
      <div class="hud-center-group">
        <div class="civ-resources-bar" title="Village Stockpile Resources">
          <div class="res-item" title="Wood Logs">
            <span class="res-icon">🌲</span>
            <span class="res-val" id="res-wood">45</span>
          </div>
          <div class="res-item" title="Stone Blocks">
            <span class="res-icon">⛰️</span>
            <span class="res-val" id="res-stone">25</span>
          </div>
          <div class="res-item" title="Stored Food">
            <span class="res-icon">🍖</span>
            <span class="res-val" id="res-food">35</span>
          </div>
          <div class="res-item" title="Iron Ingots">
            <span class="res-icon">⚙️</span>
            <span class="res-val" id="res-iron">10</span>
          </div>
          <div class="res-item" title="Weapons">
            <span class="res-icon">⚔️</span>
            <span class="res-val" id="res-weapons">4</span>
          </div>
          <div class="res-item" title="Armor & Shields">
            <span class="res-icon">🛡️</span>
            <span class="res-val" id="res-armor">2</span>
          </div>
        </div>

        <div class="civ-project-pill" id="civ-project-pill" title="Town Construction Status">
          <span class="project-icon">🔨</span>
          <span class="project-title" id="civ-project-title">Stockpiles Ready</span>
          <span class="project-pct" id="civ-project-pct"></span>
        </div>
      </div>

      <!-- Right: Population Counts, Time, Perspective -->
      <div class="hud-right-group">
        <div class="stat-pills-bar">
          <div class="stat-mini-pill" title="Human Villagers">
            <span>👨‍🌾</span>
            <span class="mini-val" id="stat-villagers">8</span>
          </div>
          <div class="stat-mini-pill" title="Wild Prey (Deer, Sheep, Rabbits)">
            <span>🦌</span>
            <span class="mini-val" id="stat-herbivores">60</span>
          </div>
          <div class="stat-mini-pill" title="Predators (Wolves, Bears, Foxes)">
            <span>🐺</span>
            <span class="mini-val" id="stat-predators">9</span>
          </div>
        </div>

        <div class="time-mini-pill" id="hud-time-container">
          <span id="time-icon">☀️</span>
          <span id="hud-time">12:00</span>
        </div>

        <div class="mode-mini-pill" id="hud-mode-pill" title="Camera Perspective">
          <span class="mode-key">C</span>
          <span id="hud-mode-text">Orbit</span>
        </div>
      </div>
    `;
    this.container.appendChild(this.element);

    // 2. Floating Centered Event Toast (Never overlaps Inspector or Dock)
    this.toastElement = document.createElement('div');
    this.toastElement.className = 'sim-event-toast hidden';
    this.toastElement.innerHTML = `
      <span class="toast-icon" id="toast-icon">📢</span>
      <span class="toast-text" id="toast-text">Welcome to the Living Biosphere!</span>
    `;
    this.container.appendChild(this.toastElement);

    // References
    this.elFps = document.getElementById('hud-fps');
    this.elVillagers = document.getElementById('stat-villagers');
    this.elHerbivores = document.getElementById('stat-herbivores');
    this.elPredators = document.getElementById('stat-predators');
    this.elTime = document.getElementById('hud-time');
    this.elTimeIcon = document.getElementById('time-icon');
    this.elModeText = document.getElementById('hud-mode-text');

    // Civ references
    this.elEraName = document.getElementById('civ-era-name');
    this.elResWood = document.getElementById('res-wood');
    this.elResStone = document.getElementById('res-stone');
    this.elResFood = document.getElementById('res-food');
    this.elResIron = document.getElementById('res-iron');
    this.elResWeapons = document.getElementById('res-weapons');
    this.elResArmor = document.getElementById('res-armor');

    this.elProjectTitle = document.getElementById('civ-project-title');
    this.elProjectPct = document.getElementById('civ-project-pct');

    this.elToastText = document.getElementById('toast-text');
    this.elToastIcon = document.getElementById('toast-icon');
  }

  showToast(text, icon = '📢') {
    if (!this.toastElement) return;

    if (this.elToastText) this.elToastText.textContent = text;
    if (this.elToastIcon) this.elToastIcon.textContent = icon;

    this.toastElement.classList.remove('hidden');
    this.toastElement.classList.remove('fade-out');

    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      this.toastElement.classList.add('fade-out');
      setTimeout(() => {
        this.toastElement.classList.add('hidden');
      }, 400);
    }, 4500);
  }

  update(stats, timeFormatted, timeOfDay, cameraMode, fps) {
    if (this.elFps) this.elFps.textContent = `${fps} FPS`;
    if (this.elVillagers) this.elVillagers.textContent = stats.villagers || 0;
    if (this.elHerbivores) this.elHerbivores.textContent = stats.herbivores;
    if (this.elPredators) this.elPredators.textContent = stats.predators;

    if (this.elTime) this.elTime.textContent = timeFormatted;
    if (this.elTimeIcon) {
      this.elTimeIcon.textContent = (timeOfDay >= 6 && timeOfDay < 18) ? '☀️' : '🌙';
    }

    if (this.elModeText) {
      this.elModeText.textContent = cameraMode === 'god' ? 'Orbit' : 'FPS (WASD)';
    }

    // Update Civilization & Stockpile Resources
    if (stats.villageResources) {
      const res = stats.villageResources;
      if (this.elResWood) this.elResWood.textContent = res.wood || 0;
      if (this.elResStone) this.elResStone.textContent = res.stone || 0;
      if (this.elResFood) this.elResFood.textContent = res.food || 0;
      if (this.elResIron) this.elResIron.textContent = res.iron || 0;
      if (this.elResWeapons) this.elResWeapons.textContent = res.weapons || 0;
      if (this.elResArmor) this.elResArmor.textContent = res.armor || 0;
    }

    if (stats.villageEra && this.elEraName) {
      this.elEraName.textContent = stats.villageEra;
    }

    // Active Project
    if (stats.activeProject) {
      const p = stats.activeProject;
      const pct = Math.floor(p.progress || 0);
      if (this.elProjectTitle) this.elProjectTitle.textContent = `${p.name}`;
      if (this.elProjectPct) this.elProjectPct.textContent = `${pct}%`;
    } else {
      if (this.elProjectTitle) this.elProjectTitle.textContent = 'Stockpiles Ready';
      if (this.elProjectPct) this.elProjectPct.textContent = '';
    }

    // Latest Event Toast Trigger
    if (stats.villageEvents && stats.villageEvents.length > 0) {
      const latest = stats.villageEvents[0];
      if (this.lastEventId !== latest.id) {
        this.lastEventId = latest.id;
        const icon = latest.type === 'combat' ? '⚔️' :
                     latest.type === 'milestone' ? '🎉' :
                     latest.type === 'alert' ? '🚨' :
                     latest.type === 'crafting' ? '🛡️' : '📢';
        this.showToast(latest.text, icon);
      }
    }
  }
}
