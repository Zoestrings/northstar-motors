/* ==========================================================================
   NORTHSTAR MOTORS — HIGH-END 3D PERFORMANCE SPORTS CAR MODEL
   Photorealistic procedural sports car with aerodynamic curves, glass canopy,
   detailed interior, Brembo calipers, forged rims & dynamic LED lighting
   ========================================================================== */

import * as THREE from 'three';

export class CarModel {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // Default Configuration: Phantom Jet Black
    this.currentPaintColor = 0x0a0b0e;
    this.currentFinish = 'metallic';
    this.currentRimStyle = 'black';
    this.doorsOpen = false;
    this.spoilerRaised = false;
    this.lightsOn = true;
    this.isXray = false;
    this.isHovered = false;

    // References for animations & materials
    this.doorLeftPivot = null;
    this.doorRightPivot = null;
    this.spoilerPivot = null;
    this.wheelGroups = [];
    this.bodyMeshes = [];
    this.rimMeshes = [];
    this.headlightMeshes = [];
    this.drlMeshes = [];
    this.taillightMeshes = [];
    this.exhaustMeshes = [];
    this.suspensionMesh = null;

    this.initMaterials();
    this.buildCar();

    // Position car on the right side of the hero section (~45-55% visual space)
    this.group.position.set(1.4, 0, 0);
    this.group.rotation.y = -Math.PI / 8; // Subtle 3/4 aggressive stance

