/* ==========================================================================
   NORTHSTAR MOTORS — LIQUID GLASS ENGINE
   Integrates @ybouane/liquidglass WebGL glass effect across key UI surfaces.

   Architecture:
   - LiquidGlass requires glass elements to be DIRECT CHILDREN of the root.
   - Hero section: the turntable-hint and hero-editorial-overlay ARE direct
     children of .hero-3d-section, making it the perfect root.
   - Navbar: wraps content into a content layer, uses navbar as root with a
     glass background panel as sibling.
   ========================================================================== */

import { LiquidGlass } from '@ybouane/liquidglass';

// Track all instances for cleanup
const instances = [];

/**
 * Safely init a LiquidGlass instance — catches errors and logs them.
 */
async function safeInit(options, label = '') {
  try {
    const inst = await LiquidGlass.init(options);
    instances.push(inst);
    console.log(`[LiquidGlass] Ready: ${label}`);
    return inst;
  } catch (err) {
    console.warn(`[LiquidGlass] Notice: ${label}:`, err.message || err);
    return null;
  }
}

// ============================================================================
// 1. NAVBAR LIQUID GLASS
// The navbar (position:fixed) acts as the root. We inject a transparent glass
// background panel as its first child, and wrap all existing nav items in a
// z-elevated content layer so they render above the WebGL canvas.
// ============================================================================
async function initNavbarGlass() {
  const navbar = document.getElementById('site-navbar');
  if (!navbar) return null;

  // Create a glass background panel (direct child of navbar)
  const glassBg = document.createElement('div');
  glassBg.id = 'navbar-glass-bg';
  glassBg.dataset.config = JSON.stringify({
    blurAmount: 0.24,
    refraction: 0.44,
    chromAberration: 0.016,
    edgeHighlight: 0.07,
    fresnel: 0.78,
    cornerRadius: 0,
    zRadius: 12,
    shadowOpacity: 0.1,
    shadowSpread: 18,
    shadowOffsetY: 2,
    brightness: 0.09,
    saturation: -0.04,
  });
  glassBg.style.cssText = `
    position: absolute;
    inset: 0;
    z-index: 0;
    pointer-events: none;
  `;

  // Wrap existing navbar children in a content layer above the glass canvas
  const contentLayer = document.createElement('div');
  contentLayer.id = 'navbar-content-layer';
  contentLayer.style.cssText = `
    position: relative;
    z-index: 2;
    width: 100%;
    height: 100%;
    display: contents;
  `;

  // Move all current nav children into the content layer
  const children = Array.from(navbar.childNodes);
  children.forEach(child => contentLayer.appendChild(child));

  // Append glass bg first (paints behind), then content
  navbar.appendChild(glassBg);
  navbar.appendChild(contentLayer);

  // Strip CSS fallback glass from navbar
  navbar.style.background = 'transparent';
  navbar.style.backdropFilter = 'none';
  navbar.style.webkitBackdropFilter = 'none';
  navbar.style.borderBottom = 'none';
  navbar.classList.add('lg-active');

  return await safeInit({
    root: navbar,
    glassElements: [glassBg],
  }, 'Navbar glass');
}

// ============================================================================
// 2. HERO SECTION LIQUID GLASS
// Note: Per photorealistic pipeline architecture, LiquidGlass is removed from
// hero editorial overlay and turntable hint in favor of GPU-accelerated CSS
// backdrop-filter (blur(20px) saturate(180%)) to dedicate all WebGL resources
// to the Threepipe PBR rendering pipeline without texture sampling conflicts.
// ============================================================================
async function initHeroGlass() {
  const heroSection = document.querySelector('.hero-3d-section');
  if (!heroSection) return null;

  // Hero overlays now use clean CSS backdrop-filter fallbacks.
  // Skipping WebGL glass injection on hero section direct children.
  console.log('[LiquidGlass] Hero section glass skipped (using CSS backdrop-filter for photoreal 3D pipeline)');
  return null;
}

