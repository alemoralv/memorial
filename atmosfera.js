/* Page-local atmosphere. No API, credentials, uploads, or cloud writes. */
(function () {
  'use strict';
  var ground = document.querySelector('.atmosfera');
  if (!ground) return;
  var canvas = ground.querySelector('canvas'), ctx = canvas.getContext('2d');
  var quiet = matchMedia('(prefers-reduced-motion: reduce)');
  var fine = matchMedia('(hover: hover) and (pointer: fine)');
  var narrow = matchMedia('(max-width: 1080px)');
  var particles = [], frame = 0, queued = false, rects = [];
  var pointer = { x:innerWidth / 2, y:innerHeight / 2 };
  var last = null, previousTime = 0;

  function updateGround() {
    queued = false;
    var span = Math.max(1, document.documentElement.scrollHeight - innerHeight);
    var p = Math.max(0, Math.min(1, scrollY / span));
    var shift = quiet.matches || narrow.matches ? 0 : (p - .5) * 100;
    ground.style.setProperty('--papel-y', shift.toFixed(2) + 'px');
    ground.style.setProperty('--luz-x', quiet.matches || !fine.matches ? '0px' : ((pointer.x / innerWidth - .5) * 12).toFixed(2) + 'px');
    // Cut the canvas out around imagery and reading surfaces, including images
    // arriving later from the family's contributions. DOM stacking is a second
    // independent guard: the entire canvas lives below main and the viewer.
    rects = Array.from(document.querySelectorAll('main img, main video, main h1, main h2, .plate, .idx, .hoja, .lb[open]')).map(function (el) {
      return el.getBoundingClientRect();
    }).filter(function (r) { return r.width && r.height && r.bottom > 0 && r.top < innerHeight; });
    if (particles.length) start();
  }
  function schedule() {
    if (!queued) { queued = true; requestAnimationFrame(updateGround); }
  }
  function resize() {
    var dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(innerWidth * dpr);
    canvas.height = Math.round(innerHeight * dpr);
    if (ctx) ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    schedule();
  }
  function stop() {
    if (frame) cancelAnimationFrame(frame);
    frame = 0; previousTime = 0; particles = []; last = null;
    if (ctx) ctx.clearRect(0, 0, innerWidth, innerHeight);
  }
  function draw(time) {
    frame = 0;
    if (!ctx || quiet.matches || !fine.matches || document.hidden) { stop(); return; }
    var dt = Math.min((time - (previousTime || time)) / 1000, .04);
    previousTime = time;
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    particles = particles.filter(function (seed) { return time - seed.born < 1900; });
    particles.forEach(function (seed) {
      var age = (time - seed.born) / 1900;
      seed.x += seed.vx * dt; seed.y += seed.vy * dt;
      ctx.save(); ctx.translate(seed.x, seed.y); ctx.rotate(seed.angle + age * .45);
      ctx.globalAlpha = Math.sin(Math.PI * age) * .32;
      ctx.strokeStyle = seed.rose ? '#962F4F' : '#17301F';
      ctx.lineWidth = .75;
      ctx.beginPath(); ctx.moveTo(0, 7); ctx.quadraticCurveTo(2, 0, 0, -7); ctx.stroke();
      // A delicate dandelion seed, recalling Marilú's opening photograph.
      for (var i = 0; i < 7; i++) {
        var a = Math.PI + i * Math.PI / 6;
        ctx.beginPath(); ctx.moveTo(0, -7);
        ctx.lineTo(Math.cos(a) * 7, -7 + Math.sin(a) * 6); ctx.stroke();
      }
      ctx.restore();
    });
    rects.forEach(function (r) { ctx.clearRect(r.left - 20, r.top - 20, r.width + 40, r.height + 40); });
    if (particles.length) frame = requestAnimationFrame(draw);
    else previousTime = 0;
  }
  function start() { if (!frame && ctx) frame = requestAnimationFrame(draw); }
  document.addEventListener('pointermove', function (event) {
    if (quiet.matches || !fine.matches || event.pointerType === 'touch') return;
    pointer.x = event.clientX; pointer.y = event.clientY;
    schedule();
    if (event.target.closest('img,video,a,button,input,textarea,.ella__plate,.alb__frame,.libro__marco,.idx,.hoja,.lb,.plate')) { last = null; return; }
    var now = performance.now();
    if (!last) { last = { x:pointer.x, y:pointer.y, t:now }; return; }
    var dx = pointer.x - last.x, dy = pointer.y - last.y;
    if (Math.hypot(dx, dy) < 24 || now - last.t < 55) return;
    particles.push({ x:pointer.x, y:pointer.y, vx:Math.max(-14,Math.min(14,dx * .2)), vy:-12 + Math.max(-6,Math.min(6,dy * .08)), angle:dx * .008, born:now, rose:particles.length % 4 === 0 });
    if (particles.length > 18) particles.shift();
    last = { x:pointer.x, y:pointer.y, t:now }; start();
  }, { passive:true });
  document.documentElement.addEventListener('pointerleave', function () { last = null; });
  document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else schedule(); });
  document.addEventListener('load', schedule, true);
  window.addEventListener('scroll', schedule, { passive:true });
  window.addEventListener('resize', resize, { passive:true });
  [quiet, fine, narrow].forEach(function (query) { query.addEventListener('change', function () { stop(); schedule(); }); });
  resize();
})();
