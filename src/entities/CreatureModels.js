import * as THREE from 'three';

export class CreatureModels {
  // Build procedural low-poly Herbivore (Deer)
  static createHerbivoreModel() {
    const root = new THREE.Group();

    // Vibrant, cozy creature palette
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.72, flatShading: true }); // Warm caramel fawn
    const bellyMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.78, flatShading: true }); // Creamy vanilla
    const hornMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.55, flatShading: true }); // Golden chestnut
    const hoofMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.9, flatShading: true });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });

    // Torso
    const torsoGeo = new THREE.BoxGeometry(0.9, 0.8, 1.5);
    const torso = new THREE.Mesh(torsoGeo, bodyMat);
    torso.position.y = 1.1;
    torso.castShadow = true;
    root.add(torso);

    // Cute decorative back spots
    const spotGeo = new THREE.BoxGeometry(0.1, 0.04, 0.1);
    const spotOffsets = [
      [0.2, 0.41, 0.3], [-0.2, 0.41, 0.3],
      [0.25, 0.41, 0.0], [-0.25, 0.41, 0.0],
      [0.2, 0.41, -0.3], [-0.2, 0.41, -0.3]
    ];
    spotOffsets.forEach(([sx, sy, sz]) => {
      const spot = new THREE.Mesh(spotGeo, bellyMat);
      spot.position.set(sx, sy, sz);
      torso.add(spot);
    });

    // Neck & Head
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.3, 0.7);

    const neckGeo = new THREE.BoxGeometry(0.4, 0.8, 0.45);
    neckGeo.rotateX(Math.PI * 0.15);
    const neck = new THREE.Mesh(neckGeo, bodyMat);
    neck.position.set(0, 0.35, 0.15);
    neck.castShadow = true;
    headGroup.add(neck);

    const headGeo = new THREE.BoxGeometry(0.48, 0.42, 0.65);
    const head = new THREE.Mesh(headGeo, bodyMat);
    head.position.set(0, 0.75, 0.35);
    head.castShadow = true;
    headGroup.add(head);

    // Snout
    const snoutGeo = new THREE.BoxGeometry(0.32, 0.28, 0.35);
    const snout = new THREE.Mesh(snoutGeo, bellyMat);
    snout.position.set(0, 0.65, 0.7);
    headGroup.add(snout);

    // Eyes
    const eyeGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(0.25, 0.82, 0.45);
    const eyeR = eyeL.clone();
    eyeR.position.x = -0.25;
    headGroup.add(eyeL, eyeR);

    // Ears
    const earGeo = new THREE.ConeGeometry(0.12, 0.35, 4);
    earGeo.rotateZ(-0.3);
    const earL = new THREE.Mesh(earGeo, bodyMat);
    earL.position.set(0.24, 1.05, 0.2);
    const earR = earL.clone();
    earR.scale.x = -1;
    earR.position.x = -0.24;
    headGroup.add(earL, earR);

    // Antlers
    const antlerGeo = new THREE.CylinderGeometry(0.03, 0.05, 0.7, 4);
    const antlerL = new THREE.Mesh(antlerGeo, hornMat);
    antlerL.position.set(0.16, 1.25, 0.22);
    antlerL.rotation.set(-0.2, 0, 0.35);
    const antlerR = antlerL.clone();
    antlerR.scale.x = -1;
    antlerR.position.x = -0.16;
    headGroup.add(antlerL, antlerR);

    root.add(headGroup);

    // 4 Articulated Legs
    const legGeo = new THREE.BoxGeometry(0.18, 0.9, 0.18);
    legGeo.translate(0, -0.45, 0); // pivot at top

    const createLeg = (x, z) => {
      const legPivot = new THREE.Group();
      legPivot.position.set(x, 1.0, z);

      const legMesh = new THREE.Mesh(legGeo, bodyMat);
      legMesh.castShadow = true;
      legPivot.add(legMesh);

      const hoof = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.15, 0.22), hoofMat);
      hoof.position.set(0, -0.85, 0.02);
      legPivot.add(hoof);

      root.add(legPivot);
      return legPivot;
    };

    const frontLeftLeg = createLeg(0.32, 0.48);
    const frontRightLeg = createLeg(-0.32, 0.48);
    const backLeftLeg = createLeg(0.32, -0.48);
    const backRightLeg = createLeg(-0.32, -0.48);

    // Tail
    const tailGeo = new THREE.BoxGeometry(0.12, 0.25, 0.12);
    tailGeo.rotateX(-0.5);
    const tail = new THREE.Mesh(tailGeo, bellyMat);
    tail.position.set(0, 1.3, -0.8);
    root.add(tail);

    return {
      root,
      headGroup,
      legs: [frontLeftLeg, frontRightLeg, backLeftLeg, backRightLeg]
    };
  }

  // Build procedural low-poly Predator (Wolf)
  static createPredatorModel() {
    const root = new THREE.Group();

    const coatMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.78, flatShading: true }); // Slate timber coat
    const underMat = new THREE.MeshStandardMaterial({ color: 0xd97706, roughness: 0.8, flatShading: true });  // Warm cinnamon chest
    const clawMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9, flatShading: true });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 }); // Bright golden glowing amber

    // Torso & Chest (strong predator shoulder arch)
    const torsoGeo = new THREE.BoxGeometry(0.85, 0.78, 1.45);
    const torso = new THREE.Mesh(torsoGeo, coatMat);
    torso.position.y = 0.95;
    torso.castShadow = true;
    root.add(torso);

    const chestGeo = new THREE.BoxGeometry(0.75, 0.5, 0.8);
    const chest = new THREE.Mesh(chestGeo, underMat);
    chest.position.set(0, 0.85, 0.2);
    root.add(chest);

    // Head
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.15, 0.7);

    const neckGeo = new THREE.BoxGeometry(0.48, 0.55, 0.55);
    neckGeo.rotateX(Math.PI * 0.1);
    const neck = new THREE.Mesh(neckGeo, coatMat);
    neck.position.set(0, 0.15, 0.1);
    neck.castShadow = true;
    headGroup.add(neck);

    const headGeo = new THREE.BoxGeometry(0.5, 0.45, 0.55);
    const head = new THREE.Mesh(headGeo, coatMat);
    head.position.set(0, 0.42, 0.35);
    head.castShadow = true;
    headGroup.add(head);

    // Muzzle & Teeth
    const muzzleGeo = new THREE.BoxGeometry(0.32, 0.26, 0.45);
    const muzzle = new THREE.Mesh(muzzleGeo, underMat);
    muzzle.position.set(0, 0.34, 0.72);
    headGroup.add(muzzle);

    const noseGeo = new THREE.BoxGeometry(0.12, 0.1, 0.1);
    const nose = new THREE.Mesh(noseGeo, clawMat);
    nose.position.set(0, 0.42, 0.92);
    headGroup.add(nose);

    // Eyes
    const eyeGeo = new THREE.BoxGeometry(0.08, 0.08, 0.08);
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(0.24, 0.52, 0.5);
    const eyeR = eyeL.clone();
    eyeR.position.x = -0.24;
    headGroup.add(eyeL, eyeR);

    // Pointed Wolf Ears
    const earGeo = new THREE.ConeGeometry(0.14, 0.32, 4);
    const earL = new THREE.Mesh(earGeo, coatMat);
    earL.position.set(0.2, 0.75, 0.22);
    earL.rotation.set(-0.2, 0, 0.15);
    const earR = earL.clone();
    earR.scale.x = -1;
    earR.position.x = -0.2;
    headGroup.add(earL, earR);

    root.add(headGroup);

    // 4 Sturdy Legs
    const legGeo = new THREE.BoxGeometry(0.2, 0.8, 0.2);
    legGeo.translate(0, -0.4, 0);

    const createLeg = (x, z) => {
      const legPivot = new THREE.Group();
      legPivot.position.set(x, 0.85, z);

      const legMesh = new THREE.Mesh(legGeo, coatMat);
      legMesh.castShadow = true;
      legPivot.add(legMesh);

      const paw = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.25), clawMat);
      paw.position.set(0, -0.75, 0.04);
      legPivot.add(paw);

      root.add(legPivot);
      return legPivot;
    };

    const frontLeftLeg = createLeg(0.3, 0.45);
    const frontRightLeg = createLeg(-0.3, 0.45);
    const backLeftLeg = createLeg(0.3, -0.45);
    const backRightLeg = createLeg(-0.3, -0.45);

    // Bushy Tail
    const tailGeo = new THREE.CylinderGeometry(0.12, 0.08, 0.7, 5);
    tailGeo.rotateX(-0.8);
    const tail = new THREE.Mesh(tailGeo, coatMat);
    tail.position.set(0, 1.0, -0.85);
    root.add(tail);

    return {
      root,
      headGroup,
      tail,
      legs: [frontLeftLeg, frontRightLeg, backLeftLeg, backRightLeg]
    };
  }

  // Build cute procedural low-poly Human Villager (matching screenshot 2)
  static createHumanModel(options = {}) {
    const root = new THREE.Group();

    // Profession-tailored color palettes for distinct visual roles
    const profColors = {
      Farmer: { shirt: 0x65a30d, pants: 0x78350f, hatBand: 0x4d7c0f },     // Earthy green tunic, rustic brown trousers
      Lumberjack: { shirt: 0xb91c1c, pants: 0x374151, hatBand: 0x7f1d1d }, // Lumberjack flannel red, sturdy charcoal
      Stonemason: { shirt: 0x64748b, pants: 0x1e293b, hatBand: 0x334155 }, // Mason slate gray & dark stone
      Builder: { shirt: 0xd97706, pants: 0x451a03, hatBand: 0xb45309 },    // Builder amber/tan tunic & leather
      Guard: { shirt: 0x1d4ed8, pants: 0x0f172a, hatBand: 0xdc2626 },      // Royal blue tunic & iron/crimson
      Hunter: { shirt: 0x15803d, pants: 0x3f3f46, hatBand: 0x166534 },     // Forest green ranger garb
      Blacksmith: { shirt: 0x27272a, pants: 0x18181b, hatBand: 0xea580c }  // Soot-black smith apron & ember band
    };

    const chosenProf = options.profession || 'Builder';
    const chosenPalette = profColors[chosenProf] || profColors.Builder;

    const shirtColor = options.shirtColor || chosenPalette.shirt;
    const pantsColor = options.pantsColor || chosenPalette.pants;
    const hatBandColor = chosenPalette.hatBand;

    const skinMat = new THREE.MeshStandardMaterial({ color: 0xfcd34d, roughness: 0.6, flatShading: true });
    const hairMat = new THREE.MeshStandardMaterial({ color: 0x451a03, roughness: 0.8, flatShading: true });
    const shirtMat = new THREE.MeshStandardMaterial({ color: shirtColor, roughness: 0.7, flatShading: true });
    const pantsMat = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.85, flatShading: true });
    const bootMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.9, flatShading: true });
    const strawHatMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.7, flatShading: true }); // Cozy yellow straw hat
    const hatBandMat = new THREE.MeshStandardMaterial({ color: hatBandColor, roughness: 0.7, flatShading: true });

    // Torso (Tunic/Shirt)
    const torsoGeo = new THREE.BoxGeometry(0.55, 0.65, 0.35);
    const torso = new THREE.Mesh(torsoGeo, shirtMat);
    torso.position.y = 1.15;
    torso.castShadow = true;
    root.add(torso);

    // Head
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.65, 0);

    const headGeo = new THREE.BoxGeometry(0.42, 0.42, 0.42);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.castShadow = true;
    headGroup.add(head);

    // Hair
    const hairGeo = new THREE.BoxGeometry(0.46, 0.22, 0.46);
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.y = 0.16;
    headGroup.add(hair);

    // Headgear Groups
    const strawHatGroup = new THREE.Group();
    const hatBrimGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.05, 12);
    const hatBrim = new THREE.Mesh(hatBrimGeo, strawHatMat);
    hatBrim.position.y = 0.28;
    hatBrim.castShadow = true;
    strawHatGroup.add(hatBrim);

    const hatCrownGeo = new THREE.CylinderGeometry(0.3, 0.32, 0.25, 12);
    const hatCrown = new THREE.Mesh(hatCrownGeo, strawHatMat);
    hatCrown.position.y = 0.42;
    hatCrown.castShadow = true;
    strawHatGroup.add(hatCrown);

    const hatBand = new THREE.Mesh(new THREE.CylinderGeometry(0.325, 0.325, 0.06, 12), hatBandMat);
    hatBand.position.y = 0.34;
    strawHatGroup.add(hatBand);
    headGroup.add(strawHatGroup);

    // Iron Knight / Guard Helmet
    const steelMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.75, roughness: 0.35, flatShading: true });
    const goldMat = new THREE.MeshStandardMaterial({ color: 0xd97706, metalness: 0.8, roughness: 0.3, flatShading: true });
    const crestMat = new THREE.MeshStandardMaterial({ color: 0xdc2626, roughness: 0.6, flatShading: true }); // Red feather crest

    const ironHelmetGroup = new THREE.Group();
    const helmetDome = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.26, 0.32, 8), steelMat);
    helmetDome.position.y = 0.35;
    helmetDome.castShadow = true;
    ironHelmetGroup.add(helmetDome);

    const visor = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.1, 0.28), steelMat);
    visor.position.set(0, 0.28, 0.12);
    ironHelmetGroup.add(visor);

    const crest = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.36), crestMat);
    crest.position.set(0, 0.52, 0);
    ironHelmetGroup.add(crest);
    ironHelmetGroup.visible = false;
    headGroup.add(ironHelmetGroup);

    // Eyes
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });
    const eyeGeo = new THREE.BoxGeometry(0.06, 0.06, 0.06);
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(0.12, 0.02, 0.22);
    const eyeR = eyeL.clone();
    eyeR.position.x = -0.12;
    headGroup.add(eyeL, eyeR);

    root.add(headGroup);

    // Iron Armor Overlay (Breastplate & Pauldrons)
    const ironArmorGroup = new THREE.Group();
    const chestplate = new THREE.Mesh(new THREE.BoxGeometry(0.58, 0.62, 0.38), steelMat);
    chestplate.position.y = 1.15;
    chestplate.castShadow = true;
    ironArmorGroup.add(chestplate);

    const pauldronGeo = new THREE.BoxGeometry(0.22, 0.16, 0.24);
    const pL = new THREE.Mesh(pauldronGeo, steelMat);
    pL.position.set(0.36, 1.45, 0);
    const pR = new THREE.Mesh(pauldronGeo, steelMat);
    pR.position.set(-0.36, 1.45, 0);
    ironArmorGroup.add(pL, pR);
    ironArmorGroup.visible = false;
    root.add(ironArmorGroup);

    // 2 Articulated Legs
    const legGeo = new THREE.BoxGeometry(0.2, 0.75, 0.2);
    legGeo.translate(0, -0.375, 0);

    const createHumanLeg = (x) => {
      const pivot = new THREE.Group();
      pivot.position.set(x, 0.85, 0);

      const leg = new THREE.Mesh(legGeo, pantsMat);
      leg.castShadow = true;
      pivot.add(leg);

      const boot = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.18, 0.28), bootMat);
      boot.position.set(0, -0.7, 0.04);
      boot.castShadow = true;
      pivot.add(boot);

      root.add(pivot);
      return pivot;
    };

    const leftLeg = createHumanLeg(0.16);
    const rightLeg = createHumanLeg(-0.16);

    // 2 Articulated Arms
    const armGeo = new THREE.BoxGeometry(0.15, 0.6, 0.15);
    armGeo.translate(0, -0.3, 0);

    const createHumanArm = (x) => {
      const pivot = new THREE.Group();
      pivot.position.set(x, 1.4, 0);

      const arm = new THREE.Mesh(armGeo, shirtMat);
      arm.castShadow = true;
      pivot.add(arm);

      const hand = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.14, 0.14), skinMat);
      hand.position.set(0, -0.58, 0);
      pivot.add(hand);

      root.add(pivot);
      return pivot;
    };

    const leftArm = createHumanArm(0.35);
    const rightArm = createHumanArm(-0.35);

    // =========================================================================
    // WEAPONS & TOOLS (Right Hand - Visually Distinct Silhouettes & Colors)
    // =========================================================================
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x78350f, roughness: 0.9 });
    const stoneToolMat = new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.5, roughness: 0.6 });

    // 1. Woodcutter Axe (Sharp bearded wedge blade)
    const axe = new THREE.Group();
    const axeHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.82, 6), handleMat);
    const axeBlade = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.2, 0.05), steelMat);
    axeBlade.position.set(0.12, 0.3, 0);
    const axeEdge = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.2, 4), steelMat);
    axeEdge.rotation.z = -Math.PI * 0.5;
    axeEdge.position.set(0.22, 0.3, 0);
    axe.add(axeHandle, axeBlade, axeEdge);
    axe.position.set(0, -0.6, 0.2);
    axe.rotation.x = Math.PI * 0.4;
    axe.visible = false; // Initialized to FALSE so it never overlaps!
    rightArm.add(axe);

    // 2. Miner Pickaxe (Double-sided curved arched sharp steel pick)
    const pickaxe = new THREE.Group();
    const pickHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.88, 6), handleMat);
    const pickHead = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.08, 0.07), steelMat);
    pickHead.position.set(0, 0.35, 0);
    pickHead.rotation.z = 0.12;
    const pickTipL = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 4), steelMat);
    pickTipL.rotation.z = Math.PI * 0.5;
    pickTipL.position.set(0.3, 0.38, 0);
    const pickTipR = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.14, 4), steelMat);
    pickTipR.rotation.z = -Math.PI * 0.5;
    pickTipR.position.set(-0.3, 0.32, 0);
    pickaxe.add(pickHandle, pickHead, pickTipL, pickTipR);
    pickaxe.position.set(0, -0.6, 0.2);
    pickaxe.rotation.x = Math.PI * 0.4;
    pickaxe.visible = false;
    rightArm.add(pickaxe);

    // 3. Builder Mallet / Hammer (Heavy carpenter hammer with steel striking face)
    const hammer = new THREE.Group();
    const hammerHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.04, 0.68, 6), handleMat);
    const hammerHead = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.26, 8), stoneToolMat);
    hammerHead.rotation.z = Math.PI * 0.5;
    hammerHead.position.set(0, 0.28, 0);
    const claw = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.12, 0.06), stoneToolMat);
    claw.position.set(-0.12, 0.25, 0);
    hammer.add(hammerHandle, hammerHead, claw);
    hammer.position.set(0, -0.6, 0.2);
    hammer.rotation.x = Math.PI * 0.4;
    hammer.visible = false;
    rightArm.add(hammer);

    // 4. Farmer Hoe (Long ash wood staff with angled flat weeding blade)
    const hoe = new THREE.Group();
    const hoeHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.032, 1.15, 6), handleMat);
    const hoeNeck = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.15, 0.04), steelMat);
    hoeNeck.position.set(0, 0.54, 0.06);
    hoeNeck.rotation.x = 0.55;
    const hoeBlade = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.03, 0.14), steelMat);
    hoeBlade.position.set(0, 0.56, 0.14);
    hoe.add(hoeHandle, hoeNeck, hoeBlade);
    hoe.position.set(0, -0.6, 0.2);
    hoe.rotation.x = Math.PI * 0.38;
    hoe.visible = false;
    rightArm.add(hoe);

    // 5. Knight / Guard Sword (Polished steel broadsword with golden hilt)
    const sword = new THREE.Group();
    const swordBlade = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.88, 0.03), steelMat);
    swordBlade.position.y = 0.44;
    const swordGuard = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.05, 0.06), goldMat);
    swordGuard.position.y = 0.05;
    const swordHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.2, 6), handleMat);
    swordHandle.position.y = -0.06;
    const pommel = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 6), goldMat);
    pommel.position.y = -0.16;
    sword.add(swordBlade, swordGuard, swordHandle, pommel);
    sword.position.set(0, -0.6, 0.2);
    sword.rotation.x = Math.PI * 0.45;
    sword.visible = false;
    rightArm.add(sword);

    // 6. Hunter Spear
    const spear = new THREE.Group();
    const spearShaft = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.45, 6), handleMat);
    const spearTip = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.35, 5), steelMat);
    spearTip.position.y = 0.8;
    spear.add(spearShaft, spearTip);
    spear.position.set(0, -0.6, 0.2);
    spear.rotation.x = Math.PI * 0.4;
    spear.visible = false;
    rightArm.add(spear);

    // 7. Hunter Bow
    const bow = new THREE.Group();
    const bowStave = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.03, 5, 12, Math.PI * 0.9), handleMat);
    bowStave.rotation.y = Math.PI * 0.5;
    bow.add(bowStave);
    bow.position.set(0, -0.6, 0.2);
    bow.visible = false;
    rightArm.add(bow);

    // =========================================================================
    // SHIELD & CARRIED RESOURCES (Left Hand)
    // =========================================================================
    // 1. Guard Shield
    const shieldMat = new THREE.MeshStandardMaterial({ color: 0x1d4ed8, roughness: 0.6, flatShading: true }); // Royal blue
    const shield = new THREE.Group();
    const shieldBody = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.06, 12), shieldMat);
    shieldBody.rotation.x = Math.PI * 0.5;
    const shieldBoss = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.1, 8), steelMat);
    shieldBoss.position.z = 0.05;
    shieldBoss.rotation.x = Math.PI * 0.5;
    const shieldRim = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.025, 6, 16), steelMat);
    shield.add(shieldBody, shieldBoss, shieldRim);
    shield.position.set(0.15, -0.5, 0.25);
    shield.visible = false;
    leftArm.add(shield);

    // 2. Carried Wood Log
    const carriedLog = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.85, 6), handleMat);
    carriedLog.rotation.z = Math.PI * 0.5;
    carriedLog.position.set(0, -0.4, 0.25);
    carriedLog.visible = false;
    leftArm.add(carriedLog);

    // 3. Carried Stone Block
    const carriedStone = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.26, 0.32), stoneToolMat);
    carriedStone.position.set(0, -0.4, 0.25);
    carriedStone.visible = false;
    leftArm.add(carriedStone);

    // 4. Carried Hunt Meat
    const meatMat = new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.7, flatShading: true });
    const carriedMeat = new THREE.Group();
    const meatHunk = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.3, 0.2), meatMat);
    const bone = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.45, 5), new THREE.MeshBasicMaterial({ color: 0xf8fafc }));
    bone.rotation.z = 0.3;
    carriedMeat.add(meatHunk, bone);
    carriedMeat.position.set(0, -0.4, 0.25);
    carriedMeat.visible = false;
    leftArm.add(carriedMeat);

    // 5. Carried Golden Wheat Bundle (Harvested from Farm)
    const wheatMat = new THREE.MeshStandardMaterial({ color: 0xfacc15, roughness: 0.6, flatShading: true });
    const tieMat = new THREE.MeshStandardMaterial({ color: 0xdc2626 });
    const carriedWheat = new THREE.Group();
    const wheatBundle = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.14, 0.75, 7), wheatMat);
    wheatBundle.rotation.z = Math.PI * 0.45;
    const tieRing = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.03, 5, 8), tieMat);
    tieRing.rotation.y = Math.PI * 0.5;
    carriedWheat.add(wheatBundle, tieRing);
    carriedWheat.position.set(0, -0.4, 0.25);
    carriedWheat.visible = false;
    leftArm.add(carriedWheat);

    return {
      root,
      headGroup,
      torso,
      legs: [leftLeg, rightLeg],
      arms: [leftArm, rightArm],
      gear: {
        strawHat: strawHatGroup,
        ironHelmet: ironHelmetGroup,
        ironArmor: ironArmorGroup,
        weapons: {
          axe,
          pickaxe,
          hammer,
          hoe,
          sword,
          spear,
          bow
        },
        heldItems: {
          shield,
          log: carriedLog,
          stone: carriedStone,
          meat: carriedMeat,
          wheat: carriedWheat
        }
      }
    };
  }

  // 1. Cozy Fluffy Sheep (Matches cozy farm in screenshot 3)
  static createSheepModel() {
    const root = new THREE.Group();
    const woolMat = new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.9, flatShading: true }); // Fluffy white wool
    const faceMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, roughness: 0.8, flatShading: true }); // Dark face
    const hoofMat = new THREE.MeshStandardMaterial({ color: 0x111827, roughness: 0.9 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xf1f5f9 });

    // Woolly Body (rounded box)
    const torsoGeo = new THREE.BoxGeometry(0.9, 0.85, 1.2);
    const torso = new THREE.Mesh(torsoGeo, woolMat);
    torso.position.y = 0.95;
    torso.castShadow = true;
    root.add(torso);

    // Head
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.1, 0.7);

    const headGeo = new THREE.BoxGeometry(0.38, 0.38, 0.45);
    const head = new THREE.Mesh(headGeo, faceMat);
    head.castShadow = true;
    headGroup.add(head);

    // Wool cap on head
    const woolCap = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 0.38), woolMat);
    woolCap.position.set(0, 0.22, -0.05);
    headGroup.add(woolCap);

    // Floppy ears
    const earGeo = new THREE.BoxGeometry(0.24, 0.1, 0.1);
    const earL = new THREE.Mesh(earGeo, faceMat);
    earL.position.set(0.28, 0.08, 0.05);
    earL.rotation.z = -0.3;
    const earR = earL.clone();
    earR.position.x = -0.28;
    earR.rotation.z = 0.3;
    headGroup.add(earL, earR);

    // Eyes
    const eyeGeo = new THREE.BoxGeometry(0.06, 0.06, 0.06);
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(0.18, 0.08, 0.18);
    const eyeR = eyeL.clone();
    eyeR.position.x = -0.18;
    headGroup.add(eyeL, eyeR);

    root.add(headGroup);

    // 4 Little Legs
    const legGeo = new THREE.BoxGeometry(0.16, 0.65, 0.16);
    legGeo.translate(0, -0.325, 0);

    const createLeg = (x, z) => {
      const p = new THREE.Group();
      p.position.set(x, 0.7, z);
      const leg = new THREE.Mesh(legGeo, faceMat);
      leg.castShadow = true;
      p.add(leg);
      const hoof = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.12, 0.2), hoofMat);
      hoof.position.set(0, -0.6, 0.02);
      p.add(hoof);
      root.add(p);
      return p;
    };

    const fl = createLeg(0.28, 0.38);
    const fr = createLeg(-0.28, 0.38);
    const bl = createLeg(0.28, -0.38);
    const br = createLeg(-0.28, -0.38);

    // Tail
    const tail = new THREE.Mesh(new THREE.DodecahedronGeometry(0.14, 0), woolMat);
    tail.position.set(0, 1.1, -0.65);
    root.add(tail);

    return { root, headGroup, tail, legs: [fl, fr, bl, br] };
  }

  // 2. Cute Hopping Bunny / Rabbit
  static createRabbitModel() {
    const root = new THREE.Group();
    const furMat = new THREE.MeshStandardMaterial({ color: 0xf1f5f9, roughness: 0.8, flatShading: true }); // White bunny
    const innerEarMat = new THREE.MeshStandardMaterial({ color: 0xf472b6, roughness: 0.7, flatShading: true }); // Pink ear
    const noseMat = new THREE.MeshBasicMaterial({ color: 0xfb7185 });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0x0f172a });

    // Round body
    const bodyGeo = new THREE.BoxGeometry(0.45, 0.42, 0.6);
    const body = new THREE.Mesh(bodyGeo, furMat);
    body.position.y = 0.35;
    body.castShadow = true;
    root.add(body);

    // Head
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.52, 0.28);

    const headGeo = new THREE.BoxGeometry(0.32, 0.3, 0.32);
    const head = new THREE.Mesh(headGeo, furMat);
    head.castShadow = true;
    headGroup.add(head);

    // Tall Ears
    const earGeo = new THREE.BoxGeometry(0.08, 0.38, 0.06);
    const earInnerGeo = new THREE.BoxGeometry(0.05, 0.32, 0.02);

    const makeEar = (x, rotZ) => {
      const ear = new THREE.Group();
      ear.position.set(x, 0.32, -0.04);
      ear.rotation.set(-0.2, 0, rotZ);
      const earOuter = new THREE.Mesh(earGeo, furMat);
      const earInner = new THREE.Mesh(earInnerGeo, innerEarMat);
      earInner.position.z = 0.025;
      ear.add(earOuter, earInner);
      return ear;
    };

    const earL = makeEar(0.09, 0.1);
    const earR = makeEar(-0.09, -0.1);
    headGroup.add(earL, earR);

    // Tiny pink nose & eyes
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.04, 0.05), noseMat);
    nose.position.set(0, 0.04, 0.17);
    headGroup.add(nose);

    const eyeGeo = new THREE.BoxGeometry(0.05, 0.05, 0.05);
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(0.14, 0.08, 0.08);
    const eyeR = eyeL.clone();
    eyeR.position.x = -0.14;
    headGroup.add(eyeL, eyeR);

    root.add(headGroup);

    // 4 Tiny paws
    const legGeo = new THREE.BoxGeometry(0.12, 0.25, 0.12);
    legGeo.translate(0, -0.125, 0);

    const createPaw = (x, z) => {
      const p = new THREE.Group();
      p.position.set(x, 0.25, z);
      const m = new THREE.Mesh(legGeo, furMat);
      m.castShadow = true;
      p.add(m);
      root.add(p);
      return p;
    };

    const fl = createPaw(0.14, 0.18);
    const fr = createPaw(-0.14, 0.18);
    const bl = createPaw(0.16, -0.18);
    const br = createPaw(-0.16, -0.18);

    // Fluffy cotton tail
    const tail = new THREE.Mesh(new THREE.DodecahedronGeometry(0.1, 0), furMat);
    tail.position.set(0, 0.42, -0.34);
    root.add(tail);

    return { root, headGroup, tail, legs: [fl, fr, bl, br] };
  }

  // 3. Agile Red Fox
  static createFoxModel() {
    const root = new THREE.Group();
    const rustMat = new THREE.MeshStandardMaterial({ color: 0xea580c, roughness: 0.75, flatShading: true }); // Vibrant orange-rust
    const whiteMat = new THREE.MeshStandardMaterial({ color: 0xfef3c7, roughness: 0.8, flatShading: true });
    const blackMat = new THREE.MeshStandardMaterial({ color: 0x18181b, roughness: 0.9, flatShading: true });
    const eyeMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });

    // Torso
    const torsoGeo = new THREE.BoxGeometry(0.65, 0.58, 1.1);
    const torso = new THREE.Mesh(torsoGeo, rustMat);
    torso.position.y = 0.75;
    torso.castShadow = true;
    root.add(torso);

    const chestGeo = new THREE.BoxGeometry(0.55, 0.35, 0.5);
    const chest = new THREE.Mesh(chestGeo, whiteMat);
    chest.position.set(0, 0.65, 0.25);
    root.add(chest);

    // Head
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 0.95, 0.55);

    const headGeo = new THREE.BoxGeometry(0.4, 0.35, 0.42);
    const head = new THREE.Mesh(headGeo, rustMat);
    head.castShadow = true;
    headGroup.add(head);

    // Snout
    const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.18, 0.32), whiteMat);
    muzzle.position.set(0, -0.06, 0.3);
    headGroup.add(muzzle);

    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.08), blackMat);
    nose.position.set(0, 0.02, 0.45);
    headGroup.add(nose);

    // Pointed ears with black backs
    const earGeo = new THREE.ConeGeometry(0.12, 0.28, 4);
    const earL = new THREE.Mesh(earGeo, blackMat);
    earL.position.set(0.16, 0.32, 0.05);
    earL.rotation.set(-0.2, 0, 0.2);
    const earR = earL.clone();
    earR.position.x = -0.16;
    earR.rotation.z = -0.2;
    headGroup.add(earL, earR);

    // Eyes
    const eyeGeo = new THREE.BoxGeometry(0.06, 0.06, 0.06);
    const eyeL = new THREE.Mesh(eyeGeo, eyeMat);
    eyeL.position.set(0.16, 0.08, 0.15);
    const eyeR = eyeL.clone();
    eyeR.position.x = -0.16;
    headGroup.add(eyeL, eyeR);

    root.add(headGroup);

    // 4 Slender Legs with black socks
    const legGeo = new THREE.BoxGeometry(0.14, 0.6, 0.14);
    legGeo.translate(0, -0.3, 0);

    const createLeg = (x, z) => {
      const p = new THREE.Group();
      p.position.set(x, 0.65, z);
      const leg = new THREE.Mesh(legGeo, rustMat);
      leg.castShadow = true;
      p.add(leg);
      const paw = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.2, 0.18), blackMat);
      paw.position.set(0, -0.5, 0.02);
      p.add(paw);
      root.add(p);
      return p;
    };

    const fl = createLeg(0.22, 0.35);
    const fr = createLeg(-0.22, 0.35);
    const bl = createLeg(0.22, -0.35);
    const br = createLeg(-0.22, -0.35);

    // Big Bushy Fox Tail with white tip
    const tailGroup = new THREE.Group();
    tailGroup.position.set(0, 0.8, -0.6);

    const tailMain = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.08, 0.8, 6), rustMat);
    tailMain.rotation.x = -0.7;
    tailMain.position.set(0, 0.15, -0.3);
    tailGroup.add(tailMain);

    const tailTip = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.3, 6), whiteMat);
    tailTip.rotation.x = -0.7;
    tailTip.position.set(0, 0.45, -0.65);
    tailGroup.add(tailTip);

    root.add(tailGroup);

    return { root, headGroup, tail: tailGroup, legs: [fl, fr, bl, br] };
  }

  // 4. Cozy Brown Bear
  static createBearModel() {
    const root = new THREE.Group();
    const furMat = new THREE.MeshStandardMaterial({ color: 0x5c2e0b, roughness: 0.85, flatShading: true }); // Warm brown
    const muzzleMat = new THREE.MeshStandardMaterial({ color: 0x92400e, roughness: 0.8, flatShading: true });
    const blackMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.9 });

    // Bulky torso
    const torsoGeo = new THREE.BoxGeometry(1.4, 1.25, 2.0);
    const torso = new THREE.Mesh(torsoGeo, furMat);
    torso.position.y = 1.45;
    torso.castShadow = true;
    root.add(torso);

    // Strong shoulder hump
    const hump = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 0.9), furMat);
    hump.position.set(0, 2.1, 0.4);
    hump.castShadow = true;
    root.add(hump);

    // Head
    const headGroup = new THREE.Group();
    headGroup.position.set(0, 1.7, 1.1);

    const headGeo = new THREE.BoxGeometry(0.75, 0.65, 0.7);
    const head = new THREE.Mesh(headGeo, furMat);
    head.castShadow = true;
    headGroup.add(head);

    // Snout
    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.38, 0.5), muzzleMat);
    snout.position.set(0, -0.1, 0.45);
    headGroup.add(snout);

    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.12), blackMat);
    nose.position.set(0, 0.05, 0.7);
    headGroup.add(nose);

    // Round ears
    const earGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.1, 8);
    earGeo.rotateX(Math.PI * 0.5);
    const earL = new THREE.Mesh(earGeo, furMat);
    earL.position.set(0.35, 0.45, -0.05);
    const earR = earL.clone();
    earR.position.x = -0.35;
    headGroup.add(earL, earR);

    root.add(headGroup);

    // 4 Sturdy thick legs
    const legGeo = new THREE.BoxGeometry(0.38, 1.1, 0.38);
    legGeo.translate(0, -0.55, 0);

    const createBearLeg = (x, z) => {
      const p = new THREE.Group();
      p.position.set(x, 1.2, z);
      const m = new THREE.Mesh(legGeo, furMat);
      m.castShadow = true;
      p.add(m);
      root.add(p);
      return p;
    };

    const fl = createBearLeg(0.5, 0.65);
    const fr = createBearLeg(-0.5, 0.65);
    const bl = createBearLeg(0.5, -0.65);
    const br = createBearLeg(-0.5, -0.65);

    // Short tail
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.2, 0.2), furMat);
    tail.position.set(0, 1.5, -1.05);
    root.add(tail);

    return { root, headGroup, tail, legs: [fl, fr, bl, br] };
  }
}
