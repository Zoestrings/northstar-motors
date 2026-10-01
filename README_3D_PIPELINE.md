# Northstar Motors — Photorealistic 3D Automotive Pipeline

This guide outlines the Threepipe + WebGi photorealistic rendering pipeline configured for Northstar Motors.

---

## 1. Asset File Locations

Place your 3D assets in the `/public` directory so they are served as static files:

| Asset | Path | Description | Recommended Source |
|---|---|---|---|
| **Car Model** | `/public/models/car.glb` | PBR 3D model containing body, glass, rim, and tire meshes | Sketchfab (filter by "Downloadable" & "GLTF/GLB"), CGTrader, TurboSquid |
| **Studio HDRI** | `/public/hdri/studio.hdr` | 360° High Dynamic Range studio panorama for reflections | [Poly Haven](https://polyhaven.com/hdris/studio) (free CC0 studio HDRIs, 1k or 2k .hdr) |
| **Fallback Image** | `/public/models/bmw-m4-hero-fallback.png` | Static high-res render for devices without WebGL2 | High-res screenshot or studio render |

> **Tip on HDRI Resolution:** A **1k** or **2k** `.hdr` file (typically 1.5MB to 4MB) provides pristine reflections while keeping load time under 1 second on mobile. Avoid 4k/8k HDRIs for web production.

---

## 2. Package Installation

Install the core pipeline packages:

```bash
npm install threepipe @threepipe/webgi-plugins @threepipe/plugin-r3f gsap
```

### Additional Recommended Utilities:
* `three`: `^0.160.0` (peer dependency for Threepipe)
* `lucide-react` (if using Lucide icons in React)

---

## 3. How to Use `PhotorealCarViewer` in React / Next.js

Import and drop the component directly into the right column of your split hero section:

```jsx
import React, { useState } from 'react';
import PhotorealCarViewer from '@/components/PhotorealCarViewer';
import '@/components/PhotorealCarViewer.css';

export default function HeroSection() {
  const [carColor, setCarColor] = useState('#0a3a1f'); // Deep Emerald Green
  const [carFinish, setCarFinish] = useState('gloss'); // 'gloss' | 'matte' | 'frozen'
  const [activeAngle, setActiveAngle] = useState('hero');

  return (
    <section className="hero-split-screen">
      {/* LEFT COLUMN: Editorial & Specs */}
      <div className="hero-left-column">
        <span className="eyebrow">2024 PERFORMANCE COLLECTION</span>
        <h1>EXPERIENCE RAW POWER</h1>
        <p>Engineered for pure exhilaration. Explore our curated selection...</p>
        
        {/* Color Switcher */}
        <div className="color-swatches">
          <button onClick={() => setCarColor('#0a3a1f')} style={{ background: '#0a3a1f' }} />
          <button onClick={() => setCarColor('#111317')} style={{ background: '#111317' }} />
          <button onClick={() => setCarColor('#991b1b')} style={{ background: '#991b1b' }} />
        </div>
      </div>

      {/* RIGHT COLUMN: Photoreal 3D Car Viewer */}
      <div className="hero-right-column">
        <PhotorealCarViewer
          modelUrl="/models/car.glb"
          hdriUrl="/hdri/studio.hdr"
          carColor={carColor}
          finish={carFinish}
          activeAngle={activeAngle}
          onLoaded={() => console.log('Showroom ready!')}
        />
      </div>
    </section>
  );
}
```

---

## 4. Key Performance & Architecture Highlights

1. **HDRI-Only Lighting (Zero Flat Lights):**
   * Uses `TonemapPlugin` with ACES Filmic tonemapping at exposure `1.0`.
   * Lighting is 100% driven by the studio HDRI environment map, ensuring realistic metallic clearcoat reflections and specular highlights.

2. **Progressive Rendering:**
   * When the user stops rotating or interacting, `ProgressivePlugin` automatically accumulates noise-free samples, delivering studio-grade raytracing-like clarity.

3. **Grounded Contact Shadows:**
   * `ContactShadowPlugin` places soft ambient occlusion ground shadows directly underneath tires and body sills, preventing the car from appearing to float.

4. **Hardware & Motion Adaptivity:**
   * Low-end devices (`navigator.hardwareConcurrency < 4`) automatically disable heavy Screen Space Reflections (`SSRPlugin`) and `DepthOfFieldPlugin` for smooth 60fps.
   * `prefers-reduced-motion` users have auto-turntable rotation and bloom disabled automatically.

5. **LiquidGlass Integration:**
   * Navbar, trade modals, and statement cards retain `@ybouane/liquidglass` WebGL glass styling.
   * Hero editorial HUD overlays now use GPU-accelerated CSS `backdrop-filter: blur(20px) saturate(180%)` to eliminate texture sampling overhead with the 3D pipeline.
