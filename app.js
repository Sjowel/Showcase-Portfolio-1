(() => {
  const sheet = document.querySelector('.sheet.s4');
  const aboutTpl = document.getElementById('about-template');

  let open = false;
  let animating = false;
  let touchStartY = 0;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const OPEN_DURATION  = prefersReduced ? 0 : 820;
  const CLOSE_DURATION = prefersReduced ? 0 : 350;

  function ensureBackdrop(){
    let bd = document.querySelector('.backdrop');
    if (!bd){
      bd = document.createElement('div');
      bd.className = 'backdrop';
      document.body.appendChild(bd);
    }
    return bd;
  }

  function openSheet(){
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
    closeBtn?.addEventListener('click', closeSheet);
    backdrop.addEventListener('click', closeSheet);
    document.addEventListener('keydown', onKey);

    setTimeout(() => { open = true; animating = false; }, OPEN_DURATION);
  }

  function closeSheet(){
    if (!open || animating) return;
    animating = true;

    const backdrop = document.querySelector('.backdrop');
    const content = sheet.querySelector('.sheet-content');

    content?.classList.remove('show');
    backdrop?.classList.remove('show');
    sheet.classList.remove('expand');

    setTimeout(() => {
      content?.remove();
      document.body.classList.remove('lock');
      document.removeEventListener('keydown', onKey);
      open = false;
      animating = false;
    }, CLOSE_DURATION);
  }

  function onKey(e){ if (e.key === 'Escape') closeSheet(); }
  function atTop(){ return window.scrollY < 20; }

  // Optioneel: omlaag scrollen aan de top -> ga naar #projects (zelfde pagina)
  function maybeScrollToProjects(){
    const projects = document.getElementById('projects');
    if (projects) projects.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ---------------- Scroll / Swipe ---------------- */

  // Muis/trackpad: niet meer openSheet() via scroll!
  window.addEventListener('wheel', (e) => {
    if (open && e.deltaY < -8) { 
      closeSheet();
      return;
    }
    if (!open && e.deltaY > 8 && atTop()) {
      // als je wilt dat omlaag scrolt naar projecten:
      maybeScrollToProjects();
    }
  }, { passive: true });

  // Touch: geen auto-open; wel sluiten bij swipe omlaag
  window.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    const dy = touchStartY - e.touches[0].clientY;
    if (open && dy < -18) { 
      closeSheet();
      return;
    }
    if (!open && dy > 18 && atTop()) {
      // naar projects op dezelfde pagina (optioneel)
      maybeScrollToProjects();
    }
  }, { passive: true });

  /* ---------------- Alleen via klik openen ---------------- */
  // Nav "About me"
  document.querySelectorAll('nav a').forEach(a => {
    const href = a.getAttribute('href') || '';
    if (href === '#about' || /about/i.test(a.textContent || '')){
      a.addEventListener('click', (ev) => {
        ev.preventDefault();
        openSheet();
      });
    }
  });

  // "Learn more about me" link/button
  document.querySelectorAll('a.more, a[href="#about"]').forEach(a => {
    a.addEventListener('click', (ev) => {
      ev.preventDefault();
      openSheet();
    });
  });
})();
