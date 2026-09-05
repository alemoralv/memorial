/* Local Scrollcraft choreography. Generated scenery never becomes archive data. */
(function () {
  'use strict';
  var root = document.querySelector('.paisajes');
  if (!root) return;
  var quiet = matchMedia('(prefers-reduced-motion: reduce)');
  var phone = matchMedia('(max-width:640px)');
  var fine = matchMedia('(hover:hover) and (pointer:fine)');
  var connection = navigator.connection;
  var scenes = {}, sections = [], queued = false, px = 0, py = 0;
  var clamp = function (n) { return Math.max(0, Math.min(1, n)); };
  var smooth = function (n) { n = clamp(n); return n * n * (3 - 2 * n); };
  root.querySelectorAll('[data-paisaje]').forEach(function (el) {
    var video = el.querySelector('video');
    var scene = scenes[el.dataset.paisaje] = { el:el, video:video, ready:false, target:0, failed:false };
    var image = el.querySelector('img');
    image.decode().then(function () { scene.ready = true; schedule(); }).catch(function () {});
    if (video) {
      video.addEventListener('loadeddata', schedule);
      video.addEventListener('seeked', function () {
        if (video.readyState >= 2 && !quiet.matches) video.classList.add('is-decoded');
        schedule();
      });
      video.addEventListener('error', function () { scene.failed = true; video.classList.remove('is-decoded'); });
    }
  });
  var map = { ella:'paris', vida:'montana', album:'montana', cancion:'montana', muro:'lago', cocina:'cocina', cierre:'lago', final:'montana' };
  function measure() {
    sections = Array.from(document.querySelectorAll('main > section[id]')).map(function (el) {
      return { el:el, id:el.id, scene:map[el.id], top:el.getBoundingClientRect().top + scrollY, height:el.offsetHeight };
    });
    schedule();
  }
  function film(scene, visible, progress) {
    var v = scene.video;
    if (!v) return;
    if (quiet.matches || connection && connection.saveData || document.hidden) {
      v.classList.remove('is-decoded'); return;
    }
    if (!visible || scene.failed) return;
    if (!v.getAttribute('src')) {
      v.src = phone.matches ? v.dataset.srcMobile : v.dataset.src;
      v.load();
    }
    if (!Number.isFinite(v.duration) || v.readyState < 2) return;
    scene.target = clamp(progress) * Math.max(0, v.duration - .055);
    if (!v.seeking && Math.abs(v.currentTime - scene.target) > .035) v.currentTime = scene.target;
    else if (!v.seeking) v.classList.add('is-decoded');
  }
  function update() {
    queued = false;
    if (!sections.length || document.hidden) return;
    var marker = scrollY + innerHeight * .52, index = 0;
    sections.forEach(function (s, i) { if (s.top <= marker) index = i; });
    var current = sections[index], previous = sections[Math.max(0,index - 1)];
    var blend = quiet.matches ? 1 : smooth((marker - current.top) / (innerHeight * .48));
    var weights = {};
    weights[previous.scene] = 1 - blend;
    weights[current.scene] = (weights[current.scene] || 0) + blend;
    if (!scenes[current.scene].ready) { weights[current.scene] = 0; weights[previous.scene] = 1; }
    var state = [];
    Object.keys(scenes).forEach(function (name) {
      var scene = scenes[name], weight = weights[name] || 0;
      var section = name === current.scene ? current : previous;
      var p = clamp((scrollY + innerHeight - section.top) / Math.max(innerHeight, section.height + innerHeight));
      var travel = quiet.matches ? 0 : (p - .5) * (phone.matches ? 20 : 68);
      var x = quiet.matches || !fine.matches ? 0 : px * 7;
      var y = quiet.matches || !fine.matches ? 0 : py * 5;
      scene.el.style.opacity = weight.toFixed(3);
      scene.el.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + (travel+y).toFixed(2) + 'px,0) scale(' + (quiet.matches ? 1 : 1.015 + p * .025).toFixed(4) + ')';
      film(scene, weight > .01, p);
      if (weight > .01) state.push(name + ':' + weight.toFixed(2) + ':' + travel.toFixed(1) + ':' + (scene.video ? scene.video.currentTime.toFixed(2) : 'still'));
    });
    root.style.setProperty('--near-x', (quiet.matches ? 0 : -px * 15).toFixed(1) + 'px');
    root.style.setProperty('--near-y', (quiet.matches ? 0 : -py * 10).toFixed(1) + 'px');
    root.dataset.scVerifyState = state.join('|');
    root.dataset.scVerifyHold = quiet.matches ? 'true' : 'false';
  }
  function schedule() { if (!queued) { queued = true; requestAnimationFrame(update); } }
  addEventListener('scroll', schedule, { passive:true });
  addEventListener('resize', measure, { passive:true });
  addEventListener('pointermove', function (e) {
    if (!fine.matches || quiet.matches) return;
    px = e.clientX / innerWidth - .5; py = e.clientY / innerHeight - .5; schedule();
  }, { passive:true });
  document.addEventListener('visibilitychange', schedule);
  [quiet,phone,fine].forEach(function (query) { query.addEventListener('change', measure); });
  if (connection) connection.addEventListener('change', schedule);
  new ResizeObserver(measure).observe(document.querySelector('main'));
  document.addEventListener('load', measure, true);
  measure();
})();