    this.scene.add(this.group);
  }

  initMaterials() {
    // 1. High-End Automotive Clearcoat Body Paint (Phantom Jet Black)
    this.paintMaterial = new THREE.MeshPhysicalMaterial({
      color: this.currentPaintColor,
      metalness: 0.92,
      roughness: 0.08,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      reflectivity: 1.0,
      envMapIntensity: 1.8
    });

    // 2. Optical Glass Canopy & Windows
    this.glassMaterial = new THREE.MeshPhysicalMaterial({
      color: 0x0f172a,
      metalness: 0.1,
      roughness: 0.02,
      transmission: 0.88,
      opacity: 0.95,
      transparent: true,
      ior: 1.54,
      reflectivity: 0.9
    });

    // 3. Matte Carbon Fiber Aero Package
    this.carbonMaterial = new THREE.MeshStandardMaterial({
      color: 0x121418,
      metalness: 0.35,
      roughness: 0.4
    });

    // 4. Polished Chrome / Titanium Exhausts & Accents
    this.chromeMaterial = new THREE.MeshStandardMaterial({
      color: 0xf1f5f9,
      metalness: 0.98,
      roughness: 0.05
    });

    // 5. Performance Rubber Tires with Tread
    this.tireMaterial = new THREE.MeshStandardMaterial({
      color: 0x14161b,
      metalness: 0.05,
      roughness: 0.82
    });

    // 6. Forged Alloy Rims
    this.rimMaterial = new THREE.MeshStandardMaterial({
      color: 0x0d0e12,
      metalness: 0.95,
      roughness: 0.12
    });

    // 7. Drilled Carbon-Ceramic Brake Rotors
    this.rotorMaterial = new THREE.MeshStandardMaterial({
      color: 0xa1a1aa,
      metalness: 0.85,
      roughness: 0.25
    });

    // 8. Performance Brake Calipers (Acid Gold / Brembo Style)
    this.caliperMaterial = new THREE.MeshStandardMaterial({
      color: 0xeab308,
      metalness: 0.8,
      roughness: 0.15
    });

    // 9. Interior Leather (Obsidian Black with subtle sheen)
    this.interiorMaterial = new THREE.MeshStandardMaterial({
      color: 0x181a20,
      metalness: 0.2,
      roughness: 0.7
    });

    // 10. Matrix LED Headlight Projector Lenses
    this.headlightMaterial = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xdbeafe,
      emissiveIntensity: 0.8,
      roughness: 0.1,
      metalness: 0.9
    });

    // 11. Crystal DRL (Daytime Running Light) Neon Strips
    this.drlMaterial = new THREE.MeshBasicMaterial({
      color: 0x00f0ff
    });

    // 12. Signature Neon LED Taillight Bar
    this.tailMaterial = new THREE.MeshBasicMaterial({
      color: 0xff1e42
    });

    // 13. X-Ray Technical Spec Wireframe Material
    this.xrayMaterial = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      wireframe: true,
      transparent: true,
      opacity: 0.4
    });
  }

  buildCar() {
    this.carRoot = new THREE.Group();
    this.carRoot.position.y = 0.46; // Suspension height from ground

    // --- 1. Soft Ambient Occlusion Ground Contact Shadow Plane ---
    this.buildGroundContactShadow();

    // --- 2. Lower Chassis & Aerodynamic Underfloor Diffuser ---
    this.buildChassis();

    // --- 3. Sculpted Muscular Bodywork & Hood ---
    this.buildMainBody();

    // --- 4. Sloped Glass Canopy & Detailed Cockpit Interior ---
    this.buildCockpit();

    // --- 5. Front Fascia: Splitter, Matrix LED Headlights & DRL Strips ---
    this.buildFrontFascia();

    // --- 6. Rear Fascia: Diffuser, Quad Titanium Exhausts & Taillight Bar ---
    this.buildRearFascia();

    // --- 7. Scissor / Butterfly Doors ---
    this.buildDoors();

    // --- 8. Active Aerodynamic Rear Wing ---
    this.buildActiveWing();

    // --- 9. High-Detail Wheels, Brake Discs & Calipers ---
    this.buildWheels();

    this.group.add(this.carRoot);
  }

  // 1. Soft Radial Ambient Occlusion Ground Shadow
  buildGroundContactShadow() {
    // Generate soft radial gradient shadow texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(256, 256, 40, 256, 256, 250);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.92)');
    grad.addColorStop(0.5, 'rgba(0, 0, 0, 0.55)');
    grad.addColorStop(0.8, 'rgba(0, 0, 0, 0.18)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    const shadowTex = new THREE.CanvasTexture(canvas);
    const shadowGeo = new THREE.PlaneGeometry(3.2, 5.8);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      opacity: 0.88,
      depthWrite: false
    });

    const shadowMesh = new THREE.Mesh(shadowGeo, shadowMat);
    shadowMesh.rotation.x = -Math.PI / 2;
    shadowMesh.position.set(0, -0.44, 0);
    this.carRoot.add(shadowMesh);
  }

  // 2. Chassis & Flat Underfloor
  buildChassis() {
    const chassisGeo = new THREE.BoxGeometry(2.1, 0.18, 4.6);
    const chassisMesh = new THREE.Mesh(chassisGeo, this.carbonMaterial);
    chassisMesh.position.set(0, 0.09, 0);
    chassisMesh.castShadow = true;
    chassisMesh.receiveShadow = true;
    this.carRoot.add(chassisMesh);
  }

  // 3. Sculpted Aerodynamic Bodywork
  buildMainBody() {
    // Aerodynamic Sculpted Lower Fuselage
    const shape = new THREE.Shape();
    shape.moveTo(-1.08, -2.35);
    shape.lineTo(1.08, -2.35);
    shape.lineTo(1.02, -1.2);
    shape.lineTo(0.96, 0.8);
    shape.lineTo(0.88, 2.3);
    shape.lineTo(-0.88, 2.3);
    shape.lineTo(-0.96, 0.8);
    shape.lineTo(-1.02, -1.2);
    shape.closePath();

    const extrudeSettings = {
      depth: 0.55,
      bevelEnabled: true,
      bevelSegments: 6,
      steps: 3,
      bevelSize: 0.15,
      bevelThickness: 0.14
    };

    const bodyGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    bodyGeo.rotateX(-Math.PI / 2);

    const bodyMesh = new THREE.Mesh(bodyGeo, this.paintMaterial);
    bodyMesh.position.set(0, 0.28, 0);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    this.bodyMeshes.push(bodyMesh);
    this.carRoot.add(bodyMesh);

    // Front Sculpted Hood with Air Extractor Vents
    const hoodGeo = new THREE.BoxGeometry(1.5, 0.18, 1.4);
    const hoodMesh = new THREE.Mesh(hoodGeo, this.paintMaterial);
    hoodMesh.position.set(0, 0.58, 1.35);
    hoodMesh.rotation.x = 0.12;
    hoodMesh.castShadow = true;
    this.bodyMeshes.push(hoodMesh);
    this.carRoot.add(hoodMesh);

    // Hood Center Carbon Crease
    const creaseGeo = new THREE.BoxGeometry(0.35, 0.04, 1.2);
    const creaseMesh = new THREE.Mesh(creaseGeo, this.carbonMaterial);
    creaseMesh.position.set(0, 0.68, 1.35);
    creaseMesh.rotation.x = 0.12;
    this.carRoot.add(creaseMesh);

    // Flared Rear Muscular Haunches (Left & Right)
    const haunchGeo = new THREE.BoxGeometry(0.42, 0.46, 1.5);
    const leftHaunch = new THREE.Mesh(haunchGeo, this.paintMaterial);
    leftHaunch.position.set(-0.95, 0.52, -1.1);
    leftHaunch.rotation.z = -0.08;
    leftHaunch.castShadow = true;
    this.bodyMeshes.push(leftHaunch);
    this.carRoot.add(leftHaunch);

    const rightHaunch = new THREE.Mesh(haunchGeo, this.paintMaterial);
    rightHaunch.position.set(0.95, 0.52, -1.1);
    rightHaunch.rotation.z = 0.08;
    rightHaunch.castShadow = true;
    this.bodyMeshes.push(rightHaunch);
    this.carRoot.add(rightHaunch);

    // Aerodynamic Side Air Scoops / Intakes
    const scoopGeo = new THREE.BoxGeometry(0.12, 0.35, 0.8);
    const leftScoop = new THREE.Mesh(scoopGeo, this.carbonMaterial);
    leftScoop.position.set(-1.08, 0.42, -0.2);
    this.carRoot.add(leftScoop);

    const rightScoop = new THREE.Mesh(scoopGeo, this.carbonMaterial);
    rightScoop.position.set(1.08, 0.42, -0.2);
    this.carRoot.add(rightScoop);
  }

  // 4. Cockpit, Glass Canopy & Interior
  buildCockpit() {
    // Glass Canopy Greenhouse
    const canopyGeo = new THREE.BoxGeometry(1.32, 0.48, 1.85);
    const canopyMesh = new THREE.Mesh(canopyGeo, this.glassMaterial);
    canopyMesh.position.set(0, 0.8, -0.15);
    canopyMesh.castShadow = true;
    this.carRoot.add(canopyMesh);

    // Cockpit Interior Tub & Dual Bucket Sport Seats
    const interiorTub = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.3, 1.5),
      this.interiorMaterial
    );
    interiorTub.position.set(0, 0.42, -0.15);
    this.carRoot.add(interiorTub);

    // Left & Right Sport Bucket Seats
    const seatGeo = new THREE.BoxGeometry(0.42, 0.45, 0.42);
    const seatLeft = new THREE.Mesh(seatGeo, this.interiorMaterial);
    seatLeft.position.set(-0.32, 0.65, -0.3);
    this.carRoot.add(seatLeft);

    const seatRight = new THREE.Mesh(seatGeo, this.interiorMaterial);
    seatRight.position.set(0.32, 0.65, -0.3);
    this.carRoot.add(seatRight);

    // Headrests
    const headrestGeo = new THREE.BoxGeometry(0.24, 0.16, 0.12);
    const headrestL = new THREE.Mesh(headrestGeo, this.interiorMaterial);
    headrestL.position.set(-0.32, 0.95, -0.38);
    this.carRoot.add(headrestL);

    const headrestR = new THREE.Mesh(headrestGeo, this.interiorMaterial);
    headrestR.position.set(0.32, 0.95, -0.38);
    this.carRoot.add(headrestR);

    // Sport Steering Wheel
    const wheelTorus = new THREE.Mesh(
      new THREE.TorusGeometry(0.12, 0.025, 8, 20),
      this.interiorMaterial
    );
    wheelTorus.position.set(-0.32, 0.72, 0.35);
    wheelTorus.rotation.x = -Math.PI / 4;
    this.carRoot.add(wheelTorus);
  }

  // 5. Front Fascia: Splitter, Headlights & Neon DRL Strips
  buildFrontFascia() {
    // Carbon Front Splitter with Winglets
    const splitterGeo = new THREE.BoxGeometry(1.98, 0.08, 0.55);
    const splitterMesh = new THREE.Mesh(splitterGeo, this.carbonMaterial);
    splitterMesh.position.set(0, 0.12, 2.38);
    this.carRoot.add(splitterMesh);

    // Front Radiator Grille Mesh
    const grilleGeo = new THREE.BoxGeometry(1.4, 0.24, 0.1);
    const grilleMesh = new THREE.Mesh(grilleGeo, this.carbonMaterial);
    grilleMesh.position.set(0, 0.28, 2.36);
    this.carRoot.add(grilleMesh);

    // Matrix LED Headlight Units (Left & Right)
    const headGeo = new THREE.BoxGeometry(0.42, 0.12, 0.32);
    const headLeft = new THREE.Mesh(headGeo, this.headlightMaterial);
    headLeft.position.set(-0.68, 0.52, 2.2);
    headLeft.rotation.y = -0.15;
    this.headlightMeshes.push(headLeft);
    this.carRoot.add(headLeft);

    const headRight = new THREE.Mesh(headGeo, this.headlightMaterial);
    headRight.position.set(0.68, 0.52, 2.2);
    headRight.rotation.y = 0.15;
    this.headlightMeshes.push(headRight);
    this.carRoot.add(headRight);

    // Aggressive DRL Accent Strips
    const drlGeo = new THREE.BoxGeometry(0.38, 0.035, 0.2);
    const drlLeft = new THREE.Mesh(drlGeo, this.drlMaterial);
    drlLeft.position.set(-0.68, 0.44, 2.32);
    drlLeft.rotation.y = -0.15;
    this.drlMeshes.push(drlLeft);
    this.carRoot.add(drlLeft);

    const drlRight = new THREE.Mesh(drlGeo, this.drlMaterial);
    drlRight.position.set(0.68, 0.44, 2.32);
    drlRight.rotation.y = 0.15;
    this.drlMeshes.push(drlRight);
    this.carRoot.add(drlRight);
  }

  // 6. Rear Fascia: Diffuser, Quad Exhausts & Taillight Bar
  buildRearFascia() {
    // Carbon Rear Aerodynamic Diffuser
    const diffuserGeo = new THREE.BoxGeometry(1.95, 0.18, 0.6);
    const diffuserMesh = new THREE.Mesh(diffuserGeo, this.carbonMaterial);
    diffuserMesh.position.set(0, 0.15, -2.4);
    diffuserMesh.rotation.x = -0.15;
    this.carRoot.add(diffuserMesh);

    // Quad Titanium Exhaust Tips
    const tipGeo = new THREE.CylinderGeometry(0.065, 0.065, 0.22, 16);
    tipGeo.rotateX(Math.PI / 2);

    const tipPositions = [-0.38, -0.22, 0.22, 0.38];
    tipPositions.forEach(x => {
      const tipMesh = new THREE.Mesh(tipGeo, this.chromeMaterial);
      tipMesh.position.set(x, 0.28, -2.42);
      this.exhaustMeshes.push(tipMesh);
      this.carRoot.add(tipMesh);
    });

    // Sleek Edge-to-Edge LED Neon Taillight Bar
    const tailBarGeo = new THREE.BoxGeometry(1.85, 0.06, 0.12);
    const tailBar = new THREE.Mesh(tailBarGeo, this.tailMaterial);
    tailBar.position.set(0, 0.62, -2.38);
    this.taillightMeshes.push(tailBar);
    this.carRoot.add(tailBar);
  }

  // 7. Scissor / Dihedral Doors
  buildDoors() {
    // Left Door Pivot
    this.doorLeftPivot = new THREE.Group();
    this.doorLeftPivot.position.set(-1.02, 0.52, 0.6);

    const doorGeo = new THREE.BoxGeometry(0.14, 0.52, 1.35);
    const leftDoorMesh = new THREE.Mesh(doorGeo, this.paintMaterial);
    leftDoorMesh.position.set(0, 0, -0.65);
    leftDoorMesh.castShadow = true;
    this.bodyMeshes.push(leftDoorMesh);
    this.doorLeftPivot.add(leftDoorMesh);

    // Left Side Mirror
    const mirrorGeo = new THREE.BoxGeometry(0.18, 0.08, 0.1);
    const leftMirror = new THREE.Mesh(mirrorGeo, this.carbonMaterial);
    leftMirror.position.set(-0.16, 0.22, -0.2);
    this.doorLeftPivot.add(leftMirror);

    this.carRoot.add(this.doorLeftPivot);

    // Right Door Pivot
    this.doorRightPivot = new THREE.Group();
    this.doorRightPivot.position.set(1.02, 0.52, 0.6);

    const rightDoorMesh = new THREE.Mesh(doorGeo, this.paintMaterial);
    rightDoorMesh.position.set(0, 0, -0.65);
    rightDoorMesh.castShadow = true;
    this.bodyMeshes.push(rightDoorMesh);
    this.doorRightPivot.add(rightDoorMesh);

    const rightMirror = new THREE.Mesh(mirrorGeo, this.carbonMaterial);
    rightMirror.position.set(0.16, 0.22, -0.2);
    this.doorRightPivot.add(rightMirror);

    this.carRoot.add(this.doorRightPivot);
  }

  // 8. Active Aerodynamic Rear Wing
  buildActiveWing() {
    this.spoilerPivot = new THREE.Group();
    this.spoilerPivot.position.set(0, 0.68, -2.15);

    // Wing Blade
    const wingGeo = new THREE.BoxGeometry(1.85, 0.045, 0.35);
    const wingMesh = new THREE.Mesh(wingGeo, this.carbonMaterial);
    wingMesh.castShadow = true;
    this.spoilerPivot.add(wingMesh);

    // Wing Struts (Pylons)
    const strutGeo = new THREE.BoxGeometry(0.04, 0.18, 0.14);
    const leftStrut = new THREE.Mesh(strutGeo, this.carbonMaterial);
    leftStrut.position.set(-0.55, -0.09, 0);
    this.spoilerPivot.add(leftStrut);

    const rightStrut = new THREE.Mesh(strutGeo, this.carbonMaterial);
    rightStrut.position.set(0.55, -0.09, 0);
    this.spoilerPivot.add(rightStrut);

    this.carRoot.add(this.spoilerPivot);
  }

  // 9. Detailed Wheels with Pirelli Tires, Forged Rims & Brembo Calipers
  buildWheels() {
    const wheelPositions = [
      { x: -1.05, z: 1.42, name: 'FL' }, // Front Left
      { x: 1.05, z: 1.42, name: 'FR' },  // Front Right
      { x: -1.06, z: -1.45, name: 'RL' }, // Rear Left
      { x: 1.06, z: -1.45, name: 'RR' }  // Rear Right
    ];

    wheelPositions.forEach(pos => {
      const wheelGroup = new THREE.Group();
      wheelGroup.position.set(pos.x, 0, pos.z);

      // Tire (Pirelli P-Zero Profile)
      const tireGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.26, 28);
      tireGeo.rotateZ(Math.PI / 2);
      const tireMesh = new THREE.Mesh(tireGeo, this.tireMaterial);
      tireMesh.castShadow = true;
      tireMesh.receiveShadow = true;
      wheelGroup.add(tireMesh);

      // Forged Alloy Wheel Rim (Altanero Spoke Hub)
      const rimGeo = new THREE.CylinderGeometry(0.29, 0.29, 0.27, 24);
      rimGeo.rotateZ(Math.PI / 2);
      const rimMesh = new THREE.Mesh(rimGeo, this.rimMaterial);
      this.rimMeshes.push(rimMesh);
      wheelGroup.add(rimMesh);

      // Drilled Carbon-Ceramic Brake Rotor Disc
      const rotorGeo = new THREE.CylinderGeometry(0.24, 0.24, 0.04, 20);
      rotorGeo.rotateZ(Math.PI / 2);
      const rotorMesh = new THREE.Mesh(rotorGeo, this.rotorMaterial);
      wheelGroup.add(rotorMesh);

      // Brembo-Style High Performance Caliper
      const caliperGeo = new THREE.BoxGeometry(0.08, 0.16, 0.12);
      const caliperMesh = new THREE.Mesh(caliperGeo, this.caliperMaterial);
      caliperMesh.position.set(pos.x > 0 ? -0.06 : 0.06, 0.12, 0.08);
      wheelGroup.add(caliperMesh);

      this.wheelGroups.push(wheelGroup);
      this.carRoot.add(wheelGroup);
    });
  }

  // --- INTERACTIVE METHODS & CUSTOMIZER APIS ---

  setPaintColor(hexColor) {
    this.currentPaintColor = hexColor;
    this.paintMaterial.color.set(hexColor);
  }

  setFinishStyle(finish) {
    this.currentFinish = finish;
    if (finish === 'metallic') {
      this.paintMaterial.metalness = 0.92;
      this.paintMaterial.roughness = 0.08;
      this.paintMaterial.clearcoat = 1.0;
    } else if (finish === 'matte') {
      this.paintMaterial.metalness = 0.2;
      this.paintMaterial.roughness = 0.65;
      this.paintMaterial.clearcoat = 0.0;
    } else if (finish === 'carbon') {
      this.paintMaterial.color.set(0x111317);
      this.paintMaterial.metalness = 0.4;
      this.paintMaterial.roughness = 0.35;
      this.paintMaterial.clearcoat = 0.6;
    }
  }

  setRimStyle(style) {
    this.currentRimStyle = style;
    this.rimMeshes.forEach(rim => {
      if (style === 'black') {
        rim.material.color.set(0x0d0e12);
        rim.material.metalness = 0.95;
      } else if (style === 'chrome') {
        rim.material.color.set(0xd4d8e2);
        rim.material.metalness = 0.98;
      } else if (style === 'gold') {
        rim.material.color.set(0xd4af37);
        rim.material.metalness = 0.9;
      }
    });
  }

  toggleDoors() {
    this.doorsOpen = !this.doorsOpen;
    const targetAngleL = this.doorsOpen ? -Math.PI / 3.5 : 0;
    const targetAngleR = this.doorsOpen ? Math.PI / 3.5 : 0;
    const targetRise = this.doorsOpen ? 0.22 : 0;

    if (this.doorLeftPivot) {
      this.doorLeftPivot.rotation.z = targetAngleL;
      this.doorLeftPivot.position.y = 0.52 + targetRise;
    }
    if (this.doorRightPivot) {
      this.doorRightPivot.rotation.z = targetAngleR;
      this.doorRightPivot.position.y = 0.52 + targetRise;
    }
    return this.doorsOpen;
  }

  toggleSpoiler() {
    this.spoilerRaised = !this.spoilerRaised;
    if (this.spoilerPivot) {
      this.spoilerPivot.position.y = this.spoilerRaised ? 0.88 : 0.68;
      this.spoilerPivot.rotation.x = this.spoilerRaised ? 0.18 : 0;
    }
    return this.spoilerRaised;
  }

  toggleLights() {
    this.lightsOn = !this.lightsOn;
    this.setHeadlightIntensity(this.lightsOn ? 1.0 : 0.0);
    return this.lightsOn;
  }

  setHeadlightIntensity(intensity) {
    this.headlightMaterial.emissiveIntensity = intensity * 0.9;
    this.drlMaterial.color.set(intensity > 0.1 ? 0x00f0ff : 0x223344);
    this.tailMaterial.color.set(intensity > 0.1 ? 0xff1e42 : 0x440a12);
  }

  setHoverGlow(hovered) {
    this.isHovered = hovered;
    const intensity = hovered ? 1.6 : 0.9;
    this.headlightMaterial.emissiveIntensity = intensity;
    this.drlMaterial.color.set(hovered ? 0x60efff : 0x00f0ff);
  }

  toggleXray() {
    this.isXray = !this.isXray;
    this.bodyMeshes.forEach(mesh => {
      mesh.material = this.isXray ? this.xrayMaterial : this.paintMaterial;
    });
    return this.isXray;
  }

  // Suspension & idle micro-oscillation animation
  update(delta) {
    // Ultra-subtle luxury breathing idle
    const time = performance.now() * 0.0012;
    if (this.carRoot) {
      this.carRoot.position.y = 0.46 + Math.sin(time) * 0.003;
      this.carRoot.rotation.z = Math.sin(time * 0.8) * 0.001;
    }
  }
}
