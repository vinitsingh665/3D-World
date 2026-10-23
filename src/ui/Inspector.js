export class Inspector {
  constructor(container, onFollowCallback) {
    this.container = container;
    this.onFollowCallback = onFollowCallback;
    this.selectedEntity = null;
    this.element = null;

    this.init();
  }

  init() {
    this.element = document.createElement('div');
    this.element.className = 'sim-inspector-card hidden';
    this.element.innerHTML = `
      <div class="card-header">
        <div class="card-title-group">
          <span class="card-icon" id="insp-icon">🦌</span>
          <div>
            <h3 class="card-title" id="insp-title">Herbivore #1</h3>
            <span class="card-species" id="insp-species">Species: Herbivore</span>
          </div>
        </div>
        <button class="card-close-btn" id="insp-close-btn">✕</button>
      </div>

      <div class="state-badge-container">
        <span class="state-label">CURRENT TASK:</span>
        <span class="state-badge state-wander" id="insp-state">WANDER</span>
      </div>

      <!-- Human / Villager Gear Section (dynamically shown) -->
      <div class="villager-gear-section hidden" id="insp-gear-section">
        <div class="gear-title">EQUIPMENT & GEAR</div>
        <div class="gear-grid">
          <div class="gear-badge" id="gear-weapon">⚔️ Weapon: None</div>
          <div class="gear-badge" id="gear-shield">🛡️ Shield: None</div>
          <div class="gear-badge" id="gear-helmet">🎩 Head: Straw Hat</div>
          <div class="gear-badge" id="gear-armor">🦺 Armor: Tunic</div>
        </div>
        <div class="gear-carried" id="gear-carried">🎒 Carrying: None</div>
      </div>

      <div class="vitals-container">
        <div class="vital-row">
          <div class="vital-header">
            <span>❤️ Health</span>
            <span id="insp-val-health">100%</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill bar-health" id="insp-bar-health" style="width: 100%"></div>
          </div>
        </div>

        <div class="vital-row">
          <div class="vital-header">
            <span>🌾 Hunger</span>
            <span id="insp-val-hunger">20%</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill bar-hunger" id="insp-bar-hunger" style="width: 20%"></div>
          </div>
        </div>

        <div class="vital-row">
          <div class="vital-header">
            <span>💧 Thirst</span>
            <span id="insp-val-thirst">15%</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill bar-thirst" id="insp-bar-thirst" style="width: 15%"></div>
          </div>
        </div>

        <div class="vital-row">
          <div class="vital-header">
            <span>⚡ Energy</span>
            <span id="insp-val-energy">90%</span>
          </div>
          <div class="bar-track">
            <div class="bar-fill bar-energy" id="insp-bar-energy" style="width: 90%"></div>
          </div>
        </div>
      </div>

      <div class="card-meta">
        <div>Age: <span id="insp-age">12m</span> / <span id="insp-max-age">180m</span></div>
        <div>Speed: <span id="insp-speed">3.8 u/s</span></div>
      </div>

      <button class="btn-follow-entity" id="insp-btn-follow">
        🎥 Lock Camera onto Creature
      </button>
    `;

    this.container.appendChild(this.element);

    this.elTitle = document.getElementById('insp-title');
    this.elSpecies = document.getElementById('insp-species');
    this.elIcon = document.getElementById('insp-icon');
    this.elState = document.getElementById('insp-state');

    this.elGearSection = document.getElementById('insp-gear-section');
    this.elGearWeapon = document.getElementById('gear-weapon');
    this.elGearShield = document.getElementById('gear-shield');
    this.elGearHelmet = document.getElementById('gear-helmet');
    this.elGearArmor = document.getElementById('gear-armor');
    this.elGearCarried = document.getElementById('gear-carried');

    this.elValHealth = document.getElementById('insp-val-health');
    this.elBarHealth = document.getElementById('insp-bar-health');

    this.elValHunger = document.getElementById('insp-val-hunger');
    this.elBarHunger = document.getElementById('insp-bar-hunger');

    this.elValThirst = document.getElementById('insp-val-thirst');
    this.elBarThirst = document.getElementById('insp-bar-thirst');

    this.elValEnergy = document.getElementById('insp-val-energy');
    this.elBarEnergy = document.getElementById('insp-bar-energy');

    this.elAge = document.getElementById('insp-age');
    this.elMaxAge = document.getElementById('insp-max-age');
    this.elSpeed = document.getElementById('insp-speed');

    document.getElementById('insp-close-btn').addEventListener('click', () => {
      this.deselect();
    });

    document.getElementById('insp-btn-follow').addEventListener('click', () => {
      if (this.selectedEntity && this.onFollowCallback) {
        this.onFollowCallback(this.selectedEntity);
      }
    });
  }

  select(entity) {
    this.selectedEntity = entity;
    this.element.classList.remove('hidden');
    this.update();
  }

  deselect() {
    this.selectedEntity = null;
    this.element.classList.add('hidden');
  }

  update() {
    if (!this.selectedEntity) return;
    const e = this.selectedEntity;

    if (!e.isAlive) {
      const isVillager = e.species === 'Villager';
      this.elTitle.textContent = isVillager ? `🪦 Memorial: ${e.name || 'Villager'}` : `${e.species} #${e.id} (Deceased)`;
      this.elSpecies.textContent = isVillager
        ? `Profession: Former ${e.profession || 'Villager'} • ${e.deathCause || 'Lived peacefully'}`
        : `Status: Deceased (${e.deathCause || 'Natural Causes'})`;
      this.elIcon.textContent = isVillager ? '🪦' : '☠️';
      this.elState.textContent = isVillager ? '🕊️ Resting in Peace' : 'DEAD';
      this.elState.className = 'state-badge state-dead';
      this.elBarHealth.style.width = '0%';
      this.elValHealth.textContent = '0%';
      this.elSpeed.textContent = '0.0 u/s';
      this.elAge.textContent = `${Math.round(e.age)}s`;
      this.elMaxAge.textContent = `${Math.round(e.maxAge)}s`;
      this.elValHunger.textContent = '0%';
      this.elBarHunger.style.width = '0%';
      this.elValThirst.textContent = '0%';
      this.elBarThirst.style.width = '0%';
      this.elValEnergy.textContent = '0%';
      this.elBarEnergy.style.width = '0%';
      if (this.elGearSection) this.elGearSection.classList.add('hidden');
      return;
    }

    const speciesIcons = {
      Villager: '👨‍🌾',
      Sheep: '🐑',
      Rabbit: '🐇',
      Herbivore: '🦌',
      Fox: '🦊',
      Bear: '🐻',
      Predator: '🐺'
    };

    const speciesDescriptions = {
      Villager: `Occupation: ${e.profession || 'Town Inhabitant'}`,
      Sheep: 'Class: Cozy Woolly Grazer',
      Rabbit: 'Class: Quick Hopping Forager',
      Herbivore: 'Class: Graceful Meadow Deer',
      Fox: 'Class: Agile Red Scavenger',
      Bear: 'Class: Gentle Forest Giant',
      Predator: 'Class: Timber Apex Predator'
    };

    this.elIcon.textContent = speciesIcons[e.species] || '🐾';
    this.elTitle.textContent = e.species === 'Villager' ? `${e.name || 'Villager'} (${e.profession})` : `${e.species} #${e.id}`;
    this.elSpecies.textContent = speciesDescriptions[e.species] || `Class: ${e.species}`;

    // Format human readable action states
    const stateLabels = {
      SEEK_TREE: '🪓 Heading to cut tree',
      CHOP_TREE: '🪓 Chopping tree logs',
      SEEK_ROCK: '⛏️ Heading to mine rock',
      MINE_ROCK: '⛏️ Mining stone blocks',
      SEEK_FARM: '🌾 Walking to Wheat Farm',
      TEND_FARM: '🌱 Weeding & Tilling Crops',
      HARVEST_CROPS: '🌾 Harvesting Golden Wheat',
      HAUL_RESOURCE: '🎒 Hauling goods to Stockpile',
      SEEK_CONSTRUCTION: '🔨 Heading to Construction Site',
      BUILD: '🔨 Hammering Scaffolding',
      SEEK_PREY: '🏹 Stalking Forest Prey',
      ATTACK_BEAST: '⚔️ Defending Village from Beast!',
      FLEE_DANGER: '⚠️ Fleeing Predator!',
      PATROL_PERIMETER: '🛡️ Patrolling Town Border',
      FORGE: '🔥 Forging Iron Gear at Anvil',
      WALK_PATH: '🚶 Strolling on cobblestone',
      VISIT_WELL: '💧 Drinking at Stone Well',
      REST_COTTAGE: '🏠 Resting in Cottage',
      WANDER: 'Wandering meadow',
      HUNT: 'Hunting prey',
      EAT: 'Eating meal',
      DRINK: 'Drinking river water'
    };

    this.elState.textContent = stateLabels[e.state] || e.state;
    this.elState.className = `state-badge state-${e.state.toLowerCase()}`;

    // Villager Gear Display
    if (e.species === 'Villager' && e.equipment) {
      this.elGearSection.classList.remove('hidden');
      const eq = e.equipment;

      const weaponNames = {
        axe: '🪓 Steel Axe',
        pickaxe: '⛏️ Iron Pickaxe',
        hammer: '🔨 Builder Mallet',
        hoe: '🌾 Iron Farmer Hoe',
        sword: '⚔️ Guard Sword',
        spear: '🗡️ Hunting Spear',
        bow: '🏹 Curved Bow',
        none: '✊ Bare Hands'
      };

      const helmetNames = {
        straw: '🌾 Straw Hat',
        iron: '⛑️ Iron Knight Helmet',
        none: 'None'
      };

      const carriedNames = {
        log: '🌲 1x Wood Log',
        stone: '⛰️ 1x Stone Block',
        meat: '🍖 1x Fresh Meat',
        wheat: '🌾 1x Golden Wheat Bundle',
        none: 'None'
      };

      if (this.elGearWeapon) this.elGearWeapon.textContent = `Weapon: ${weaponNames[eq.weapon] || eq.weapon}`;
      if (this.elGearShield) this.elGearShield.textContent = `Shield: ${eq.shield ? '🛡️ Royal Blue Buckler' : 'None'}`;
      if (this.elGearHelmet) this.elGearHelmet.textContent = `Head: ${helmetNames[eq.helmet] || eq.helmet}`;
      if (this.elGearArmor) this.elGearArmor.textContent = `Armor: ${eq.armor ? '🛡️ Steel Plate & Pauldrons' : '👕 Linen Tunic'}`;
      if (this.elGearCarried) this.elGearCarried.textContent = `🎒 Carrying: ${carriedNames[eq.carried] || eq.carried}`;
    } else {
      if (this.elGearSection) this.elGearSection.classList.add('hidden');
    }

    // Health percentage
    const maxHp = e.maxHealth || 100;
    const hp = Math.max(0, Math.min(100, Math.round((e.health / maxHp) * 100)));
    this.elValHealth.textContent = `${hp}%`;
    this.elBarHealth.style.width = `${hp}%`;

    // Hunger (0 is full, 100 is starving)
    const hunger = Math.min(100, Math.round(e.hunger));
    this.elValHunger.textContent = `${hunger}%`;
    this.elBarHunger.style.width = `${hunger}%`;

    // Thirst
    const thirst = Math.min(100, Math.round(e.thirst));
    this.elValThirst.textContent = `${thirst}%`;
    this.elBarThirst.style.width = `${thirst}%`;

    // Energy
    const energy = Math.max(0, Math.round(e.energy));
    this.elValEnergy.textContent = `${energy}%`;
    this.elBarEnergy.style.width = `${energy}%`;

    // Meta
    this.elAge.textContent = `${Math.round(e.age)}s`;
    this.elMaxAge.textContent = `${Math.round(e.maxAge)}s`;
    this.elSpeed.textContent = `${e.currentSpeed.toFixed(1)} u/s`;
  }
}
