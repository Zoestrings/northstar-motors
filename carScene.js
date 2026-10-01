/* ==========================================================================
   NORTHSTAR MOTORS — CINEMATIC ARCHITECTURAL SHOWROOM STUDIO
   Photorealistic automotive showroom rendering engine:
   - HDRI RoomEnvironment & PMREMGenerator for realistic PBR reflections
   - Soft ambient contact shadow under the vehicle
   - Polished reflective architectural floor & concrete studio wall
   - Smooth 360° interactive turntable rotation & animated camera presets
   ========================================================================== */

import * as THREE from 'three';
import gsap from 'gsap';
import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader.js';
import { CarModel } from './carModel.js';

export class CarSceneManager {
  constructor(canvasElement) {
    this.canvas = canvasElement;

    // Use the canvas container's actual dimensions (right column only)
    const container = canvasElement.parentElement || canvasElement;
    this.width  = container.offsetWidth  || window.innerWidth  / 2;
    this.height = container.offsetHeight || window.innerHeight;

    // Interaction & 360° Drag Rotation State
    this.isDragging = false;
    this.previousMousePosition = { x: 0, y: 0 };
    this.rotationVelocity = 0;
    this.autoRotate = true;
    this.idleTimer = null;
    this.isPaused = false;
    this.animFrameId = null;

    // Touch gesture state
    this.touchStartX = 0;
    this.touchStartY = 0;
    this.touchDecided = false;
    this.touchIsHorizontal = false;

    this.initRenderer();
    this.initScene();
    this.initEnvironment();
    this.initCamera();
    this.initLights();
    this.initContactShadow();
    this.initArchitecturalStudio();

    // Create Photorealistic 3D Car Model
    this.car = new CarModel(this.scene);

    this.init360DragRotation();
    this.initEventListeners();
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

    // Adaptive pixel ratio: 1.25 on mobile, 1.5 on desktop for buttery 60fps
    const isMobile = window.innerWidth < 768;
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.5));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.2;
  }

  initScene() {
    this.scene = new THREE.Scene();
    // Background set by HDRI loader — placeholder dark color until HDRI resolves
    this.scene.background = new THREE.Color(0x0a0c12);
  }

  initEnvironment() {
    // Real HDRI via RGBELoader — drives all PBR reflections on paint, glass, chrome
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    pmremGenerator.compileEquirectangularShader();

    new RGBELoader()
      .setPath('/hdri/')
      .load('studio.hdr', (texture) => {
        const envMap = pmremGenerator.fromEquirectangular(texture).texture;

        // Apply as both reflection source and scene background
        this.scene.environment = envMap;
        this.scene.background  = envMap;

        // Blur the background so the car is the focal point, not the environment
        this.scene.backgroundBlurriness = 0.45;
        this.scene.backgroundIntensity  = 0.6;

        texture.dispose();
        pmremGenerator.dispose();
      },
      undefined,
      () => {
        // Fallback: if HDRI fails to load, keep PMREMGenerator room environment
        const { PMREMGenerator } = THREE;
        const gen = new PMREMGenerator(this.renderer);
        gen.compileEquirectangularShader();
        const fallbackEnv = gen.fromScene(new THREE.RoomEnvironment(), 0.04).texture;
        this.scene.environment = fallbackEnv;
        gen.dispose();
      });
  }

  initCamera() {
    // Dynamic FOV: Wider on portrait mobile screens so full car is framed without clipping
    const aspect = this.width / this.height;
    const fov = aspect < 1 ? 46 : 36;
    this.camera = new THREE.PerspectiveCamera(fov, aspect, 0.1, 100);
    this.cameraTarget = new THREE.Vector3(0, 0.45, 0);

    // Mobile offset slightly pulled back to show full Porsche silhouette
    if (aspect < 1) {
      this.camera.position.set(4.2, 1.45, 4.9);
    } else {
      this.camera.position.set(3.8, 1.35, 4.4);
    }
    this.camera.lookAt(this.cameraTarget);
  }

  initLights() {
    // HDRI drives ambient energy — keep additional lights subtle so they don't overpower reflections

    // 1. Soft ambient fill (low intensity — HDRI handles most ambient)
    this.ambientLight = new THREE.AmbientLight(0xf1f5f9, 0.4);
    this.scene.add(this.ambientLight);

    // 2. Primary overhead shadow-casting key light (reduced — HDRI provides base illumination)
    this.keyLight = new THREE.DirectionalLight(0xffffff, 0.8);
    this.keyLight.position.set(3, 8, 3);
    this.keyLight.castShadow = true;

    const isMobile = window.innerWidth < 768;
    const shadowRes = isMobile ? 512 : 1024;
    this.keyLight.shadow.mapSize.width  = shadowRes;
    this.keyLight.shadow.mapSize.height = shadowRes;
    this.keyLight.shadow.bias = -0.0001;
    this.keyLight.shadow.camera.near   = 1;
    this.keyLight.shadow.camera.far    = 16;
    this.keyLight.shadow.camera.left   = -3.2;
    this.keyLight.shadow.camera.right  = 3.2;
    this.keyLight.shadow.camera.top    = 3.2;
    this.keyLight.shadow.camera.bottom = -3.2;
    this.scene.add(this.keyLight);

    // 3. Front accent fill — gentle so HDRI specular stays king
    this.frontFill = new THREE.DirectionalLight(0xffffff, 0.6);
    this.frontFill.position.set(0, 4.5, 6.5);
    this.scene.add(this.frontFill);

    // 4. Cool side rim highlight
    this.leftRim = new THREE.DirectionalLight(0xdbeafe, 0.5);
    this.leftRim.position.set(-6, 3.5, 2.5);
    this.scene.add(this.leftRim);

    // 5. Warm sunset rim (adds depth to body panels)
    this.sunsetLight = new THREE.DirectionalLight(0xfef08a, 0.5);
    this.sunsetLight.position.set(6, 3.5, -3.5);
    this.scene.add(this.sunsetLight);

    // 6. Floor bounce (reveals undercarriage & rims)
    this.groundBounce = new THREE.DirectionalLight(0x64748b, 0.3);
    this.groundBounce.position.set(0, -3, 2);
    this.scene.add(this.groundBounce);

    // 7. Subtle headlight cone on floor
    this.headlightSpot = new THREE.SpotLight(0xffffff, 1.2, 16, Math.PI / 4.5, 0.5);
    this.headlightSpot.position.set(0, 0.8, 2.2);
    this.headlightSpot.target.position.set(0, 0, 9);
    this.scene.add(this.headlightSpot);
    this.scene.add(this.headlightSpot.target);
  }

  initContactShadow() {
    // Realistic Soft Contact Shadow directly beneath tires and chassis
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 512;
    shadowCanvas.height = 512;
    const sCtx = shadowCanvas.getContext('2d');

    // Create radial ambient occlusion shadow gradient
    const grad = sCtx.createRadialGradient(256, 256, 40, 256, 256, 230);
    grad.addColorStop(0, 'rgba(0, 0, 0, 0.95)');
    grad.addColorStop(0.35, 'rgba(0, 0, 0, 0.70)');
    grad.addColorStop(0.70, 'rgba(0, 0, 0, 0.25)');
    grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sCtx.fillStyle = grad;
    sCtx.fillRect(0, 0, 512, 512);

    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadowGeo = new THREE.PlaneGeometry(5.4, 3.2);
    const shadowMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      opacity: 0.88,
      depthWrite: false
    });

    const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    contactShadow.rotation.x = -Math.PI / 2;
    contactShadow.position.y = 0.005; // Placed flush over floor
    this.scene.add(contactShadow);
  }

  initArchitecturalStudio() {
    // 1. Glossy reflective floor — blends with HDRI ground reflection
    const floorGeo = new THREE.PlaneGeometry(80, 80);
    const floorMat = new THREE.MeshStandardMaterial({
      color: 0x0d0f14,
      roughness: 0.12,
      metalness: 0.8,
      envMapIntensity: 2.0
    });
    const floorMesh = new THREE.Mesh(floorGeo, floorMat);
    floorMesh.rotation.x = -Math.PI / 2;
    floorMesh.position.y = 0;
    floorMesh.receiveShadow = true;
    this.scene.add(floorMesh);

    // 2. ShadowMaterial plane — invisible, only catches real cast shadows under tires
    const shadowPlaneGeo = new THREE.PlaneGeometry(12, 8);
    const shadowPlaneMat = new THREE.ShadowMaterial({
      opacity: 0.45,
      transparent: true,
      depthWrite: false
    });
    const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.002;
    shadowPlane.receiveShadow = true;
    this.scene.add(shadowPlane);
  }

  // --------------------------------------------------------------------------
  // 360° SMOOTH INTERACTIVE DRAG ROTATION WITH INERTIA
  // --------------------------------------------------------------------------
  init360DragRotation() {
    // Desktop Mouse Drag
    this.canvas.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.autoRotate = false;
      this.rotationVelocity = 0;
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
      if (this.idleTimer) clearTimeout(this.idleTimer);
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging || !this.car) return;

      const deltaX = e.clientX - this.previousMousePosition.x;
      this.rotationVelocity = deltaX * 0.007;
      this.car.addRotation(this.rotationVelocity);
      this.previousMousePosition = { x: e.clientX, y: e.clientY };
    });

    window.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        // Resume subtle auto-rotation after 4 seconds of inactivity
        this.idleTimer = setTimeout(() => {
          this.autoRotate = true;
        }, 4000);
      }
    });

    // Mobile & Tablet Touch Support (Permits smooth vertical page scroll!)
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
        this.touchDecided = false;
        this.touchIsHorizontal = false;
        this.rotationVelocity = 0;
        this.previousMousePosition = { x: this.touchStartX, y: this.touchStartY };
        if (this.idleTimer) clearTimeout(this.idleTimer);
      }
    }, { passive: true });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length !== 1) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const dx = currentX - this.touchStartX;
      const dy = currentY - this.touchStartY;

      // Determine swipe intent: horizontal turntable rotation vs vertical page scroll
      if (!this.touchDecided && (Math.abs(dx) > 7 || Math.abs(dy) > 7)) {
        this.touchDecided = true;
        this.touchIsHorizontal = Math.abs(dx) > Math.abs(dy);
        if (this.touchIsHorizontal) {
          this.isDragging = true;
          this.autoRotate = false;
        }
      }

      if (this.isDragging && this.touchIsHorizontal && this.car) {
        const deltaX = currentX - this.previousMousePosition.x;
        this.rotationVelocity = deltaX * 0.007;
        this.car.addRotation(this.rotationVelocity);
        this.previousMousePosition = { x: currentX, y: currentY };
        // Prevent accidental page jumping only while actively swiping the car horizontally
        if (e.cancelable) e.preventDefault();
      }
    }, { passive: false });

    window.addEventListener('touchend', () => {
      if (this.isDragging) {
        this.isDragging = false;
        this.touchDecided = false;
        this.touchIsHorizontal = false;
        this.idleTimer = setTimeout(() => {
          this.autoRotate = true;
        }, 4000);
      }
    });
  }

  initEventListeners() {
    // Intelligent hover over hero section triggers headlight glow
    const heroSection = document.getElementById('hero-section');
    if (heroSection) {
      heroSection.addEventListener('mouseenter', () => {
        if (this.car) this.car.setHoverGlow(true);
        gsap.to(this.headlightSpot, { intensity: 4.5, duration: 0.4 });
      });

      heroSection.addEventListener('mouseleave', () => {
        if (this.car) this.car.setHoverGlow(false);
        gsap.to(this.headlightSpot, { intensity: 3.0, duration: 0.6 });
      });
    }

    // High-performance Viewport Intersection Observer
    // Pauses 3D rendering whenever scrolled off-screen to free 100% GPU for the rest of the site!
    if ('IntersectionObserver' in window) {
      this.observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            this.resume();
          } else {
            this.pause();
          }
        });
      }, { threshold: 0.05 });
      this.observer.observe(this.canvas);
    }

    // Pause rendering when browser tab is inactive to save battery and memory
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.pause();
      } else {
        const rect = this.canvas.getBoundingClientRect();
        if (rect.bottom > 0 && rect.top < window.innerHeight) {
          this.resume();
        }
      }
    });

    // Window and container responsive resize
    const handleResize = () => {
      const container = this.canvas.parentElement || this.canvas;
      this.width  = container.offsetWidth  || (window.innerWidth < 768 ? window.innerWidth : window.innerWidth / 2);
      this.height = container.offsetHeight || (window.innerWidth < 768 ? Math.min(window.innerHeight * 0.52, 380) : window.innerHeight);

      const aspect = this.width / this.height;
      this.camera.aspect = aspect;

      // Adapt FOV: Wider on mobile portrait to fit full car beautifully
      this.camera.fov = aspect < 1 ? 46 : 36;
      this.camera.updateProjectionMatrix();

      const isMobile = window.innerWidth < 768;
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.25 : 1.5));
      this.renderer.setSize(this.width, this.height, false);
    };

    window.addEventListener('resize', handleResize);
    if ('ResizeObserver' in window && this.canvas.parentElement) {
      this.resizeObserver = new ResizeObserver(handleResize);
      this.resizeObserver.observe(this.canvas.parentElement);
    }
  }

  setCameraPreset(presetName) {
    if (!this.camera) return;

    const isMobile = window.innerWidth < 768;
    const presets = {
      hero:  { pos: isMobile ? { x: 4.2, y: 1.45, z: 4.9 } : { x: 3.8, y: 1.35, z: 4.4 }, target: { x: 0, y: 0.45, z: 0 } },
      rear:  { pos: isMobile ? { x: 2.6, y: 1.30, z: 4.8 } : { x: 2.2, y: 1.20, z: 4.2 }, target: { x: 0, y: 0.45, z: 0 } },
      side:  { pos: isMobile ? { x: 5.6, y: 1.20, z: 0   } : { x: 4.8, y: 1.15, z: 0   }, target: { x: 0, y: 0.45, z: 0 } },
      front: { pos: isMobile ? { x: -4.4, y: 1.35, z: -5.0 } : { x: -3.8, y: 1.25, z: -4.4 }, target: { x: 0, y: 0.45, z: 0 } }
    };

    const targetPreset = presets[presetName] || presets.hero;

    gsap.to(this.camera.position, {
      x: targetPreset.pos.x,
      y: targetPreset.pos.y,
      z: targetPreset.pos.z,
      duration: 1.0,
      ease: 'power2.inOut',
      onUpdate: () => {
        this.camera.lookAt(this.cameraTarget);
      }
    });

    gsap.to(this.cameraTarget, {
      x: targetPreset.target.x,
      y: targetPreset.target.y,
      z: targetPreset.target.z,
      duration: 1.0,
      ease: 'power2.inOut',
      onUpdate: () => {
        this.camera.lookAt(this.cameraTarget);
      }
    });
  }

  setEnvironmentTheme(theme) {
    if (!this.ambientLight || !this.keyLight) return;

    if (theme === 'sunset') {
      gsap.to(this.ambientLight.color, { r: 1.0, g: 0.85, b: 0.7, duration: 0.8 });
      gsap.to(this.ambientLight, { intensity: 0.6, duration: 0.8 });
      gsap.to(this.sunsetLight, { intensity: 1.2, duration: 0.8 });
      gsap.to(this.keyLight, { intensity: 0.7, duration: 0.8 });
      gsap.to(this.renderer, { toneMappingExposure: 1.4, duration: 0.8 });
    } else if (theme === 'night') {
      gsap.to(this.ambientLight.color, { r: 0.4, g: 0.6, b: 0.9, duration: 0.8 });
      gsap.to(this.ambientLight, { intensity: 0.3, duration: 0.8 });
      gsap.to(this.keyLight, { intensity: 0.5, duration: 0.8 });
      gsap.to(this.leftRim, { intensity: 1.0, duration: 0.8 });
      gsap.to(this.headlightSpot, { intensity: 2.0, duration: 0.8 });
      gsap.to(this.renderer, { toneMappingExposure: 1.0, duration: 0.8 });
    } else {
      // Studio default — HDRI-balanced
      gsap.to(this.ambientLight.color, { r: 0.95, g: 0.96, b: 1.0, duration: 0.8 });
      gsap.to(this.ambientLight, { intensity: 0.4, duration: 0.8 });
      gsap.to(this.keyLight, { intensity: 0.8, duration: 0.8 });
      if (this.frontFill) gsap.to(this.frontFill, { intensity: 0.6, duration: 0.8 });
      gsap.to(this.sunsetLight, { intensity: 0.5, duration: 0.8 });
      gsap.to(this.renderer, { toneMappingExposure: 1.2, duration: 0.8 });
    }
  }

  pause() {
    this.isPaused = true;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
  }

  resume() {
    if (!this.isPaused) return;
    this.isPaused = false;
    this.animate();
  }

  animate() {
    if (this.isPaused) return;
    this.animFrameId = requestAnimationFrame(() => this.animate());

    const delta = 0.016;

    // Smooth inertia deceleration on turntable drag
    if (!this.isDragging) {
      if (Math.abs(this.rotationVelocity) > 0.0001) {
        if (this.car) this.car.addRotation(this.rotationVelocity);
        this.rotationVelocity *= 0.92; // Natural friction
      } else if (this.autoRotate && this.car) {
        this.car.addRotation(0.0016); // Gentle showcase rotation
      }
    }

    if (this.car) this.car.update(delta);

    this.renderer.render(this.scene, this.camera);
  }
}
