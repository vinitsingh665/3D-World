# 🌍 3D Living Biosphere & Procedural World

An interactive, procedural 3D living ecosystem and autonomous village civilization built with **Three.js** and modern WebGL.

![3D Biosphere Banner](public/favicon.svg)

---

## ✨ Features

### 🏡 Autonomous Village Civilization
* **Professions & Daily Routines**: Farmers, Lumberjacks, Stonemasons, Builders, Guards, Hunters, and Blacksmiths with tailored tools and outfits.
* **Community Agriculture**: Golden wheat farm plots with planting, tending, growth stages, and bundle harvesting.
* **Settlement Expansion**: Construction projects including cozy cottages, sawmill, stone well, blacksmith forge, and windmills.
* **Stockpile Economy**: Real-time tracking of wood, stone, food, and crafting resources with visual resource yards.
* **Defensive Palisade & Fortified Gates**: Timber perimeter palisades seamlessly connecting to archway gates (West, East, and South).
* **Memorial System**: Fallen villagers are laid to rest with carved stone headstones (`🪦`) adorned with wildflowers and warm candle lanterns.

### 🦌 Autonomous Ecosystem & Wildlife
* **Diverse Fauna**: Graceful deer herds, cozy woolly sheep, quick hopping bunnies, agile red foxes, prowling timber wolves, and gentle forest brown bears.
* **Realistic Animal Gaits**: Species-specific kinematics (quadruped trotting, rabbit hopping, bear lumbering).
* **Simulated Food Chain**: Herbivores graze on lush meadows and drink at fresh shorelines; predators hunt; guards defend citizens against threats.
* **Vitals & Life Cycles**: Dynamic health, hunger, thirst, energy, reproduction, and lifespans.

### 🌅 Atmosphere & Environment
* **Day & Night Cycle**: Smooth celestial transitions with dynamic sun, moon phases, moving volumetric clouds, and twinkling stars.
* **Procedural Low-Poly Terrain**: Flat settlement plateau surrounded by rolling hills, clearings, and sparkling water bodies.
* **Dense Forest Clearings**: Towering pine and birch trees with ambient foliage.

### 🎮 Camera & God Tools
* **Orbit God Mode**: Smooth orbital camera navigation, panning, and zoom.
* **First-Person Mode**: Press `[C]` to switch into first-person exploration mode with crosshair and WASD ground navigation.
* **Live Inspector**: Click any creature, villager, or memorial headstone to inspect their real-time vitals, inventory, occupation, and stats.
* **Simulation Controls**: Pause, speed up (1x, 2x, 5x), time-of-day slider (Dawn, Noon, Dusk, Night), and spawner controls.

---

## 🚀 Quick Start

### Prerequisites
* [Node.js](https://nodejs.org/) (v18 or higher recommended)

### Installation
```bash
# Clone the repository
git clone https://github.com/vinitsingh665/3D-World.git
cd 3D-World

# Install dependencies
npm install

# Start the local development server
npm run dev
```

Open `http://localhost:5173` in your browser.

### Production Build
```bash
npm run build
```

---

## 🕹️ Controls

| Action | Control |
| :--- | :--- |
| **Orbit Camera** | Left-click + Drag |
| **Pan Camera** | Right-click + Drag |
| **Zoom** | Mouse Scroll Wheel |
| **Inspect Entity** | Left-click on any villager, animal, or headstone |
| **First-Person Toggle** | Press `[C]` |
| **First-Person Movement** | `W`, `A`, `S`, `D` / Mouse to look |

---

## 🛠️ Built With
* **Three.js** (WebGL 3D Engine)
* **Vite** (Build Tool & Dev Server)
* **Vanilla JavaScript & CSS**

---

## 📄 License
MIT License.
