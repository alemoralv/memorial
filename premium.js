/* Page-local depth and navigation. No credentials or cloud writes here. */
(function () {
  'use strict';
  var hero = document.getElementById('ella');
  var quiet = matchMedia('(prefers-reduced-motion: reduce)');
  var narrow = matchMedia('(max-width: 1080px)');
  // A phone's opening can grow with type size; a fixed viewport must not crop it.
  if (quiet.matches || narrow.matches) hero.setAttribute('data-sc-act', 'flow');
  var nav = document.querySelector('.idx');
  var toggle = document.querySelector('.idx__toggle');
  function closeMenu(restore) {
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.querySelector('span').textContent = '+';
    if (restore) toggle.focus();
  }
  toggle.addEventListener('click', function () {
    var open = toggle.getAttribute('aria-expanded') !== 'true';
    nav.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.querySelector('span').textContent = open ? '−' : '+';
  });
  nav.addEventListener('click', function (event) {
    var link = event.target.closest('a');
    if (!link) return;
    closeMenu(false);
    // Hand keyboard focus to the destination before collapsing the menu.
    var target = document.querySelector(link.getAttribute('href'));
    if (target) { target.setAttribute('tabindex', '-1'); target.focus({preventScroll:true}); }
  });
  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) closeMenu(true);
  });
  document.addEventListener('click', function (event) {
    if (!nav.contains(event.target)) closeMenu(false);
  });
  narrow.addEventListener('change', function () { closeMenu(false); });
  var queued = false;
  function depth() {
    queued = false;
    if (quiet.matches || narrow.matches) {
      hero.style.setProperty('--hero-p','0');
      return;
    }
    var rect = hero.getBoundingClientRect();
    if (rect.bottom < 0 || rect.top > innerHeight) return;
    var progress = Math.max(0, Math.min(1, -rect.top / Math.max(1, rect.height - innerHeight)));
    hero.style.setProperty('--hero-p', progress.toFixed(4));
    hero.setAttribute('data-sc-verify-state', progress.toFixed(3));
  }
  function schedule() { if (!queued) { queued = true; requestAnimationFrame(depth); } }
  window.addEventListener('scroll', schedule, {passive:true});
  window.addEventListener('resize', schedule, {passive:true});
  quiet.addEventListener('change', schedule);
  var fine = matchMedia('(hover:hover) and (pointer:fine)');
  hero.addEventListener('pointermove', function (event) {
    if (!fine.matches || quiet.matches || narrow.matches) return;
    var rect=hero.getBoundingClientRect();
    hero.style.setProperty('--pointer-x', ((event.clientX / innerWidth - .5) * 2).toFixed(3));
    hero.style.setProperty('--pointer-y', ((event.clientY - rect.top) / innerHeight - .5).toFixed(3));
  }, {passive:true});
  hero.addEventListener('pointerleave', function () {
    hero.style.setProperty('--pointer-x','0'); hero.style.setProperty('--pointer-y','0');
  });
  document.getElementById('velita').addEventListener('click', function () { this.classList.add('is-lit'); });
  // A keyboard-visible equivalent of clicking the photograph to open the show.
  var frame=document.getElementById('alb-frame');
  frame.setAttribute('role','button'); frame.setAttribute('tabindex','0');
  frame.setAttribute('aria-label','Abrir el pase de fotografías');
  frame.addEventListener('keydown', function (event) {
    if (event.key==='Enter' || event.key===' ') { event.preventDefault(); frame.click(); }
  });
  schedule();
})();

// Tab stays in the photo viewer; Escape and focus restoration belong to memorial.js.
(function () {
  var dialog = document.getElementById('lb');
  dialog.addEventListener('keydown', function (event) {
    if (event.key !== 'Tab' || !dialog.hasAttribute('open')) return;
    var controls = Array.from(dialog.querySelectorAll('button, video[controls], [tabindex="0"]')).filter(function (el) { return el.getClientRects().length; });
    var first = controls[0], last = controls[controls.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  });
})();

/* Recompose the opening when a window crosses the phone/tablet breakpoint. */
(function () {
  var hero=document.getElementById('ella'), stage=hero.querySelector('[data-sc-stage]');
  var narrow=matchMedia('(max-width:1080px)'), quiet=matchMedia('(prefers-reduced-motion:reduce)');
  function resizeHero() {
    var pin=!(narrow.matches || quiet.matches);
    hero.setAttribute('data-sc-act',pin?'pin':'flow');
    hero.setAttribute('data-sc-span','1.65');
    hero.classList.toggle('sc-act--pinned',pin);
    stage.classList.toggle('sc-stage',pin);
    if(!pin) hero.style.removeProperty('height');
    (window.ScrollCraft && ScrollCraft.instances || []).forEach(function (instance) {
      var act=instance.acts.find(function (a) {return a.el===hero;});
      if(act) {act.pinned=pin;act.device=pin?'pin':'flow';act.stage=pin?stage:null;act.span=1.65;instance.layout();}
    });
  }
  narrow.addEventListener('change',resizeHero);
  quiet.addEventListener('change',resizeHero);
})();
