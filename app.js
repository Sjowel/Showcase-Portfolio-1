(() => {
  const sheet = document.querySelector('.sheet.s4');
  const aboutTpl = document.getElementById('about-template');

  let open = false;
  let animating = false;
  let touchStartY = 0;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const OPEN_DURATION  = prefersReduced ? 0 : 820;
  const CLOSE_DURATION = prefersReduced ? 0 : 350;

  /* ---------------- Popup (About) alleen via klik ---------------- */

  function ensureBackdrop() {
    let bd = document.querySelector('.backdrop');
    if (!bd) {
      bd = document.createElement('div');
      bd.className = 'backdrop';
      document.body.appendChild(bd);
    }
    return bd;
  }

  function openSheet() {
    if (open || animating || !sheet || !aboutTpl) return;
    animating = true;
    document.body.classList.add('lock');

    const backdrop = ensureBackdrop();
    requestAnimationFrame(() => backdrop.classList.add('show'));

    const frag = aboutTpl.content.cloneNode(true);
    sheet.appendChild(frag);
    sheet.classList.add('expand');

    const content = sheet.querySelector('.sheet-content');
    requestAnimationFrame(() => content?.classList.add('show'));

    const closeBtn = sheet.querySelector('.sheet-close');
    closeBtn?.addEventListener('click', closeSheet, { once: true });
    backdrop.addEventListener('click', closeSheet, { once: true });
    document.addEventListener('keydown', onKey);

    setTimeout(() => {
      open = true;
      animating = false;
    }, OPEN_DURATION);
  }

  function closeSheet() {
    if (!open || animating) return;
    animating = true;

    const backdrop = document.querySelector('.backdrop');
    const content  = sheet.querySelector('.sheet-content');

    content?.classList.remove('show');
    backdrop?.classList.remove('show');
    sheet.classList.remove('expand');

    setTimeout(() => {
      content?.remove();
      backdrop?.remove(); // belangrijk: haal overlay weg zodat clicks weer werken
      document.body.classList.remove('lock');
      document.removeEventListener('keydown', onKey);
      open = false;
      animating = false;
    }, CLOSE_DURATION);
  }

  function onKey(e) { if (e.key === 'Escape') closeSheet(); }

  /* ---------------- Scroll gedrag (geen auto-open) ---------------- */

  function atTop() { return window.scrollY < 20; }

  // Optioneel: vanaf top naar beneden -> scroll naar projects (zelfde pagina)
  function maybeScrollToProjects() {
    const projects = document.getElementById('projects');
    if (projects) projects.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Muis/trackpad
  window.addEventListener('wheel', (e) => {
    if (open && e.deltaY < -8) { // omhoog scrollen sluit popup
      closeSheet();
      return;
    }
    if (!open && e.deltaY > 8 && atTop()) {
      // (optioneel) omlaag aan top -> naar projects
      maybeScrollToProjects();
    }
  }, { passive: true });

  // Touch
  window.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    const dy = touchStartY - e.touches[0].clientY; // >0 = swipe omhoog (scroll down)
    if (open && dy < -18) { // swipe omlaag sluit popup
      closeSheet();
      return;
    }
    if (!open && dy > 18 && atTop()) {
      // (optioneel) swipe omhoog aan top -> naar projects
      maybeScrollToProjects();
    }
  }, { passive: true });

  /* ---------------- Alleen via klik openen ---------------- */

  // Nav "About me"
  document.querySelectorAll('nav a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href === '#about' || /about/i.test(a.textContent || '')) {
      a.addEventListener('click', (ev) => {
        ev.preventDefault();
        openSheet();
      });
    }
  });

  // "Learn more about me" link/knop
  document.querySelectorAll('a.more, a[href="#about"]').forEach(a => {
    a.addEventListener('click', (ev) => {
      ev.preventDefault();
      openSheet();
    });
  });

  /* ---------------- Nav-underline: sectie met meeste zichtbare hoogte ---------------- */

  const navLinks   = Array.from(document.querySelectorAll('.nav a'));
  const homeEl     = document.getElementById('home');
  const projectsEl = document.getElementById('projects');
  const sections   = [homeEl, projectsEl].filter(Boolean);

  function linkMatchesId(link, id) {
    const href = (link.getAttribute('href') || '').trim();
    if (id === 'home') return href === '#home' || href === '#';
    return href === `#${id}`;
  }

  function getVisibleHeight(el) {
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    const vhTop = 0;
    const vhBottom = window.innerHeight;
    const visibleTop = Math.max(rect.top, vhTop);
    const visibleBottom = Math.min(rect.bottom, vhBottom);
    return Math.max(0, visibleBottom - visibleTop);
  }

  let currentActive = null;
  let ticking = false;

  function updateActiveByVisibleArea() {
    ticking = false;
    if (!sections.length) return;

    const homeVis = getVisibleHeight(homeEl);
    const projVis = getVisibleHeight(projectsEl);

    // Kies de sectie met grootste zichtbare hoogte; bij (bijna) gelijk -> Home
    let bestId = null;
    if (homeVis === 0 && projVis === 0) {
      // fallback: gebruik scrollY — dicht bij top = home
      bestId = (window.scrollY < (homeEl?.offsetHeight || 600) * 0.6) ? 'home' : 'projects';
    } else if (homeVis >= projVis - 1) { // -1 om jitter te voorkomen
      bestId = 'home';
    } else {
      bestId = 'projects';
    }

    if (bestId && bestId !== currentActive) {
      currentActive = bestId;
      navLinks.forEach(link => {
        link.classList.toggle('active', linkMatchesId(link, bestId));
      });
    }
  }

  function requestNavUpdate() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(updateActiveByVisibleArea);
    }
  }

  // Init + live updates
  ['scroll', 'resize'].forEach(evt => window.addEventListener(evt, requestNavUpdate, { passive: true }));
  window.addEventListener('load', requestNavUpdate, { passive: true });
  document.addEventListener('DOMContentLoaded', requestNavUpdate, { passive: true });
  updateActiveByVisibleArea();
  /* ---------------- Swipe-hint alleen tonen op Home ---------------- */
const swipeHint = document.querySelector('.swipe');

function toggleSwipeHint() {
  const projects = document.getElementById('projects');
  if (!swipeHint || !projects) return;

  const rect = projects.getBoundingClientRect();
  const screenH = window.innerHeight;

  // Zodra de projectsectie in beeld komt (of bijna)
  if (rect.top < screenH * 0.8) {
    swipeHint.style.opacity = '0';
    swipeHint.style.pointerEvents = 'none';
  } else {
    swipeHint.style.opacity = '0.85';
    swipeHint.style.pointerEvents = 'none';
  }
}

['scroll', 'resize', 'load'].forEach(evt =>
  window.addEventListener(evt, toggleSwipeHint, { passive: true })
);
toggleSwipeHint();

})();
