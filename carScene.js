/* ==========================================================================
   NORTHSTAR MOTORS — CINEMATIC 3D AUTOMOTIVE STUDIO & CAMERA MANAGER
   Luxury Dark Studio Environment, Dynamic Long-Lens Camera, GSAP Entrance,
   Mouse Parallax with Damping, Headlight Hover Glow & Scroll Timeline
   ========================================================================== */

import * as THREE from 'three';
import gsap from 'gsap';
import { CarModel } from './carModel.js';

export class CarSceneManager {
  constructor(canvasElement) {
    this.canvas = canvasElement;
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    // Mouse & Inertia Tracking
    this.mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
    this.isHovered = false;
    this.scrollProgress = 0;

    this.initRenderer();
    this.initScene();
    this.initCamera();
    this.initLights();
    this.initGround();

    // Instantiate 3D Sports Car Model
    this.car = new CarModel(this.scene);

    this.initEventListeners();
    this.playEntranceAnimation();
    this.animate();
  }

  initRenderer() {
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
  }

  initScene() {
    this.scene = new THREE.Scene();
    // Sophisticated Dark Luxury Automotive Studio
    this.scene.background = new THREE.Color(0x090a0f);
    this.scene.fog = new THREE.FogExp2(0x090a0f, 0.025);
  }

  initCamera() {
    // Cinematic Long-Lens Perspective (38° FOV for realistic vehicle proportions)
    this.camera = new THREE.PerspectiveCamera(38, this.width / this.height, 0.1, 100);

    // Default Hero 3/4 Camera View: low to ground, slightly below hood height, looking up
    this.baseCameraPos = new THREE.Vector3(4.2, 1.35, 4.6);
    this.cameraTarget = new THREE.Vector3(1.2, 0.52, 0);

    this.camera.position.copy(this.baseCameraPos);
    this.camera.lookAt(this.cameraTarget);
  }

  initLights() {
    // 1. Ambient Dark Studio Glow
    this.ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
    this.scene.add(this.ambientLight);

    // 2. Soft Overhead Key Softbox (Directional Shadow Caster)
    this.keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
    this.keyLight.position.set(4, 8, 4);
    this.keyLight.castShadow = true;
    this.keyLight.shadow.mapSize.width = 2048;
    this.keyLight.shadow.mapSize.height = 2048;
    this.keyLight.shadow.bias = -0.0001;
    this.keyLight.shadow.camera.near = 0.5;
    this.keyLight.shadow.camera.far = 25;
    this.keyLight.shadow.camera.left = -6;
    this.keyLight.shadow.camera.right = 6;
    this.keyLight.shadow.camera.top = 6;
    this.keyLight.shadow.camera.bottom = -6;
    this.scene.add(this.keyLight);

    // 3. Cinematic Rim Light (Along roofline and shoulder contour)
    this.rimLight = new THREE.DirectionalLight(0x00e5ff, 2.2);
    this.rimLight.position.set(-6, 4.5, -6);
    this.scene.add(this.rimLight);

    // 4. Subtle Front Grille & Wheel Fill Light
    this.fillLight = new THREE.DirectionalLight(0xffffff, 1.4);
    this.fillLight.position.set(2, 2.5, 6);
    this.scene.add(this.fillLight);

    // 5. Headlight Projector Spotlights
    this.headlightSpotL = new THREE.SpotLight(0xdbeafe, 2.5, 12, Math.PI / 6, 0.4);
    this.headlightSpotL.position.set(0.65, 0.95, 2.2);
    this.headlightSpotL.target.position.set(0.65, 0, 8);
    this.scene.add(this.headlightSpotL);
    this.scene.add(this.headlightSpotL.target);

    this.headlightSpotR = new THREE.SpotLight(0xdbeafe, 2.5, 12, Math.PI / 6, 0.4);
    this.headlightSpotR.position.set(2.05, 0.95, 2.2);
    this.headlightSpotR.target.position.set(2.05, 0, 8);
    this.scene.add(this.headlightSpotR);
    this.scene.add(this.headlightSpotR.target);
  }

