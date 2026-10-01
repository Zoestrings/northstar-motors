/* ==========================================================================
   NORTHSTAR MOTORS — PHOTOREALISTIC PORSCHE PBR 3D MODEL
   Loads authentic PBR Porsche 911 / Panamera model matching showroom hero:
   - Clearcoat Jet Black Metallic paint (matching showroom photo)
   - Iconic glowing continuous Porsche LED taillight bar
   - Refractive tinted glass windows
   - Silver forged alloy wheels & Michelin sport tires
   ========================================================================== */

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class CarModel {
  constructor(scene) {
    this.scene = scene;
    this.group = new THREE.Group();

    // Default Paint: Jet Black Metallic (matches user's photo)
    this.currentPaintColor = 0x121418;
    this.currentFinish = 'gloss';
    this.currentRimStyle = 'silver';
    this.lightsOn = true;
    this.isHovered = false;
    this.isLoaded = false;

    // 360° Turntable Rotation Control
    // Positioned at an aggressive rear 3/4 angle showcasing the signature Porsche lightbar & wing
    this.rotationY = 2.45;
    this.targetRotationY = 2.45;

    this.bodyMeshes = [];
    this.rimMeshes = [];
    this.lightMeshes = [];
    this.glassMeshes = [];

    this.initPBRMaterials();
    this.loadGLBModel();

    this.group.rotation.y = this.rotationY;
    this.scene.add(this.group);
  }

  initPBRMaterials() {
    // 1. High-End Porsche Metallic Clearcoat Paint
    this.paintMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(this.currentPaintColor),
      metalness: 0.82,
      roughness: 0.16,
      clearcoat: 1.0,
      clearcoatRoughness: 0.03,
      reflectivity: 1.0,
      envMapIntensity: 2.4
    });

    // 2. Optical Tinted Cockpit Glass (Refractive & Transmissive)
    this.glassMaterial = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(0x0a0e16),
      metalness: 0.1,
      roughness: 0.03,
      transmission: 0.92,
      opacity: 0.94,
      transparent: true,
      ior: 1.52,
      reflectivity: 1.0,
      envMapIntensity: 2.2
    });

    // 3. Forged Alloy Wheels Material (Signature Silver finish from photo)
    this.rimMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xd1d5db),
      metalness: 0.96,
      roughness: 0.14,
      envMapIntensity: 2.5
    });

    // 4. Signature Porsche Red LED Taillight Bar & Headlights
    this.lightMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xff1e1e),
      emissive: new THREE.Color(0xff0025),
      emissiveIntensity: 4.0,
      roughness: 0.1
    });

    // 5. Chrome / Silver Accents (Window trim & badging)
    this.chromeMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0xf3f4f6),
      metalness: 0.98,
      roughness: 0.05,
      envMapIntensity: 2.8
    });

    // 6. Satin Shadowline & Diffuser Trim
    this.trimMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x14161a),
      metalness: 0.35,
      roughness: 0.4
    });

    // 7. Michelin Pilot Sport Rubber Tires
    this.tireMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(0x16181b),
      metalness: 0.04,
      roughness: 0.88
    });
  }

  loadGLBModel() {
    const loader = new GLTFLoader();
    const modelUrl = '/models/porsche.glb';

    loader.load(
      modelUrl,
      (gltf) => {
        const carScene = gltf.scene;

        carScene.traverse((child) => {
          if (!child.isMesh) return;

          child.castShadow = true;
          child.receiveShadow = true;

          const matName = (child.material && child.material.name) ? child.material.name.toLowerCase() : '';
          const meshName = (child.name || '').toLowerCase();

          // Body paint & clearcoat meshes
          if (matName.includes('paint') || matName.includes('coat') || meshName.includes('body')) {
            child.material = this.paintMaterial;
            this.bodyMeshes.push(child);
          }
          // Windows / Glass
          else if (matName.includes('window') || matName.includes('glass') || meshName.includes('window')) {
            child.material = this.glassMaterial;
            this.glassMeshes.push(child);
          }
          // Signature Red Taillight Bar & Lights
          else if (matName.includes('lights') || matName.includes('light') || meshName.includes('light') || meshName.includes('tail')) {
            child.material = this.lightMaterial;
            this.lightMeshes.push(child);
          }
          // Silver wheels / rims
          else if (matName.includes('silver') || meshName.includes('rim') || meshName.includes('wheel')) {
            child.material = this.rimMaterial;
            this.rimMeshes.push(child);
          }
          // Rubber tires
          else if (matName.includes('rubber') || meshName.includes('tire')) {
            child.material = this.tireMaterial;
          }
          // Dark trim / plastics
          else if (matName.includes('black') || matName.includes('plastic')) {
            child.material = this.trimMaterial;
          }
          // Logo & badges
          else if (matName.includes('logo') || matName.includes('badge')) {
            child.material = this.chromeMaterial;
          }
          else if (child.material) {
            child.material.envMapIntensity = 2.2;
            child.material.needsUpdate = true;
          }
        });

        // Compute Bounding Box to center & ground the Porsche perfectly
        const box = new THREE.Box3().setFromObject(carScene);
        const size = new THREE.Vector3();
        box.getSize(size);

        // Normalize car scale so length is ~4.4 units
        const maxDimension = Math.max(size.x, size.y, size.z);
        if (maxDimension > 0) {
          const scaleFactor = 4.4 / maxDimension;
          carScene.scale.setScalar(scaleFactor);
        }

        // Recompute grounded position
        box.setFromObject(carScene);
        carScene.position.x = - (box.min.x + box.max.x) / 2;
        carScene.position.y = - box.min.y; // Sits flush on floor
        carScene.position.z = - (box.min.z + box.max.z) / 2;

        this.carRoot = carScene;
        this.group.add(carScene);
        this.isLoaded = true;
      },
      undefined,
      (error) => {
        console.warn('Failed to load Porsche GLB, trying fallback:', error);
        this.loadBMWFallback();
      }
    );
  }

  loadBMWFallback() {
    const loader = new GLTFLoader();
    loader.load('/models/bmw_m4.glb', (gltf) => {
      this.carRoot = gltf.scene;
      this.group.add(gltf.scene);
      this.isLoaded = true;
    });
  }

  // --- INTERACTIVE CUSTOMIZER API ---

  setPaintColor(hex) {
    this.currentPaintColor = hex;
    const color = new THREE.Color(hex);
    this.paintMaterial.color.set(color);
  }

  setFinishStyle(style) {
    this.currentFinish = style;
    if (style === 'matte') {
      this.paintMaterial.roughness = 0.48;
      this.paintMaterial.metalness = 0.35;
      this.paintMaterial.clearcoat = 0.15;
      this.paintMaterial.clearcoatRoughness = 0.5;
    } else if (style === 'frozen') {
      this.paintMaterial.roughness = 0.32;
      this.paintMaterial.metalness = 0.72;
      this.paintMaterial.clearcoat = 0.55;
      this.paintMaterial.clearcoatRoughness = 0.25;
    } else {
      // Default: Ultra-glossy automotive clearcoat
      this.paintMaterial.roughness = 0.16;
      this.paintMaterial.metalness = 0.82;
      this.paintMaterial.clearcoat = 1.0;
      this.paintMaterial.clearcoatRoughness = 0.03;
    }
    this.paintMaterial.needsUpdate = true;
  }

  setRimStyle(style) {
    this.currentRimStyle = style;
    if (style === 'black') {
      this.rimMaterial.color.set(0x181a20);
      this.rimMaterial.metalness = 0.95;
      this.rimMaterial.roughness = 0.12;
    } else if (style === 'gold' || style === 'bronze') {
      this.rimMaterial.color.set(0xc59b27);
      this.rimMaterial.metalness = 0.92;
      this.rimMaterial.roughness = 0.15;
    } else {
      // Classic Porsche Silver Forged Wheels
      this.rimMaterial.color.set(0xd1d5db);
      this.rimMaterial.metalness = 0.96;
      this.rimMaterial.roughness = 0.14;
    }
    this.rimMaterial.needsUpdate = true;
  }

  toggleLights() {
    this.lightsOn = !this.lightsOn;
    const intensity = this.lightsOn ? 4.0 : 0.0;
    this.lightMaterial.emissiveIntensity = intensity;
    return this.lightsOn;
  }

  toggleXray() {
    this.isXray = !this.isXray;
    this.paintMaterial.wireframe = this.isXray;
    this.paintMaterial.needsUpdate = true;
    return this.isXray;
  }

  toggleDoors() {
    return false;
  }

  toggleSpoiler() {
    return false;
  }

  // --- 360° TURNTABLE ROTATION API ---

  setRotation(rotY) {
    this.targetRotationY = rotY;
  }

  addRotation(deltaY) {
    this.targetRotationY += deltaY;
  }

  setHoverGlow(hovered) {
    this.isHovered = hovered;
    const intensity = hovered ? 5.0 : 4.0;
    this.lightMaterial.emissiveIntensity = this.lightsOn ? intensity : 0.0;
  }

  update(delta) {
    // Smooth turntable damping
    this.rotationY += (this.targetRotationY - this.rotationY) * 0.08;
    if (this.group) {
      this.group.rotation.y = this.rotationY;
    }
  }
}
