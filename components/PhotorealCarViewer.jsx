import React, { useEffect, useRef, useState, useCallback } from 'react';
import gsap from 'gsap';

/**
 * CAMERA PRESETS
 * Coordinate sets tailored to showcase sports coupe silhouettes,
 * kidney grilles, staggered wheels, and aerodynamic rooflines.
 */
export const CAMERA_PRESETS = {
  hero: {
    name: 'Hero 3/4',
    position: [3.8, 1.35, 4.4],
    target: [0, 0.45, 0],
  },
  front: {
    name: 'Front Grille',
    position: [0, 1.15, 4.8],
    target: [0, 0.45, 0],
  },
  side: {
    name: 'Side Profile',
    position: [5.0, 1.15, 0],
    target: [0, 0.45, 0],
  },
  rear: {
    name: 'Rear Quarter',
    position: [-3.5, 1.4, -4.2],
    target: [0, 0.45, 0],
  },
  cockpit: {
    name: 'Cockpit View',
    position: [0.35, 1.05, 0.15],
    target: [0, 0.95, 1.2],
  },
};

/**
 * Check WebGL2 availability to ensure device supports modern PBR shaders
 */
function isWebGL2Available() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGL2RenderingContext && canvas.getContext('webgl2'));
  } catch (e) {
    return false;
  }
}

/**
 * PhotorealCarViewer
 * Showroom-quality 3D automotive viewer using Threepipe / WebGi plugins.
 * Features PBR clearcoat paint, refractive glass, progressive rendering,
 * studio HDRI image-based lighting, and responsive performance scaling.
 */