// ============================================================================
// 3. STATEMENT SECTION GLASS
// The brand statement box gets a nice glass panel effect.
// ============================================================================
async function initStatementGlass() {
  const statementSection = document.querySelector('.section-statement');
  if (!statementSection) return null;

  const statementBox = statementSection.querySelector('.statement-box');
  if (!statementBox || statementBox.parentElement !== statementSection.querySelector('.container')) {
    return null;
  }

  // The statement section > .container is the root.
  // statement-box must be a direct child of it.
  const container = statementSection.querySelector('.container');
  if (!container || statementBox.parentElement !== container) return null;

  statementBox.dataset.config = JSON.stringify({
    blurAmount: 0.12,
    refraction: 0.38,
    chromAberration: 0.012,
    edgeHighlight: 0.07,
    fresnel: 0.72,
    cornerRadius: 28,
    zRadius: 20,
    shadowOpacity: 0.1,
    shadowSpread: 40,
    shadowOffsetY: 8,
    brightness: 0.06,
    saturation: -0.02,
  });

  return await safeInit({
    root: container,
    glassElements: [statementBox],
  }, 'Statement box glass');
}

// ============================================================================
// 4. MODAL GLASS
// Applies glass to the modal card background.
// The modal-backdrop acts as root; modal-card as glass element.
// ============================================================================
async function initModalGlass(modalId) {
  const backdrop = document.getElementById(modalId);
  if (!backdrop) return null;

  const card = backdrop.querySelector('.modal-card');
  if (!card) return null;

  // The modal-card must be a direct child of the backdrop (it is by default)
  if (card.parentElement !== backdrop) return null;

  card.dataset.config = JSON.stringify({
    blurAmount: 0.3,
    refraction: 0.5,
    chromAberration: 0.025,
    edgeHighlight: 0.12,
    fresnel: 0.92,
    cornerRadius: card.classList.contains('modal-large') ? 24 : 28,
    zRadius: 36,
    shadowOpacity: 0.38,
    shadowSpread: 50,
    shadowOffsetY: 10,
    brightness: 0.1,
    saturation: -0.06,
    tintStrength: 0.015,
  });

  // Prepare card content to sit above the glass canvas
  card.classList.add('lg-glass-ready');

  return await safeInit({
    root: backdrop,
    glassElements: [card],
  }, `Modal glass: ${modalId}`);
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Initialize all Liquid Glass effects across the Northstar Motors site.
 * Should be called after DOMContentLoaded and after fonts are loaded.
 */
export async function initAllGlass() {
  // Mobile check: Phones & small tablets use hardware-accelerated CSS backdrop-filter
  // to avoid multi-WebGL context contention and ensure 60-120fps scrolling.
  if (window.innerWidth < 768) {
    console.log('[LiquidGlass] Mobile device detected: using GPU CSS backdrop-filter for maximum smoothness.');
    return;
  }

  // Quick WebGL check
  const testCanvas = document.createElement('canvas');
  const hasWebGL = !!(
    testCanvas.getContext('webgl') ||
    testCanvas.getContext('experimental-webgl')
  );

  if (!hasWebGL) {
    console.warn('[LiquidGlass] WebGL not available — glass effects disabled.');
    return;
  }

  console.log('[LiquidGlass] Initializing primary desktop UI glass...');

  // Initialize navbar and statement section glass
  await Promise.allSettled([
    initNavbarGlass(),
    initStatementGlass()
  ]);

  console.log(`[LiquidGlass] Done. ${instances.length} glass instance(s) active.`);
}

/**
 * Destroy all active glass instances (call on page teardown).
 */
export function destroyAllGlass() {
  instances.forEach(inst => {
    try { inst.destroy(); } catch (e) {}
  });
  instances.length = 0;
}

/**
 * Signal that something changed visually (e.g. after inventory renders).
 */
export function markAllChanged() {
  instances.forEach(inst => {
    try { inst.markChanged(); } catch (e) {}
  });
}
