/* ==========================================================================
   NORTHSTAR MOTORS — MAIN APPLICATION ORCHESTRATOR
   Integrates 3D WebGL Studio, Routing, Marketplace Engine, Financing & Modals
   ========================================================================== */

import { CarSceneManager } from './carScene.js';
import { audioEngine } from './audioEngine.js';
import { INVENTORY, BODY_STYLES, MAKES, FUEL_TYPES, TRANSMISSIONS } from './inventoryData.js';
import { initAllGlass } from './liquidGlassEngine.js';

document.addEventListener('DOMContentLoaded', () => {
  // --------------------------------------------------------------------------
  // 1. INITIALIZE 3D WEBGL CAR & PHYSICS SCENE
  // --------------------------------------------------------------------------
  const canvas = document.getElementById('webgl-canvas');
  let carScene = null;
  if (canvas) {
    try {
      carScene = new CarSceneManager(canvas);
    } catch (err) {
      console.warn('3D Canvas initialization notice:', err);
    }
  }

  // --------------------------------------------------------------------------
  // 2. TOAST NOTIFICATION UTILITY
  // --------------------------------------------------------------------------
  const toast = document.getElementById('toast-message');
  const toastText = document.getElementById('toast-text');

  function showToast(msg) {
    if (!toast || !toastText) return;
    toastText.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 4000);
  }

  // --------------------------------------------------------------------------
  // 3. MULTI-PAGE ROUTING ENGINE
  // --------------------------------------------------------------------------
  const pageViews = document.querySelectorAll('.page-view');
  const navLinks = document.querySelectorAll('.nav-link');
  const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
  const mobileMenu = document.getElementById('mobile-menu');
  const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
  const closeMobileMenuBtn = document.getElementById('close-mobile-menu');

  function navigateToPage(pageId, scrollToTop = true) {
    // 1. Hide all page views and activate target
    let targetView = document.getElementById(`view-${pageId}`);
    if (!targetView) {
      targetView = document.getElementById('view-home');
      pageId = 'home';
    }

    pageViews.forEach(view => view.classList.remove('active'));
    targetView.classList.add('active');

    // 2. Update navigation active state
    navLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.page === pageId);
    });
    mobileNavLinks.forEach(link => {
      link.classList.toggle('active', link.dataset.page === pageId);
    });

    // 3. Close mobile drawer if open
    if (mobileMenu) mobileMenu.classList.remove('active');

    // 4. Update URL hash without jumping
    if (window.location.hash !== `#${pageId}`) {
      history.pushState(null, '', `#${pageId}`);
    }

    // 5. Scroll to top if requested
    if (scrollToTop) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // 6. Manage 3D engine resource lifecycle (pause WebGL on other pages to save 100% GPU)
    if (carScene) {
      if (pageId === 'home') {
        carScene.resume();
      } else {
        carScene.pause();
      }
    }

    // 7. Trigger audio feedback
    audioEngine.playClick();
  }

  // Bind all elements with data-page attribute
  document.addEventListener('click', (e) => {
    const pageBtn = e.target.closest('[data-page]');
    if (pageBtn) {
      e.preventDefault();
      const targetPage = pageBtn.dataset.page;
      const filterType = pageBtn.dataset.filterType;

      navigateToPage(targetPage);

      // If category filter requested, apply it to inventory
      if (filterType && targetPage === 'inventory') {
        const bodySelect = document.getElementById('filter-body');
        if (bodySelect) {
          bodySelect.value = filterType;
          renderFullInventory();
        }
      }
    }
  });

  // Logo home button click
  const logoHomeBtn = document.getElementById('logo-home-btn');
  if (logoHomeBtn) {
    logoHomeBtn.addEventListener('click', () => navigateToPage('home'));
  }

  // Mobile menu open / close
  if (mobileMenuToggle && mobileMenu) {
    mobileMenuToggle.addEventListener('click', () => {
      mobileMenu.classList.add('active');
    });
  }
  if (closeMobileMenuBtn && mobileMenu) {
    closeMobileMenuBtn.addEventListener('click', () => {
      mobileMenu.classList.remove('active');
    });
  }

  // Browser back / forward buttons
  window.addEventListener('popstate', () => {
    const hash = window.location.hash.replace('#', '') || 'home';
    navigateToPage(hash, false);
  });

  // Initial page load routing
  const initialHash = window.location.hash.replace('#', '') || 'home';
  navigateToPage(initialHash, false);

  // --------------------------------------------------------------------------
  // 4. 3D HERO INTERACTION CONTROLLERS
  // --------------------------------------------------------------------------
  if (carScene) {
    // 3D Hint Banner
    const hintBanner = document.getElementById('cube-hint');
    const closeHintBtn = document.getElementById('close-hint-btn');
    if (closeHintBtn && hintBanner) {
      closeHintBtn.addEventListener('click', () => {
        hintBanner.style.display = 'none';
        audioEngine.playClick();
      });
    }

    // Camera Presets
    const presetBtns = document.querySelectorAll('.preset-btn');
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        presetBtns.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        audioEngine.playClick();
        const preset = btn.dataset.preset;
        carScene.setCameraPreset(preset);
      });
    });

    // Environment Lighting
    const envBtns = document.querySelectorAll('.env-btn');
    envBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        envBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        audioEngine.playClick();
        carScene.setEnvironmentTheme(btn.dataset.env);
      });
    });

    // Paint Color Swatches
    const swatches = document.querySelectorAll('.swatch');
    const colorNameDisplay = document.getElementById('color-name-display');
    swatches.forEach(swatch => {
      swatch.addEventListener('click', () => {
        swatches.forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
        audioEngine.playClick();
        const hex = swatch.dataset.color;
        const colorName = swatch.dataset.name;
        if (carScene.car) carScene.car.setPaintColor(hex);
        if (colorNameDisplay) colorNameDisplay.textContent = colorName;
      });
    });

    // Finish Style
    const finishSegments = document.querySelectorAll('[data-finish]');
    finishSegments.forEach(seg => {
      seg.addEventListener('click', () => {
        finishSegments.forEach(s => s.classList.remove('active'));
        seg.classList.add('active');
        audioEngine.playClick();
        if (carScene.car) carScene.car.setFinishStyle(seg.dataset.finish);
      });
    });

    // Rim Design
    const rimSegments = document.querySelectorAll('[data-rim]');
    rimSegments.forEach(seg => {
      seg.addEventListener('click', () => {
        rimSegments.forEach(s => s.classList.remove('active'));
        seg.classList.add('active');
        audioEngine.playClick();
        if (carScene.car) carScene.car.setRimStyle(seg.dataset.rim);
      });
    });

    // Interactive Car Parts
    const doorsBtn = document.getElementById('toggle-doors-btn');
    if (doorsBtn) {
      doorsBtn.addEventListener('click', () => {
        if (carScene.car) {
          const isOpen = carScene.car.toggleDoors();
          doorsBtn.classList.toggle('active', isOpen);
          audioEngine.playClick();
        }
      });
    }

    const spoilerBtn = document.getElementById('toggle-spoiler-btn');
    if (spoilerBtn) {
      spoilerBtn.addEventListener('click', () => {
        if (carScene.car) {
          const isRaised = carScene.car.toggleSpoiler();
          spoilerBtn.classList.toggle('active', isRaised);
          audioEngine.playClick();
        }
      });
    }

    const lightsBtn = document.getElementById('toggle-lights-btn');
    if (lightsBtn) {
      lightsBtn.addEventListener('click', () => {
        if (carScene.car) {
          const isOn = carScene.car.toggleLights();
          lightsBtn.classList.toggle('active', isOn);
          audioEngine.playClick();
        }
      });
    }

    const xrayBtn = document.getElementById('toggle-xray-btn');
    if (xrayBtn) {
      xrayBtn.addEventListener('click', () => {
        if (carScene.car) {
          const isXray = carScene.car.toggleXray();
          xrayBtn.classList.toggle('active', isXray);
          audioEngine.playClick();
        }
      });
    }
  }

  // Rev engine button
  const revBtn = document.getElementById('audio-rev-btn');
  if (revBtn) {
    revBtn.addEventListener('click', () => {
      audioEngine.revEngine();
      revBtn.classList.add('revving');
      setTimeout(() => revBtn.classList.remove('revving'), 2400);
    });
  }

  // --------------------------------------------------------------------------
  // Studio Drawer — slide-in customizer panel
  // --------------------------------------------------------------------------
  const heroSection  = document.getElementById('hero-section');
  const drawerTab    = document.getElementById('studio-drawer-tab');
  const drawerClose  = document.getElementById('studio-drawer-close');

  function openDrawer() {
    if (heroSection) heroSection.classList.add('drawer-open');
  }
  function closeDrawer() {
    if (heroSection) heroSection.classList.remove('drawer-open');
  }

  if (drawerTab)   drawerTab.addEventListener('click',  openDrawer);
  if (drawerClose) drawerClose.addEventListener('click', closeDrawer);

  // Close drawer when clicking outside it on mobile
  document.addEventListener('click', (e) => {
    if (
      heroSection &&
      heroSection.classList.contains('drawer-open') &&
      !e.target.closest('.studio-drawer') &&
      !e.target.closest('.studio-tab')
    ) {
      closeDrawer();
    }
  });

  // Hero Schedule Test Drive button
  const heroScheduleBtn = document.getElementById('hero-schedule-testdrive-btn');
  if (heroScheduleBtn) {
    heroScheduleBtn.addEventListener('click', () => {
      const testdriveModal = document.getElementById('testdrive-modal');
      const testdriveVehicleInput = document.getElementById('testdrive-vehicle-input');
      if (testdriveVehicleInput) testdriveVehicleInput.value = '2024 Porsche Panamera Turbo S';
      if (testdriveModal) testdriveModal.classList.add('active');
    });
  }

  // Hero scroll down button
  const scrollDownBtn = document.getElementById('scroll-down-btn');
  if (scrollDownBtn) {
    scrollDownBtn.addEventListener('click', () => {
      const featSection = document.getElementById('featured-inventory-section');
      if (featSection) {
        featSection.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // --------------------------------------------------------------------------
  // 5. INVENTORY RENDERING & MARKETPLACE ENGINE
  // --------------------------------------------------------------------------
  const featuredGrid = document.getElementById('featured-inventory-grid');
  const fullGrid = document.getElementById('full-inventory-grid');
  const searchInput = document.getElementById('inventory-search-input');
  const makeFilter = document.getElementById('filter-make');
  const bodyFilter = document.getElementById('filter-body');
  const priceFilter = document.getElementById('filter-price');
  const transFilter = document.getElementById('filter-transmission');
  const fuelFilter = document.getElementById('filter-fuel');
  const sortFilter = document.getElementById('filter-sort');
  const resetFilterBtn = document.getElementById('filter-reset-btn');
  const countBadge = document.getElementById('inventory-count-badge');

  function createVehicleCardHTML(car) {
    const formattedPrice = Number(car.price).toLocaleString('en-US');
    const formattedMiles = Number(car.mileage).toLocaleString('en-US');

    return `
      <div class="vehicle-card" data-id="${car.id}">
        <div class="card-image-wrap">
          <img src="${car.image}" alt="${car.year} ${car.make} ${car.model}" loading="lazy">
          <div class="card-badge">${car.bodyStyle.toUpperCase()} • ${car.fuelType}</div>
        </div>
        <div class="card-body">
          <div class="card-year">${car.year}</div>
          <h3 class="card-title">${car.make} ${car.model}</h3>
          
          <div class="card-specs-row">
            <div class="spec-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="display:inline-block; vertical-align:middle; margin-right:4px;"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg><span>${formattedMiles} mi</span></div>
            <div class="spec-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="display:inline-block; vertical-align:middle; margin-right:4px;"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg><span>${car.transmission.split(' ')[0]}</span></div>
            <div class="spec-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="display:inline-block; vertical-align:middle; margin-right:4px;"><path d="M3 22V4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v18"/><path d="M14 13h2a2 2 0 0 1 2 2v2a2 2 0 0 0 2 2h0a2 2 0 0 0 2-2V9.83a2 2 0 0 0-.59-1.42L19 6"/><path d="M3 10h10"/></svg><span>${car.fuelType}</span></div>
            <div class="spec-item"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" style="display:inline-block; vertical-align:middle; margin-right:4px;"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg><span>NJ</span></div>
          </div>

          <div class="card-location">${car.location}</div>

          <div class="card-footer-row">
            <div class="card-price-stack">
              <span class="card-price-lbl">Price</span>
              <span class="card-price-val">$${formattedPrice}</span>
            </div>
            <button class="btn btn-primary view-vehicle-btn" data-id="${car.id}">View Vehicle</button>
          </div>
        </div>
      </div>
    `;
  }

  // Render 4-6 featured cars on Home page
  function renderFeaturedInventory() {
    if (!featuredGrid) return;
    const featuredList = INVENTORY.filter(c => c.featured).slice(0, 6);
    featuredGrid.innerHTML = featuredList.map(createVehicleCardHTML).join('');
  }

  // Filter & Render Full Inventory on Marketplace page
  function renderFullInventory() {
    if (!fullGrid) return;

    const query = searchInput ? searchInput.value.toLowerCase().trim() : '';
    const selectedMake = makeFilter ? makeFilter.value : 'All';
    const selectedBody = bodyFilter ? bodyFilter.value : 'All';
    const selectedPrice = priceFilter ? priceFilter.value : 'All';
    const selectedTrans = transFilter ? transFilter.value : 'All';
    const selectedFuel = fuelFilter ? fuelFilter.value : 'All';
    const selectedSort = sortFilter ? sortFilter.value : 'featured';

    let filtered = INVENTORY.filter(car => {
      // Search keyword match (make, model, engine, body style)
      if (query) {
        const fullStr = `${car.year} ${car.make} ${car.model} ${car.engine} ${car.bodyStyle} ${car.exteriorColor}`.toLowerCase();
        if (!fullStr.includes(query)) return false;
      }
      // Make filter
      if (selectedMake !== 'All' && car.make !== selectedMake) return false;
      // Body style filter
      if (selectedBody !== 'All' && car.bodyStyle !== selectedBody) return false;
      // Max price filter
      if (selectedPrice !== 'All') {
        const maxP = Number(selectedPrice);
        if (car.price > maxP) return false;
      }
      // Transmission filter
      if (selectedTrans !== 'All') {
        if (!car.transmission.toLowerCase().includes(selectedTrans.toLowerCase())) return false;
      }
      // Fuel type filter
      if (selectedFuel !== 'All' && car.fuelType !== selectedFuel) return false;

      return true;
    });

    // Sorting
    if (selectedSort === 'price-low') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (selectedSort === 'price-high') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (selectedSort === 'year-new') {
      filtered.sort((a, b) => b.year - a.year);
    } else if (selectedSort === 'mileage-low') {
      filtered.sort((a, b) => a.mileage - b.mileage);
    } else {
      // featured
      filtered.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }

    // Update count badge
    if (countBadge) {
      countBadge.textContent = `${filtered.length} Vehicle${filtered.length === 1 ? '' : 's'} Available`;
    }

    // Render cards
    if (filtered.length === 0) {
      fullGrid.innerHTML = `
        <div class="empty-inventory-state">
          <h3>No Vehicles Match Your Criteria</h3>
          <p>Try resetting filters or adjusting your price/style parameters.</p>
          <button class="btn btn-primary" id="empty-reset-btn">Reset All Filters</button>
        </div>
      `;
      const emptyReset = document.getElementById('empty-reset-btn');
      if (emptyReset) {
        emptyReset.addEventListener('click', resetAllFilters);
      }
    } else {
      fullGrid.innerHTML = filtered.map(createVehicleCardHTML).join('');
    }
  }

  function resetAllFilters() {
    if (searchInput) searchInput.value = '';
    if (makeFilter) makeFilter.value = 'All';
    if (bodyFilter) bodyFilter.value = 'All';
    if (priceFilter) priceFilter.value = 'All';
    if (transFilter) transFilter.value = 'All';
    if (fuelFilter) fuelFilter.value = 'All';
    if (sortFilter) sortFilter.value = 'featured';
    renderFullInventory();
  }

  if (searchInput) searchInput.addEventListener('input', renderFullInventory);
  if (makeFilter) makeFilter.addEventListener('change', renderFullInventory);
  if (bodyFilter) bodyFilter.addEventListener('change', renderFullInventory);
  if (priceFilter) priceFilter.addEventListener('change', renderFullInventory);
  if (transFilter) transFilter.addEventListener('change', renderFullInventory);
  if (fuelFilter) fuelFilter.addEventListener('change', renderFullInventory);
  if (sortFilter) sortFilter.addEventListener('change', renderFullInventory);
  if (resetFilterBtn) resetFilterBtn.addEventListener('click', resetAllFilters);

  // Initial renders
  renderFeaturedInventory();
  renderFullInventory();

  // --------------------------------------------------------------------------
  // 6. CINEMATIC VEHICLE DETAIL MODAL
  // --------------------------------------------------------------------------
  const detailModal = document.getElementById('vehicle-detail-modal');
  const detailContent = document.getElementById('vehicle-detail-content');
  const closeDetailBtn = document.getElementById('close-vehicle-detail-btn');

  function openVehicleDetail(carId) {
    const car = INVENTORY.find(c => c.id === carId);
    if (!car || !detailContent || !detailModal) return;

    const formattedPrice = Number(car.price).toLocaleString('en-US');
    const formattedMiles = Number(car.mileage).toLocaleString('en-US');
    const estMonthly = Math.round((car.price - 5000) * 0.0195);

    // Gallery images
    const galleryImgs = car.gallery && car.gallery.length > 0 ? car.gallery : [car.image];

    detailContent.innerHTML = `
      <div class="detail-header-top">
        <div class="detail-headline">Made to Be Driven.</div>
        <h2 class="detail-main-title">${car.year} ${car.make} ${car.model}</h2>
      </div>

      <div class="detail-grid-split">
        <!-- Gallery Column -->
        <div class="detail-gallery">
          <div class="gallery-main-frame">
            <img id="detail-active-img" src="${galleryImgs[0]}" alt="${car.make} ${car.model}">
          </div>
          <div class="gallery-thumbnails">
            ${galleryImgs.map((img, idx) => `
              <button class="thumbnail-btn ${idx === 0 ? 'active' : ''}" data-src="${img}">
                <img src="${img}" alt="Thumbnail ${idx + 1}">
              </button>
            `).join('')}
          </div>
          <p style="font-size: 0.9rem; color: #475569; line-height: 1.5; margin-top: 10px;">
            ${car.description}
          </p>
        </div>

        <!-- Details & CTAs Column -->
        <div class="detail-info-col">
          <div class="detail-price-badge">
            <span class="detail-price-val">$${formattedPrice}</span>
            <span class="detail-est-monthly">Est. $${estMonthly} / mo (60 mo @ 5.9%)</span>
          </div>

          <div class="detail-specs-table">
            <div class="spec-cell">
              <span class="spec-cell-lbl">Mileage</span>
              <span class="spec-cell-val">${formattedMiles} mi</span>
            </div>
            <div class="spec-cell">
              <span class="spec-cell-lbl">Year</span>
              <span class="spec-cell-val">${car.year}</span>
            </div>
            <div class="spec-cell">
              <span class="spec-cell-lbl">Engine</span>
              <span class="spec-cell-val">${car.engine}</span>
            </div>
            <div class="spec-cell">
              <span class="spec-cell-lbl">Transmission</span>
              <span class="spec-cell-val">${car.transmission}</span>
            </div>
            <div class="spec-cell">
              <span class="spec-cell-lbl">Exterior</span>
              <span class="spec-cell-val">${car.exteriorColor}</span>
            </div>
            <div class="spec-cell">
              <span class="spec-cell-lbl">Interior</span>
              <span class="spec-cell-val">${car.interiorColor}</span>
            </div>
            <div class="spec-cell">
              <span class="spec-cell-lbl">VIN</span>
              <span class="spec-cell-val" style="font-family: var(--font-mono); font-size: 0.78rem;">${car.vin}</span>
            </div>
            <div class="spec-cell">
              <span class="spec-cell-lbl">Location</span>
              <span class="spec-cell-val">${car.location}</span>
            </div>
          </div>

          <div class="detail-actions-stack">
            <button class="btn btn-primary btn-large btn-glow" id="detail-testdrive-btn" data-vehicle="${car.year} ${car.make} ${car.model}">Schedule a Test Drive</button>
            <button class="btn btn-outline" id="detail-financing-btn" data-vehicle="${car.year} ${car.make} ${car.model}">Start Financing</button>
            <button class="btn btn-secondary" id="detail-ask-btn" data-vehicle="${car.year} ${car.make} ${car.model}">Ask About This Vehicle</button>
          </div>

          <div class="detail-concierge-box">
            <strong>Questions? Talk to someone who knows the vehicle.</strong>
            <p style="color: #64748b; font-size: 0.8rem; margin: 4px 0 10px;">Northstar Specialists are available 9am–7pm.</p>
            <div style="display: flex; gap: 14px; font-weight: 700; font-size: 0.85rem; align-items: center;">
              <a href="tel:8563037680" style="color: #2563eb; display: inline-flex; align-items: center; gap: 6px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.4 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.8a16 16 0 0 0 6 6l.86-1.14a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 15.22v1.7z"/></svg>
                (856) 303-7680
              </a>
              <a href="mailto:sales@northstarmotors.com" style="color: #2563eb; display: inline-flex; align-items: center; gap: 6px;">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                Email Specialist
              </a>
            </div>
          </div>
        </div>
      </div>
    `;

    // Hook up thumbnail switcher
    const thumbBtns = detailContent.querySelectorAll('.thumbnail-btn');
    const mainImg = detailContent.getElementById('detail-active-img');
    thumbBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        thumbBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        if (mainImg) mainImg.src = btn.dataset.src;
      });
    });

    // Hook up CTAs inside detail modal
    const testdriveBtn = detailContent.querySelector('#detail-testdrive-btn');
    if (testdriveBtn) {
      testdriveBtn.addEventListener('click', () => {
        detailModal.classList.remove('active');
        const testdriveModal = document.getElementById('testdrive-modal');
        const testdriveVehicleInput = document.getElementById('testdrive-vehicle-input');
        if (testdriveVehicleInput) testdriveVehicleInput.value = testdriveBtn.dataset.vehicle;
        if (testdriveModal) testdriveModal.classList.add('active');
      });
    }

    const financingBtn = detailContent.querySelector('#detail-financing-btn');
    if (financingBtn) {
      financingBtn.addEventListener('click', () => {
        detailModal.classList.remove('active');
        const preorderModal = document.getElementById('preorder-modal');
        const summaryTrimInput = document.getElementById('summary-trim-input');
        if (summaryTrimInput) summaryTrimInput.value = financingBtn.dataset.vehicle;
        if (preorderModal) preorderModal.classList.add('active');
      });
    }

    const askBtn = detailContent.querySelector('#detail-ask-btn');
    if (askBtn) {
      askBtn.addEventListener('click', () => {
        detailModal.classList.remove('active');
        navigateToPage('contact');
      });
    }

    detailModal.classList.add('active');
    audioEngine.playClick();
  }

  // Global click listener for "View Vehicle"
  document.addEventListener('click', (e) => {
    const btn = e.target.closest('.view-vehicle-btn');
    if (btn) {
      const carId = btn.dataset.id;
      openVehicleDetail(carId);
    }
  });

  if (closeDetailBtn && detailModal) {
    closeDetailBtn.addEventListener('click', () => {
      detailModal.classList.remove('active');
    });
  }

  // --------------------------------------------------------------------------
  // 7. FINANCING MONTHLY PAYMENT CALCULATOR
  // --------------------------------------------------------------------------
  const calcPriceSlider = document.getElementById('calc-price-slider');
  const calcPriceDisplay = document.getElementById('calc-price-display');
  const calcDownSlider = document.getElementById('calc-down-slider');
  const calcDownDisplay = document.getElementById('calc-down-display');
  const calcTermSelect = document.getElementById('calc-term-select');
  const calcAprSlider = document.getElementById('calc-apr-slider');
  const calcAprDisplay = document.getElementById('calc-apr-display');
  const calcMonthlyResult = document.getElementById('calc-monthly-result');

  function calculateMonthlyPayment() {
    if (!calcPriceSlider || !calcMonthlyResult) return;

    const price = Number(calcPriceSlider.value);
    const down = Number(calcDownSlider ? calcDownSlider.value : 0);
    const termMonths = Number(calcTermSelect ? calcTermSelect.value : 60);
    const apr = Number(calcAprSlider ? calcAprSlider.value : 5.9);

    // Update labels
    if (calcPriceDisplay) calcPriceDisplay.textContent = `$${price.toLocaleString()}`;
    if (calcDownDisplay) calcDownDisplay.textContent = `$${down.toLocaleString()}`;
    if (calcAprDisplay) calcAprDisplay.textContent = `${apr.toFixed(1)}%`;

    const principal = Math.max(0, price - down);
    if (principal === 0) {
      calcMonthlyResult.textContent = '$0 / mo';
      return;
    }

    const monthlyRate = (apr / 100) / 12;
    let monthly = 0;
    if (monthlyRate === 0) {
      monthly = principal / termMonths;
    } else {
      monthly = principal * (monthlyRate * Math.pow(1 + monthlyRate, termMonths)) / (Math.pow(1 + monthlyRate, termMonths) - 1);
    }

    calcMonthlyResult.textContent = `$${Math.round(monthly).toLocaleString()} / mo`;
  }

  if (calcPriceSlider) calcPriceSlider.addEventListener('input', calculateMonthlyPayment);
  if (calcDownSlider) calcDownSlider.addEventListener('input', calculateMonthlyPayment);
  if (calcTermSelect) calcTermSelect.addEventListener('change', calculateMonthlyPayment);
  if (calcAprSlider) calcAprSlider.addEventListener('input', calculateMonthlyPayment);
  calculateMonthlyPayment();

  // --------------------------------------------------------------------------
  // 8. TRADE-IN APPRAISAL ENGINE
  // --------------------------------------------------------------------------
  const tradeInForm = document.getElementById('trade-in-form');
  const tradeEstimateBox = document.getElementById('trade-estimate-box');

  if (tradeInForm && tradeEstimateBox) {
    tradeInForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const year = parseInt(document.getElementById('trade-year').value) || 2020;
      const make = document.getElementById('trade-make').value || 'Vehicle';
      const model = document.getElementById('trade-model').value || '';
      const mileage = parseInt(document.getElementById('trade-mileage').value) || 40000;
      const condition = document.getElementById('trade-condition').value;

      // Realistic valuation simulation
      const currentYear = 2026;
      const age = Math.max(0, currentYear - year);
      let baseVal = 45000 * Math.pow(0.88, age);
      const mileagePenalty = (mileage / 10000) * 750;
      baseVal = Math.max(4000, baseVal - mileagePenalty);

      let conditionFactor = 1.0;
      if (condition === 'Excellent') conditionFactor = 1.08;
      else if (condition === 'Fair') conditionFactor = 0.88;

      const estLow = Math.round((baseVal * conditionFactor * 0.94) / 100) * 100;
      const estHigh = Math.round((baseVal * conditionFactor * 1.06) / 100) * 100;

      tradeEstimateBox.innerHTML = `
        <div class="estimate-result-card">
          <div class="section-tag" style="color: #2563eb; background: rgba(37, 99, 235, 0.08);">Instant Market Appraisal</div>
          <h3 class="car-model-name">${year} ${make} ${model}</h3>
          <div class="estimate-val-range">$${estLow.toLocaleString()} – $${estHigh.toLocaleString()}</div>
          <p style="font-size: 0.88rem; color: #64748b;">Estimated trade-in equity value based on current Pennsauken &amp; Tri-State market data.</p>
          
          <div class="estimate-details-grid">
            <div><strong>Condition:</strong> ${condition}</div>
            <div><strong>Mileage:</strong> ${mileage.toLocaleString()} mi</div>
            <div><strong>Inspection:</strong> 150-Point Audit</div>
            <div><strong>Equity Bonus:</strong> +10% towards inventory</div>
          </div>

          <div style="display: flex; gap: 10px;">
            <button class="btn btn-primary w-100" data-page="inventory">Browse Vehicles to Apply Equity</button>
            <button class="btn btn-outline w-100" id="schedule-appraisal-btn">Schedule Lot Appraisal</button>
          </div>
        </div>
      `;

      showToast(`Estimated market appraisal generated for your ${year} ${make}.`);
      audioEngine.playClick();
    });
  }

  // --------------------------------------------------------------------------
  // 9. MODAL FORMS & CONTACT HANDLERS
  // --------------------------------------------------------------------------
  const preorderModal = document.getElementById('preorder-modal');
  const closePreorderBtn = document.getElementById('close-preorder-btn');
  const openPreorderBtn = document.getElementById('open-preorder-modal');
  const openPrequalFinancingBtn = document.getElementById('open-financing-prequal-btn');

  if (openPreorderBtn && preorderModal) {
    openPreorderBtn.addEventListener('click', () => preorderModal.classList.add('active'));
  }
  if (openPrequalFinancingBtn && preorderModal) {
    openPrequalFinancingBtn.addEventListener('click', () => preorderModal.classList.add('active'));
  }
  if (closePreorderBtn && preorderModal) {
    closePreorderBtn.addEventListener('click', () => preorderModal.classList.remove('active'));
  }

  const testdriveModal = document.getElementById('testdrive-modal');
  const closeTestdriveBtn = document.getElementById('close-testdrive-btn');
  if (closeTestdriveBtn && testdriveModal) {
    closeTestdriveBtn.addEventListener('click', () => testdriveModal.classList.remove('active'));
  }

  // Preorder form submit
  const orderForm = document.getElementById('order-form');
  if (orderForm) {
    orderForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (preorderModal) preorderModal.classList.remove('active');
      showToast('Pre-approval application received. A Northstar finance director will contact you shortly.');
      audioEngine.revEngine();
    });
  }

  // Test drive form submit
  const testdriveForm = document.getElementById('testdrive-form');
  if (testdriveForm) {
    testdriveForm.addEventListener('submit', (e) => {
      e.preventDefault();
      if (testdriveModal) testdriveModal.classList.remove('active');
      showToast('Test drive appointment confirmed. Your vehicle will be staged for arrival.');
      audioEngine.playClick();
    });
  }

  // Contact form submit
  const contactForm = document.getElementById('contact-form');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      contactForm.reset();
      showToast('Inquiry received. A Northstar client advisor will contact you within 2 showroom hours.');
      audioEngine.playClick();
    });
  }

  // Close modals on backdrop click
  window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal-backdrop')) {
      e.target.classList.remove('active');
    }
  });

  // --------------------------------------------------------------------------
  // LIQUID GLASS ENGINE — initialize WebGL glass effects
  // Small delay to allow fonts and layout to settle first
  // --------------------------------------------------------------------------
  setTimeout(() => {
    initAllGlass().catch(err => {
      console.warn('[LiquidGlass] Initialization error:', err);
    });
  }, 300);
});
