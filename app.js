(() => {
  const sheet = document.querySelector('.sheet.s4');
  const aboutTpl = document.getElementById('about-template');

  let open = false;
  let animating = false;
  let touchStartY = 0;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const OPEN_DURATION = prefersReduced ? 0 : 820;

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

    setTimeout(() => {
      open = true;
      animating = false;
    }, OPEN_DURATION);
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
    }, prefersReduced ? 0 : 350);
  }

  function onKey(e){
    if (e.key === 'Escape') closeSheet();
  }

  function atTop(){ return window.scrollY < 20; }

  /* ---------------- Scroll en Swipe logica ---------------- */

  // Scroll met muis/trackpad
  window.addEventListener('wheel', (e) => {
    // naar beneden = openen
    if (e.deltaY > 8 && atTop()) openSheet();
    // naar boven = sluiten (alleen als open)
    if (e.deltaY < -8 && open) closeSheet();
  }, { passive: true });

  // Touch swipe op mobiel
  window.addEventListener('touchstart', (e) => {
    touchStartY = e.touches[0].clientY;
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    const dy = touchStartY - e.touches[0].clientY;
    // swipe omhoog (vinger omlaag) = open
    if (dy > 18 && atTop()) openSheet();
    // swipe omlaag (vinger omhoog) = sluit
    if (dy < -18 && open) closeSheet();
  }, { passive: true });

  // Klik op "About me" in navigatie opent het blaadje ook
  document.querySelectorAll('nav a').forEach(a => {
    if (a.getAttribute('href') === '#about' || /about/i.test(a.textContent || '')){
      a.addEventListener('click', (ev) => {
        ev.preventDefault();
        openSheet();
      });
    }
  });
})();