export default function PhotorealCarViewer({
  modelUrl = '/models/car.glb',
  hdriUrl = '/hdri/studio.hdr',
  carColor = '#0a3a1f',
  finish = 'gloss',
  activeAngle = 'hero',
  onLoaded,
  fallbackImage = '/models/bmw-m4-hero-fallback.png',
  className = '',
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const viewerRef = useRef(null);
  const carModelRef = useRef(null);
  const bodyMaterialsRef = useRef([]);

  const [isLoading, setIsLoading] = useState(true);
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadError, setLoadError] = useState(null);
  const [isSupported, setIsSupported] = useState(true);
  const [currentAngle, setCurrentAngle] = useState(activeAngle);

  // Turntable idle timer ref
  const idleTimerRef = useRef(null);
  const isInteractingRef = useRef(false);

  /**
   * Initialize Threepipe Viewer Pipeline
   */
  const initViewer = useCallback(async () => {
    if (!canvasRef.current) return;

    // 1. WebGL2 Hardware Validation
    if (!isWebGL2Available()) {
      setIsSupported(false);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setLoadError(null);
      setLoadProgress(10);

      // 2. Dynamic import to keep main bundle size lean
      const {
        ThreeViewer,
        TonemapPlugin,
        ProgressivePlugin,
        BloomPlugin,
        SSAOPlugin,
        SSRPlugin,
        DepthOfFieldPlugin,
        ContactShadowPlugin,
        RoomEnvironment,
        PMREMGenerator,
      } = await import('threepipe');

      // 3. Low-Power & Reduced-Motion Device Profiling
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const isLowEndDevice = typeof navigator !== 'undefined' && (navigator.hardwareConcurrency || 4) < 4;

      // 4. Instantiate ThreeViewer
      const viewer = new ThreeViewer({
        canvas: canvasRef.current,
        msaa: !isLowEndDevice,
        rgbm: true,
        tonemap: false, // Handled by TonemapPlugin for ACES Filmic control
        maxPpr: Math.min(window.devicePixelRatio, 2),
      });

      viewerRef.current = viewer;

      // 5. Register Plugins per requirements
      // Tonemapping: ACES Filmic at exposure 1.0
      await viewer.addPlugin(new TonemapPlugin(true));
      if (viewer.renderManager) {
        viewer.renderManager.renderer.toneMappingExposure = 1.0;
      }

      // Progressive Rendering: Accumulates noise-free samples when camera stops
      await viewer.addPlugin(new ProgressivePlugin(32));

      // SSAO: Screen-space ambient occlusion for body panel crevices & wheel wells
      if (!isLowEndDevice) {
        await viewer.addPlugin(new SSAOPlugin());
      }

      // Bloom: Subtle headlight & taillight glow (disabled if user prefers reduced motion)
      if (!prefersReducedMotion && !isLowEndDevice) {
        const bloom = await viewer.addPlugin(new BloomPlugin());
        if (bloom) bloom.intensity = 0.65;
      }

      // Screen Space Reflections: Sharp studio floor and metallic side panel reflections
      if (!isLowEndDevice) {
        await viewer.addPlugin(new SSRPlugin());
        await viewer.addPlugin(new DepthOfFieldPlugin());
      }

      // Contact Shadows: Soft grounding shadow beneath tires to prevent float
      await viewer.addPlugin(new ContactShadowPlugin());

      setLoadProgress(40);

      // 6. HDRI Environment Lighting
      // Studio HDRI provides 100% of the lighting (no flat directional lights)
      try {
        if (hdriUrl) {
          await viewer.setEnvironmentMap(hdriUrl);
        } else {
          // Fallback to procedural high-spec studio RoomEnvironment
          const pmrem = new PMREMGenerator(viewer.renderManager.renderer);
          pmrem.compileEquirectangularShader();
          const room = new RoomEnvironment();
          viewer.scene.environment = pmrem.fromScene(room, 0.04).texture;
        }
      } catch (hdriErr) {
        console.warn('[PhotorealCarViewer] HDRI load fallback to studio lighting:', hdriErr);
      }

      setLoadProgress(60);

      // 7. Load GLB Car Model
      const asset = await viewer.load(modelUrl);
      if (!asset) throw new Error('Model asset could not be loaded');

      const car = asset.modelObject || asset;
      carModelRef.current = car;

      // 8. Configure PBR Automotive Materials
      applyCarMaterials(car, carColor, finish);

      // 9. Camera Orbit Controls Configuration
      const controls = viewer.scene.mainCamera.controls;
      if (controls) {
        // Prevent camera from dipping under the showroom floor
        controls.minPolarAngle = 0.1;
        controls.maxPolarAngle = Math.PI / 2 - 0.04;
        // Limit zoom distance to prevent clipping into model
        controls.minDistance = 2.4;
        controls.maxDistance = 8.5;
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;

        // Auto-rotation turntable logic
        if (!prefersReducedMotion) {
          controls.autoRotate = true;
          controls.autoRotateSpeed = 1.0;

          // Pause rotation on user touch/drag; resume after 3 seconds of idle
          const handleUserInteraction = () => {
            isInteractingRef.current = true;
            controls.autoRotate = false;
            if (idleTimerRef.current) clearTimeout(idleTimerRef.current);

            idleTimerRef.current = setTimeout(() => {
              isInteractingRef.current = false;
              if (controls && !prefersReducedMotion) {
                controls.autoRotate = true;
              }
            }, 3000);
          };

          canvasRef.current.addEventListener('pointerdown', handleUserInteraction);
          canvasRef.current.addEventListener('wheel', handleUserInteraction, { passive: true });
        }
      }

      // Initial Camera Position
      transitionCameraAngle('hero', 0);

      setLoadProgress(100);
      setIsLoading(false);
      if (onLoaded) onLoaded(viewer, car);
    } catch (err) {
      console.error('[PhotorealCarViewer] Init Error:', err);
      setLoadError(err.message || 'Failed to load 3D vehicle');
      setIsLoading(false);
    }
  }, [modelUrl, hdriUrl, carColor, finish, onLoaded]);

  /**
   * Apply PBR materials: Clearcoat paint, physical glass, matte rubber
   */
  const applyCarMaterials = (car, colorHex, finishStyle) => {
    bodyMaterialsRef.current = [];

    car.traverse((child) => {
      if (!child.isMesh) return;

      const name = (child.name || '').toLowerCase();
      const matName = (child.material && child.material.name ? child.material.name : '').toLowerCase();

      // Car Body Paint
      if (name.includes('body') || matName.includes('body') || matName.includes('paint') || matName.includes('carpaint')) {
        child.material = child.material.clone();
        child.material.color.set(colorHex);
        child.material.metalness = finishStyle === 'matte' ? 0.2 : 0.4;
        child.material.roughness = finishStyle === 'matte' ? 0.55 : 0.35;
        child.material.clearcoat = finishStyle === 'matte' ? 0.1 : 1.0;
        child.material.clearcoatRoughness = finishStyle === 'matte' ? 0.4 : 0.02;
        child.material.needsUpdate = true;
        bodyMaterialsRef.current.push(child.material);
      }
      // Glass Windows & Windshield
      else if (name.includes('window') || name.includes('glass') || matName.includes('window') || matName.includes('glass')) {
        child.material = child.material.clone();
        child.material.transmission = 1.0;
        child.material.thickness = 0.5;
        child.material.roughness = 0.05;
        child.material.ior = 1.5;
        child.material.transparent = true;
        child.material.opacity = 0.95;
        child.material.needsUpdate = true;
      }
      // Tires (Matte rubber)
      else if (name.includes('tire') || name.includes('rubber') || matName.includes('tire')) {
        child.material = child.material.clone();
        child.material.roughness = 0.9;
        child.material.metalness = 0.0;
        child.material.needsUpdate = true;
      }
      // Chrome Trim & Exhaust
      else if (name.includes('chrome') || matName.includes('chrome') || name.includes('exhaust')) {
        child.material = child.material.clone();
        child.material.roughness = 0.04;
        child.material.metalness = 0.98;
        child.material.needsUpdate = true;
      }
    });
  };

  /**
   * Smoothly interpolate camera to predefined angles using GSAP
   */
  const transitionCameraAngle = (angleKey, duration = 1.2) => {
    const preset = CAMERA_PRESETS[angleKey];
    if (!preset || !viewerRef.current) return;

    const camera = viewerRef.current.scene.mainCamera;
    if (!camera) return;

    setCurrentAngle(angleKey);

    if (duration === 0) {
      camera.position.set(...preset.position);
      camera.target.set(...preset.target);
      camera.setDirty();
      return;
    }

    gsap.to(camera.position, {
      x: preset.position[0],
      y: preset.position[1],
      z: preset.position[2],
      duration,
      ease: 'power2.inOut',
      onUpdate: () => camera.setDirty(),
    });

    gsap.to(camera.target, {
      x: preset.target[0],
      y: preset.target[1],
      z: preset.target[2],
      duration,
      ease: 'power2.inOut',
      onUpdate: () => camera.setDirty(),
    });
  };

  /**
   * Live Color & Finish Prop Sync
   */
  useEffect(() => {
    bodyMaterialsRef.current.forEach((mat) => {
      mat.color.set(carColor);
      mat.metalness = finish === 'matte' ? 0.2 : 0.4;
      mat.roughness = finish === 'matte' ? 0.55 : 0.35;
      mat.clearcoat = finish === 'matte' ? 0.1 : 1.0;
      mat.clearcoatRoughness = finish === 'matte' ? 0.4 : 0.02;
      mat.needsUpdate = true;
    });
  }, [carColor, finish]);

  /**
   * Angle Prop Sync
   */
  useEffect(() => {
    if (activeAngle && activeAngle !== currentAngle) {
      transitionCameraAngle(activeAngle);
    }
  }, [activeAngle]);

  /**
   * Viewport Lazy Loading via IntersectionObserver
   * Defers heavy 3D asset initialization until the hero enters view.
   */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !viewerRef.current) {
          initViewer();
        }
      },
      { rootMargin: '100px', threshold: 0.1 }
    );

    observer.observe(container);

    return () => {
      observer.disconnect();
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (viewerRef.current) {
        viewerRef.current.dispose();
        viewerRef.current = null;
      }
    };
  }, [initViewer]);

  // Fallback view for devices lacking WebGL2
  if (!isSupported) {
    return (
      <div className={`photoreal-fallback-container ${className}`}>
        <img
          src={fallbackImage}
          alt="Northstar Motors Performance Vehicle"
          className="photoreal-fallback-img"
        />
        <div className="photoreal-fallback-badge">
          <span>High-Resolution Studio Preview</span>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className={`photoreal-viewer-wrapper ${className}`}>
      {/* 3D WebGL Canvas */}
      <canvas ref={canvasRef} className="photoreal-canvas" />

      {/* Loading Skeleton & Progress */}
      {isLoading && (
        <div className="photoreal-loader-overlay">
          <div className="photoreal-spinner-ring">
            <div className="spinner-core" />
          </div>
          <span className="photoreal-loader-text">Loading Showroom Experience...</span>
          <div className="photoreal-progress-bar">
            <div className="photoreal-progress-fill" style={{ width: `${loadProgress}%` }} />
          </div>
        </div>
      )}

      {/* Graceful Error State */}
      {loadError && (
        <div className="photoreal-error-overlay">
          <p className="error-title">Unable to render 3D showroom</p>
          <p className="error-sub">{loadError}</p>
          <button className="error-retry-btn" onClick={() => initViewer()}>
            Reload Experience
          </button>
        </div>
      )}

      {/* Built-in Camera Angles Menu */}
      {!isLoading && !loadError && (
        <div className="photoreal-angles-bar" role="toolbar" aria-label="Camera Angles">
          <span className="angles-label">VIEW</span>
          {Object.entries(CAMERA_PRESETS).map(([key, preset]) => (
            <button
              key={key}
              className={`angle-btn ${currentAngle === key ? 'active' : ''}`}
              onClick={() => transitionCameraAngle(key)}
            >
              {preset.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