  initGround() {
    // Dark Reflective Mirror Studio Floor
    const groundGeo = new THREE.PlaneGeometry(60, 60);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x090b10,
      roughness: 0.12,
      metalness: 0.88
    });

    const groundMesh = new THREE.Mesh(groundGeo, groundMat);
    groundMesh.rotation.x = -Math.PI / 2;
    groundMesh.position.y = 0;
    groundMesh.receiveShadow = true;
    this.scene.add(groundMesh);

    // Subtle Radial Floor Accent Rings
    const ringGeo = new THREE.RingGeometry(2.4, 2.45, 64);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x00e5ff,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 0.15
    });
    const ringMesh = new THREE.Mesh(ringGeo, ringMat);
    ringMesh.rotation.x = -Math.PI / 2;
    ringMesh.position.set(1.4, 0.004, 0);
    this.scene.add(ringMesh);
  }

  // --------------------------------------------------------------------------
  // CINEMATIC ENTRANCE ANIMATION SEQUENCE
  // --------------------------------------------------------------------------
  playEntranceAnimation() {
    // 1. Initial State: Car placed offset to the right, suspension lifted slightly
    this.car.group.position.x = 4.8;
    this.car.group.position.z = -1.2;
    this.car.group.rotation.y = -Math.PI / 6;
    this.car.setHeadlightIntensity(0.1);

    // 2. Smooth GSAP Glide into Showcase Position
    gsap.to(this.car.group.position, {
      x: 1.4,
      z: 0,
      duration: 2.2,
      ease: 'power3.out',
      onComplete: () => {
        // 3. Tiny realistic suspension settling bounce
        gsap.to(this.car.carRoot.position, {
          y: 0.43,
          duration: 0.25,
          yoyo: true,
          repeat: 1,
          ease: 'power2.inOut',
          onComplete: () => {
            this.car.carRoot.position.y = 0.46;
          }
        });

        // 4. Gently illuminate Matrix LED headlights & DRLs
        gsap.to(this.headlightSpotL, { intensity: 2.5, duration: 0.8 });
        gsap.to(this.headlightSpotR, { intensity: 2.5, duration: 0.8 });
        this.car.setHeadlightIntensity(1.0);
      }
    });

    // Rotate car slightly into 3/4 stance
    gsap.to(this.car.group.rotation, {
      y: -Math.PI / 8,
      duration: 2.2,
      ease: 'power3.out'
    });
  }

  // --------------------------------------------------------------------------
  // INTERACTION EVENT LISTENERS
  // --------------------------------------------------------------------------
  initEventListeners() {
    // Mouse Parallax tracking
    window.addEventListener('mousemove', (e) => {
      // Normalized screen coordinates (-1 to 1)
      this.mouse.targetX = (e.clientX / this.width) * 2 - 1;
      this.mouse.targetY = -(e.clientY / this.height) * 2 + 1;
    });

    // Hover over hero section triggers intelligent headlight glow
    const heroSection = document.getElementById('hero-section');
    if (heroSection) {
      heroSection.addEventListener('mouseenter', () => {
        this.isHovered = true;
        this.car.setHoverGlow(true);
        gsap.to(this.headlightSpotL, { intensity: 3.8, duration: 0.4 });
        gsap.to(this.headlightSpotR, { intensity: 3.8, duration: 0.4 });
      });

      heroSection.addEventListener('mouseleave', () => {
        this.isHovered = false;
        this.car.setHoverGlow(false);
        gsap.to(this.headlightSpotL, { intensity: 2.5, duration: 0.6 });
        gsap.to(this.headlightSpotR, { intensity: 2.5, duration: 0.6 });
      });
    }

    // Scroll Timeline tracking for camera transitions
    window.addEventListener('scroll', () => {
      const scrollY = window.scrollY;
      const heroHeight = heroSection ? heroSection.offsetHeight : window.innerHeight;
      this.scrollProgress = Math.min(1.0, Math.max(0, scrollY / (heroHeight * 0.85)));
      this.updateCameraOnScroll(this.scrollProgress);
    });

    // Window resize
    window.addEventListener('resize', () => {
      this.width = window.innerWidth;
      this.height = window.innerHeight;
      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(this.width, this.height);
    });
  }

  // Scroll camera angle timeline
  updateCameraOnScroll(progress) {
    // Camera moves gracefully around the car as user scrolls
    // 0% -> Hero 3/4 (x: 4.2, y: 1.35, z: 4.6)
    // 50% -> Side Profile (x: 5.4, y: 1.2, z: 1.2)
    // 100% -> Close Front Lowered (x: 2.8, y: 0.95, z: 4.8)
    const targetX = 4.2 + Math.sin(progress * Math.PI) * 1.4;
    const targetY = 1.35 - progress * 0.4;
    const targetZ = 4.6 - progress * 1.8;

    this.baseCameraPos.set(targetX, targetY, targetZ);
  }

  // Camera Presets Smooth Sweeps
  setCameraPreset(presetName) {
    const presets = {
      hero: { pos: { x: 4.2, y: 1.35, z: 4.6 }, target: { x: 1.2, y: 0.52, z: 0 } },
      front: { pos: { x: 1.4, y: 0.95, z: 5.4 }, target: { x: 1.4, y: 0.48, z: 0 } },
      side: { pos: { x: 5.8, y: 1.15, z: 0 }, target: { x: 1.4, y: 0.48, z: 0 } },
      rear: { pos: { x: 1.4, y: 1.25, z: -5.4 }, target: { x: 1.4, y: 0.48, z: 0 } },
      wheels: { pos: { x: 3.2, y: 0.72, z: 2.2 }, target: { x: 2.45, y: 0.38, z: 1.42 } },
      top: { pos: { x: 1.4, y: 7.5, z: 0.1 }, target: { x: 1.4, y: 0, z: 0 } }
    };

    const targetPreset = presets[presetName] || presets.hero;

    gsap.to(this.baseCameraPos, {
      x: targetPreset.pos.x,
      y: targetPreset.pos.y,
      z: targetPreset.pos.z,
      duration: 1.2,
      ease: 'power3.inOut'
    });

    gsap.to(this.cameraTarget, {
      x: targetPreset.target.x,
      y: targetPreset.target.y,
      z: targetPreset.target.z,
      duration: 1.2,
      ease: 'power3.inOut'
    });
  }

  // Studio Lighting Theme Switcher
  setEnvironmentTheme(envTheme) {
    if (envTheme === 'bright') {
      this.scene.background.set(0x161a22);
      this.scene.fog.color.set(0x161a22);
      this.ambientLight.intensity = 1.2;
      this.keyLight.intensity = 3.5;
      this.rimLight.color.set(0x00e5ff);
    } else if (envTheme === 'dark') {
      this.scene.background.set(0x07080b);
      this.scene.fog.color.set(0x07080b);
      this.ambientLight.intensity = 0.5;
      this.keyLight.intensity = 2.8;
      this.rimLight.color.set(0xff2a5f);
    } else if (envTheme === 'sunset') {
      this.scene.background.set(0x1a1218);
      this.scene.fog.color.set(0x1a1218);
      this.ambientLight.intensity = 0.8;
      this.keyLight.intensity = 3.0;
      this.keyLight.color.set(0xffb800);
      this.rimLight.color.set(0xff4500);
    }
  }

  // --------------------------------------------------------------------------
  // RENDER LOOP & SMOOTH DAMPING
  // --------------------------------------------------------------------------
  animate() {
    requestAnimationFrame(() => this.animate());

    // 1. Smooth Mouse Parallax Damping (Lerp with inertia)
    this.mouse.x += (this.mouse.targetX - this.mouse.x) * 0.05;
    this.mouse.y += (this.mouse.targetY - this.mouse.y) * 0.05;

    // 2. Subtle camera parallax offset (never flips or over-rotates)
    const parallaxX = this.mouse.x * 0.45;
    const parallaxY = this.mouse.y * 0.25;

    this.camera.position.x = this.baseCameraPos.x + parallaxX;
    this.camera.position.y = this.baseCameraPos.y + parallaxY;
    this.camera.position.z = this.baseCameraPos.z;

    this.camera.lookAt(this.cameraTarget);

    // 3. Update Car Internal Idle Animation
    const delta = 0.016;
    if (this.car) this.car.update(delta);

    // 4. Render Scene
    this.renderer.render(this.scene, this.camera);
  }
}
