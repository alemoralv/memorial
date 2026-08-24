/* ===========================================================================
   Memorial · María Luz Galindo Rodríguez
   ---------------------------------------------------------------------------
   Grammar: gallery / catalog. The page is one collection of objects, each one
   labelled the same way, and the reader walks it.

   The one bespoke interaction is la hoja de contactos: every photograph the
   reader scrolls past takes a cell in a strip fixed to the bottom edge, the
   strip is the page's index, and its last cell is always empty because the
   collection is not finished.

   Data. Two paths, and the split is deliberate:
     · the small collections come through the Firestore SDK with onSnapshot,
       so a memory somebody writes appears for everyone immediately;
     · `fotos` does NOT, because every document in it carries a base64 JPEG
       and a live snapshot of the whole collection is megabytes on load. It is
       read over REST with a field mask, so the page fetches captions and
       contributor names first and the image bytes only when a photograph is
       actually about to be seen.
   ========================================================================= */
(function () {
  "use strict";

  var FB = {
    apiKey: "AIzaSyAPfk0_DweyLwoRy_zKmNvrwsUBgHXagak",
    authDomain: "memorial-marilu.firebaseapp.com",
    projectId: "memorial-marilu",
    storageBucket: "memorial-marilu.firebasestorage.app",
    messagingSenderId: "994871922156",
    appId: "1:994871922156:web:3e337d06e96aed65f204c9",
    measurementId: "G-2PFL19FZE2"
  };
  var REST = "https://firestore.googleapis.com/v1/projects/memorial-marilu/databases/(default)/documents/";

  // Candles lit before the counter existed. Real, not decorative.
  var VELITAS_BASE = 128;

  // How many photographs are shown large in the album act. The rest arrive in
  // the contact sheet when the run ends, which is the moment the page is for.
  var CORRIDA = 51;
  var FIN_CORRIDA = 0.88;   // act progress where the run ends and the flood lands

  var MESES = ["enero","febrero","marzo","abril","mayo","junio","julio",
               "agosto","septiembre","octubre","noviembre","diciembre"];

  /* `foto` sólo se pone donde la fotografía corresponde de verdad al momento:
     su boda es su boda, y las dos décadas son las dos únicas fechas que el
     archivo registra por su cuenta. Nada aquí empareja por parecido. */
  var MOMENTOS_SEMILLA = [
    { id: "s1", date: "1949-01-21", title: "Nace María Luz",
      text: "Llega al mundo en la Ciudad de México." },
    { id: "s2", date: "1968-09-20", title: "Se casa",
      text: "El 20 de septiembre empieza a construir su familia.",
      foto: "marilu-el-dia-de-su-boda" },
    { id: "s3", date: "1974-08-31", title: "Nace su primera hija",
      text: "Se vuelve mamá." },
    { id: "d70", date: "1975-01-01", title: "Los años setenta", decada: true,
      text: "Una de las dos décadas que el archivo fecha por su cuenta.",
      foto: "amigas-en-alberca-anos-70" },
    { id: "s4", date: "1977-04-09", title: "Nace su primer hijo",
      text: "La familia sigue creciendo." },
    { id: "d80", date: "1985-01-01", title: "Los años ochenta", decada: true,
      text: "La otra.", foto: "retrato-familiar-vintage-anos-80" },
    { id: "s5", date: "2026-07-01", title: "Fallece en la Ciudad de México",
      text: "El álbum se queda abierto." }
  ];

  var CANCIONES_SEMILLA = [
    { id: "song1", title: "Las Sevillanas", artist: "Folclore andaluz", base: 30 },
    { id: "song2", title: "Flowers", artist: "Miley Cyrus", base: 25 },
    { id: "song3", title: "Muchachita Consentida", artist: "Rayito Colombiano", base: 20 },
    { id: "song4", title: "A Contracorriente", artist: "Álvaro Soler y David Bisbal", base: 15 },
    { id: "song5", title: "Tie a Yellow Ribbon", artist: "Tony Orlando and Dawn", base: 10 },
    { id: "song6", title: "La Suavecita", artist: "Manduco", base: 6 }
  ];

  /* The twelve the album opens on. Curated rather than shuffled: the run is
     the peak of the page and it should read as an arc, not as a slideshow.
     Youth, then character, then the world, then conviction, then her interior
     life, then the people. After these the contributed photographs take over
     and the credits start carrying other people's names. */
  var CORRIDA_ARCHIVO = [
    // de joven
    "retrato-de-juventud-en-marco-de-madera",
    "boda-vintage-blanco-y-negro",
    "marilu-el-dia-de-su-boda",
    "dos-mujeres-junto-al-mar-vintage",
    "amigas-en-alberca-anos-70",
    "tres-amigas-riendo-foto-antigua",
    "retrato-familiar-vintage-anos-80",
    // madre
    "marilu-con-bebe-recien-nacido",
    "con-bebe-y-nieta-en-jardin",
    "retrato-familiar-en-el-jardin",
    // su carácter
    "marilu-con-cigarro-en-la-habana",
    "amigas-junto-a-auto-clasico-cuba",
    "entre-roosevelt-y-churchill-en-londres",
    "marilu-comiendo-hot-dog-en-ny",
    "marcha-el-ine-no-se-toca",
    // el mundo
    "bajo-la-aurora-boreal",
    "entre-fiordos-nevados",
    "marilu-en-bahia-halong-vietnam",
    "torii-naranjas-bajo-la-lluvia",
    "familia-con-impermeables-en-japon",
    "con-su-nieta-en-sacre-coeur",
    "familia-frente-a-convento-izamal",
    // adentro
    "apuntes-de-historia-del-arte",
    "libros-de-decoracion-en-repisa",
    // la fiesta
    "marilu-bailando-en-la-fiesta",
    "cantando-en-la-fiesta",
    "rompiendo-la-pinata",
    "gran-reunion-de-amigas-de-gala",
    "cumpleanos-con-amigas-bengala",
    // los suyos
    "con-su-esposo-en-un-cafe",
    "con-su-esposo-en-el-jardin-de-noche",
    "marilu-abrazada-por-sus-nietos",
    "atardecer-con-nietos-junto-al-mar",
    "un-cafe-con-su-nieta",
    "marilu-soplando-velas-de-cumpleanos"
  ];

  // ── estado ───────────────────────────────────────────────────────────────
  var S = {
    subidas: [],        // índice de las fotos que trajo la gente (sin bytes)
    srcs: {},           // id → dataURI, poblado bajo demanda
    recuerdos: [], momentos: [], recetas: [], lugares: [], lugaresNube: [],
    canciones: [], votos: {}, misVotos: [], velitas: VELITAS_BASE,
    tipo: "foto", foto: null, corrida: [], vistas: [], flood: false
  };
  var db = null;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var ARCH = (window.ARCHIVO || []).map(function (o) {
    return { k: "arch", id: o.s, c: o.c, f: o.f || "", w: o.w, h: o.h, v: o.v || null };
  });
  var ARCH_POR_ID = {};
  ARCH.forEach(function (o) { ARCH_POR_ID[o.id] = o; });

  function ls(k, fb) { try { var v = localStorage.getItem(k); return v ? JSON.parse(v) : fb; } catch (e) { return fb; } }
  function lsSet(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); }
  function fecha(d) {
    var p = String(d).split("-");
    if (p.length < 3) return d;
    return Number(p[2]) + " de " + (MESES[Number(p[1]) - 1] || "") + " de " + p[0];
  }

  /* El motor mide dónde empieza y acaba cada acto una sola vez, al montar.
     Aquí el contenido llega después, desde Firestore, y al llegar cambia la
     altura del documento: el muro crece, el riel de la vida gana nodos. Sin
     volver a medir, todos los actos que vienen debajo quedan desplazados y su
     progreso se calcula contra una posición que ya no existe, así que el riel
     de la quinta sala se quedaba parado en su posición final. `layout()` es la
     API que el motor expone justo para esto. */
  var remedirT;
  function remedir() {
    clearTimeout(remedirT);
    remedirT = setTimeout(function () {
      if (window.ScrollCraft && ScrollCraft.instances) {
        ScrollCraft.instances.forEach(function (i) { if (i && i.layout) i.layout(); });
      }
    }, 90);
  }

  var toastEl = $("#toast"), toastT;
  function toast(m) {
    toastEl.textContent = m; toastEl.classList.add("is-on");
    clearTimeout(toastT); toastT = setTimeout(function () { toastEl.classList.remove("is-on"); }, 3600);
  }

  // ── la fuente de cada objeto ─────────────────────────────────────────────
  function vistaSrc(o) { return o.k === "arch" ? "fotos/v/" + o.id + ".webp" : S.srcs[o.id] || ""; }
  function thumbSrc(o) { return o.k === "arch" ? "fotos/t/" + o.id + ".webp" : S.srcs[o.id] || ""; }
  function procedencia(o) {
    return o.k === "arch" ? "Archivo de la familia" : "Compartida por " + o.by;
  }

  // pide los bytes de una foto subida, una sola vez
  var pidiendo = {};
  function pedirSrc(id) {
    if (S.srcs[id]) return Promise.resolve(S.srcs[id]);
    if (pidiendo[id]) return pidiendo[id];
    pidiendo[id] = fetch(REST + "fotos/" + id + "?mask.fieldPaths=src")
      .then(function (r) { return r.json(); })
      .then(function (j) {
        var s = (j.fields && j.fields.src && j.fields.src.stringValue) || "";
        S.srcs[id] = s;
        llenarCelda(id, s);
        return s;
      })
      .catch(function () { return ""; });
    return pidiendo[id];
  }

  // La celda de la hoja se llena en cuanto los bytes existen, sin importar
  // quién los pidió: el proyector, el álbum o la propia hoja.
  function llenarCelda(id, src) {
    if (!src) return;
    var b = document.querySelector('.cell[data-id="gift:' + id + '"]');
    if (b && !b.firstChild) {
      var im = new Image(); im.src = src; im.alt = ""; im.decoding = "async";
      b.appendChild(im);
    }
  }

  // ── índice de fotos subidas, por REST y con máscara ──────────────────────
  function cargarSubidas() {
    return fetch(REST + "fotos?pageSize=300&mask.fieldPaths=label&mask.fieldPaths=author")
      .then(function (r) { return r.json(); })
      .then(function (j) {
        S.subidas = (j.documents || []).map(function (d) {
          var f = d.fields || {};
          return {
            k: "gift",
            id: d.name.split("/").pop(),
            c: (f.label && f.label.stringValue) || "Un recuerdo",
            by: (f.author && f.author.stringValue) || "alguien",
            t: d.createTime, f: ""
          };
        }).sort(function (a, b) { return a.t < b.t ? -1 : 1; });
        contar();
        armarCorrida();
      })
      .catch(function () { contar(); armarCorrida(); });
  }

  /* La corrida: doce del archivo y luego las que trajo la gente, de modo que
     el traspaso se vea en los pies de foto y no haya que anunciarlo. */
  function armarCorrida() {
    var a = CORRIDA_ARCHIVO.map(function (id) { return ARCH_POR_ID[id]; }).filter(Boolean);
    var g = S.subidas.slice(-(CORRIDA - a.length));
    if (!g.length) {  // sin fotos de la gente todavía: se completa con archivo
      var usados = {}; a.forEach(function (o) { usados[o.id] = 1; });
      g = ARCH.filter(function (o) { return !usados[o.id]; }).slice(0, CORRIDA - a.length);
    }
    S.corrida = a.concat(g);
    pintarCorrida();
  }

  /* Las fotos que trajo la gente viven como base64 dentro de su documento, así
     que cada una pesa cientos de kilobytes. Pedirlas todas al cargar eran dos
     megas antes de que nadie hubiera visto nada. Se piden conforme te acercas:
     la actual y las tres siguientes. */
  function asegurarSrc(i) {
    for (var k = i; k <= i + 3 && k < S.corrida.length; k++) {
      (function (o) {
        if (!o || o.k !== "gift" || S.srcs[o.id]) return;
        pedirSrc(o.id).then(function (src) {
          if (!src) return;
          var fig = $('.alb__slide[data-i="' + S.corrida.indexOf(o) + '"]', $("#alb-frame"));
          if (fig && !fig.firstChild) {
            var im = new Image();
            im.src = src; im.alt = o.c; im.decoding = "async";
            fig.appendChild(im);
          }
        });
      })(S.corrida[k]);
    }
  }

  function pintarCorrida() {
    var frame = $("#alb-frame");
    frame.onclick = function () { var o = S.corrida[albActual]; if (o) abrir(o); };
    frame.style.cursor = "zoom-in";
    frame.title = "Ver todas en pase automático";
    frame.innerHTML = S.corrida.map(function (o, i) {
      var src = vistaSrc(o);
      return '<figure class="alb__slide" data-i="' + i + '">' +
        (src ? '<img src="' + esc(src) + '" alt="' + esc(o.c) + '"' +
               (o.w ? ' width="' + o.w + '" height="' + o.h + '"' : "") +
               ' loading="' + (i < 3 ? "eager" : "lazy") + '" decoding="async">' : "") +
        "</figure>";
    }).join("");
    albMostrar(0, true);
    remedir();
  }

  // ── el álbum: el scroll es el que manda ──────────────────────────────────
  var albActual = -1;
  function albMostrar(i, forzar) {
    if (i === albActual && !forzar) return;
    albActual = i;
    var slides = $$(".alb__slide", $("#alb-frame"));
    slides.forEach(function (el, k) { el.classList.toggle("is-on", k === i); });
    var o = S.corrida[i];
    if (!o) return;
    asegurarSrc(i);
    $("#alb-t").textContent = o.c;
    var f = $("#alb-f");
    if (o.f) { f.textContent = o.f; f.hidden = false; } else { f.hidden = true; }
    var p = $("#alb-p");
    p.textContent = procedencia(o);
    p.classList.toggle("ced__p--gift", o.k === "gift");
    // la que sigue se precarga para que el paso no parpadee
    var sig = S.corrida[i + 1];
    if (sig && sig.k === "arch") { var im = new Image(); im.src = vistaSrc(sig); }
    /* La hoja es un registro de por dónde pasaste, así que se llena hasta
       aquí y no sólo con ésta: si alguien baja de golpe, las de en medio
       igual las pasó. */
    for (var j = 0; j <= i; j++) if (S.corrida[j]) sumarAHoja(S.corrida[j], j < i - 1);
    hojaMarcar(o);
    // dicho una vez, mientras todavía es noticia, y luego se quita de en medio
    if (i >= 3) { var h = $(".alb__hint"); if (h) h.classList.add("is-off"); }
  }

  // ── la hoja de contactos ─────────────────────────────────────────────────
  var hoja = $("#hoja"), strip = $("#hoja-strip"), hojaN = $("#hoja-n");
  var enHoja = {}, celdaVacia = null, obs = null;

  function celda(o) {
    var b = document.createElement("button");
    b.type = "button";
    b.className = "cell" + (o.k === "gift" ? " cell--gift" : "");
    b.dataset.id = o.k + ":" + o.id;
    b.setAttribute("role", "listitem");
    b.setAttribute("aria-label", o.c + ". " + procedencia(o) + ".");
    var src = thumbSrc(o);
    if (src) {
      b.innerHTML = '<img src="' + esc(src) + '" alt="" loading="lazy" decoding="async">';
    } else if (o.k === "gift") {
      // los bytes llegan cuando la celda se acerca a la vista
      if (obs) obs.observe(b);
    }
    b.addEventListener("click", function () { abrir(o); });
    return b;
  }

  function sumarAHoja(o, saltar) {
    var key = o.k + ":" + o.id;
    if (enHoja[key]) return;
    enHoja[key] = 1;
    var c = celda(o);
    if (saltar) c.style.animation = "none", c.style.opacity = "1";
    strip.insertBefore(c, celdaVacia);
    hojaN.textContent = Object.keys(enHoja).length;
  }

  function hojaMarcar(o) {
    var key = o.k + ":" + o.id;
    sumarAHoja(o);
    $$(".cell", strip).forEach(function (c) { c.classList.toggle("is-now", c.dataset.id === key); });
    var act = strip.querySelector(".is-now");
    if (act) {
      var l = act.offsetLeft - strip.clientWidth / 2 + act.offsetWidth / 2;
      strip.scrollTo({ left: l, behavior: prefiereQuieto() ? "auto" : "smooth" });
    }
  }

  /* El desborde. Cuando la corrida termina, entra el resto de la colección de
     golpe: es el cambio visual más grande de la página y cae justo donde el
     álbum deja de ser de una persona. */
  function desbordar() {
    if (S.flood) return;
    S.flood = true;
    var todo = ARCH.concat(S.subidas);
    var frag = document.createDocumentFragment(), n = 0;
    todo.forEach(function (o) {
      var key = o.k + ":" + o.id;
      if (enHoja[key]) return;
      enHoja[key] = 1;
      var c = celda(o);
      c.style.animationDelay = Math.min(n * 8, 700) + "ms";
      frag.appendChild(c); n++;
    });
    strip.insertBefore(frag, celdaVacia);
    hojaN.textContent = Object.keys(enHoja).length;
  }

  function crearVacia() {
    celdaVacia = document.createElement("button");
    celdaVacia.type = "button";
    celdaVacia.className = "cell cell--empty";
    celdaVacia.setAttribute("role", "listitem");
    celdaVacia.setAttribute("aria-label", "Falta tu fotografía. Subir una.");
    celdaVacia.title = "Falta la tuya";
    celdaVacia.textContent = "+";
    celdaVacia.addEventListener("click", function () { irAPlaca("foto"); });
    strip.appendChild(celdaVacia);
  }

  // ── el motor del acto del álbum ──────────────────────────────────────────
  function conectarAlbum() {
    var act = $("#album");
    var vivo = false, raf = 0;

    new IntersectionObserver(function (es) {
      vivo = es[0].isIntersecting;
      if (vivo) { hoja.classList.add("is-up"); asegurarSrc(albActual < 0 ? 0 : albActual); tick(); }
    }, { rootMargin: "40% 0px" }).observe(act);

    function tick() {
      var p = parseFloat(act.style.getPropertyValue("--sc-p")) || 0;
      var n = S.corrida.length;
      if (n) {
        var i = Math.min(n - 1, Math.floor((p / FIN_CORRIDA) * n));
        albMostrar(Math.max(0, i));
      }
      if (p >= FIN_CORRIDA) desbordar();
      if (vivo) raf = requestAnimationFrame(tick);
    }
  }

  /* ── el proyector ─────────────────────────────────────────────────────────
     Picar cualquier foto de la hoja de contactos (o la del álbum) abre el pase
     completo: las 190, en orden, avanzando solas desde la que picaste. Es lo
     contrario del defecto de la página: aquí bajar es tu trabajo, y el pase
     automático sólo existe cuando alguien lo pide, para sentarse a verlas. */
  var PASO = 5000;
  var lb = $("#lb"), lbVid = null, ultimoFoco = null;
  var proy = { lista: [], i: 0, timer: 0, corriendo: false };

  var lbImg = new Image();
  lbImg.alt = ""; lbImg.hidden = true;
  lb.insertBefore(lbImg, $("#lb .lb__cap"));

  function todasLasFotos() { return ARCH.concat(S.subidas); }

  function abrir(o) {
    var todas = todasLasFotos();
    var i = todas.findIndex(function (x) { return x.k === o.k && x.id === o.id; });
    abrirProyector(todas, i < 0 ? 0 : i);
  }

  function abrirProyector(lista, i) {
    ultimoFoco = document.activeElement;
    proy.lista = lista;
    lb.setAttribute("open", "");
    document.body.style.overflow = "hidden";
    irA(i);
    reanudar();
    $("#lb-x").focus();
  }

  function irA(i) {
    var n = proy.lista.length;
    if (!n) return;
    proy.i = ((i % n) + n) % n;
    var o = proy.lista[proy.i];
    pintarProyector(o);
    precargar(proy.i + 1);
    precargar(proy.i + 2);
  }

  function precargar(i) {
    var o = proy.lista[((i % proy.lista.length) + proy.lista.length) % proy.lista.length];
    if (!o) return;
    if (o.k === "gift") { pedirSrc(o.id); return; }
    var im = new Image(); im.src = vistaSrc(o);
  }

  function pintarProyector(o) {
    var poner = function (src) {
      if (proy.lista[proy.i] !== o) return;          // llegó tarde, ya pasamos
      if (lbVid) { lbVid.pause(); lbVid.remove(); lbVid = null; }
      if (o.v) {
        // el único vídeo del archivo: el pase se detiene y sigue cuando termina
        lbImg.hidden = true; lbImg.removeAttribute("src");
        pausar();
        lbVid = document.createElement("video");
        lbVid.src = "fotos/v/" + o.id + ".mp4";
        lbVid.poster = src; lbVid.controls = true; lbVid.playsInline = true;
        lbVid.addEventListener("ended", function () { siguiente(); reanudar(); });
        lb.insertBefore(lbVid, lbImg);
      } else if (src) {
        lbImg.src = src; lbImg.alt = o.c; lbImg.hidden = false;
      }
      $("#lb-t").textContent = o.c + (o.f ? " " + o.f : "");
      $("#lb-p").textContent = procedencia(o);
      $("#lb-p").classList.toggle("ced__p--gift", o.k === "gift");
      $("#lb-cuenta").textContent = (proy.i + 1) + " de " + proy.lista.length;
      $("#lb-barra").style.transform = "scaleX(" + ((proy.i + 1) / proy.lista.length) + ")";
    };
    if (o.k === "gift" && !S.srcs[o.id]) { lbImg.hidden = true; pedirSrc(o.id).then(poner); }
    else poner(vistaSrc(o));
  }

  function siguiente() { irA(proy.i + 1); }
  function anterior()  { irA(proy.i - 1); }

  function reanudar() {
    if (prefiereQuieto()) { pausar(); return; }   // sin movimiento no hay pase solo
    clearInterval(proy.timer);
    proy.corriendo = true;
    proy.timer = setInterval(function () { if (!lbVid) siguiente(); }, PASO);
    marcarPausa();
  }
  function pausar() {
    clearInterval(proy.timer); proy.corriendo = false; marcarPausa();
  }
  function alternarPausa() { proy.corriendo ? pausar() : reanudar(); }
  function marcarPausa() {
    var b = $("#lb-pausa");
    b.textContent = proy.corriendo ? "❚❚" : "▶";
    b.setAttribute("aria-label", proy.corriendo ? "Pausar el pase" : "Reanudar el pase");
    b.setAttribute("aria-pressed", String(!proy.corriendo));
  }

  function cerrar() {
    pausar();
    lb.removeAttribute("open");
    if (lbVid) { lbVid.pause(); lbVid.remove(); lbVid = null; }
    lbImg.hidden = true; lbImg.removeAttribute("src");
    document.body.style.overflow = "";
    if (ultimoFoco) ultimoFoco.focus();
  }

  $("#lb-x").addEventListener("click", cerrar);
  $("#lb-pausa").addEventListener("click", alternarPausa);
  $("#lb-sig").addEventListener("click", function () { siguiente(); if (proy.corriendo) reanudar(); });
  $("#lb-ant").addEventListener("click", function () { anterior(); if (proy.corriendo) reanudar(); });
  lb.addEventListener("click", function (e) { if (e.target === lb) cerrar(); });
  document.addEventListener("keydown", function (e) {
    if (!lb.hasAttribute("open")) return;
    if (e.key === "Escape") { cerrar(); }
    else if (e.key === "ArrowRight") { siguiente(); if (proy.corriendo) reanudar(); }
    else if (e.key === "ArrowLeft") { anterior(); if (proy.corriendo) reanudar(); }
    else if (e.key === " ") { e.preventDefault(); alternarPausa(); }
  });

  function prefiereQuieto() {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }

  // ── la nube ──────────────────────────────────────────────────────────────
  function nube() {
    try {
      if (typeof firebase === "undefined") return;
      if (!firebase.apps.length) firebase.initializeApp(FB);
      db = firebase.firestore();
    } catch (e) { db = null; return; }
    var q = function (t) { return function (e) { console.warn("nube (" + t + "):", (e && e.code) || e); }; };
    var arr = function (s) {
      var a = []; s.forEach(function (d) { a.push(Object.assign({ id: d.id }, d.data())); });
      a.sort(function (x, y) {
        return (x.t && x.t.toMillis ? x.t.toMillis() : 9e15) - (y.t && y.t.toMillis ? y.t.toMillis() : 9e15);
      });
      return a;
    };
    db.doc("contadores/velitas").onSnapshot(function (d) {
      S.velitas = VELITAS_BASE + ((d.exists && d.data().n) || 0); contar();
    }, q("velitas"));
    db.collection("recuerdos").onSnapshot(function (s) {
      S.recuerdos = arr(s); pintarMuro(); pintarCosas(); contar();
    }, q("recuerdos"));
    db.collection("momentos").onSnapshot(function (s) { S.momentos = arr(s); pintarVida(); }, q("momentos"));
    db.collection("recetas").onSnapshot(function (s) { S.recetas = arr(s); pintarCosas(); contar(); }, q("recetas"));
    db.collection("lugares").onSnapshot(function (s) { S.lugaresNube = arr(s); pintarCosas(); }, q("lugares"));
    db.collection("canciones").onSnapshot(function (s) {
      S.canciones = arr(s).map(function (c) { return { id: c.id, title: c.title, artist: c.artist, base: 0 }; });
      pintarCanciones(); contar();
    }, q("canciones"));
    db.collection("votos").onSnapshot(function (s) {
      var v = {}; s.forEach(function (d) { v[d.id] = (d.data() && d.data().n) || 0; });
      S.votos = v; pintarCanciones();
    }, q("votos"));
  }
  function stamp() { return firebase.firestore.FieldValue.serverTimestamp(); }
  function inc(n) { return firebase.firestore.FieldValue.increment(n); }

  function guardarLocal(k, campo, e) {
    var a = S[campo].concat([e]); S[campo] = a; lsSet(k, a);
  }

  // ── pintar ───────────────────────────────────────────────────────────────
  function pintarVida() {
    var todos = MOMENTOS_SEMILLA.concat(S.momentos).slice().sort(function (a, b) {
      return String(a.date).localeCompare(String(b.date));
    });
    var html = todos.map(function (e, i) {
      return '<div class="node ' + (i % 2 ? "node--down" : "node--up") +
        (e.decada ? " node--decada" : "") + '">' +
        (e.foto ? '<img src="fotos/t/' + esc(e.foto) + '.webp" alt="" loading="lazy" decoding="async">' : "") +
        '<p class="node__y">' + esc(String(e.date).slice(0, 4)) + "</p>" +
        "<h3>" + esc(e.title) + "</h3>" +
        (e.text ? "<p>" + esc(e.text) + "</p>" : "") +
        (e.kind === "user" ? '<p class="node__by">Lo puso ' + esc(e.author || "alguien") + "</p>" : "") +
        "</div>";
    }).join("");
    var end = $("#rail-end");
    var lead = $(".rail__lead");
    // se reinsertan los nodos entre la entrada y el cierre del riel
    $$(".node", $("#rail")).forEach(function (n) { n.remove(); });
    lead.insertAdjacentHTML("afterend", html);
    var n = document.querySelector('.idx [data-n="vida"]');
    if (n) n.textContent = todos.length;
    if (end) end.setAttribute("data-count", todos.length);
    remedir();
  }

  function pintarMuro() {
    var m = $("#muro-lista"), v = $("#muro-vacio");
    if (!S.recuerdos.length) { m.innerHTML = ""; v.hidden = false; remedir(); return; }
    v.hidden = true;
    m.innerHTML = S.recuerdos.slice().reverse().map(function (r) {
      return '<figure class="rec">' +
        (r.photo ? '<img src="' + esc(r.photo) + '" alt="" loading="lazy">' : "") +
        "<blockquote>" + esc(r.text) + "</blockquote>" +
        '<figcaption><b>' + esc(r.author || "Anónimo") + "</b>" +
        (r.rel ? " · " + esc(r.rel) : "") + (r.epoca ? " · " + esc(r.epoca) : "") +
        "</figcaption></figure>";
    }).join("");
    remedir();
  }

  /* Recetas y lugares comparten riel y esquema de cédula: en una colección
     todos los objetos se etiquetan igual, o dejan de leerse como colección. */
  function pintarCosas() {
    var rail = $("#rail-cosas");
    if (!rail) return;
    var lugares = S.lugaresNube.concat(
      S.recuerdos.filter(function (r) { return r.lugar; }).map(function (r) {
        return { name: r.lugar, author: r.author, epoca: r.epoca };
      }));

    var html = S.recetas.map(function (r) {
      return '<figure class="case"><div>' +
        (r.photo ? '<img src="' + esc(r.photo) + '" alt="' + esc(r.name) + '" loading="lazy">' : "") +
        '<p class="ced__t" style="font-size:var(--sc-t-lg)">' + esc(r.name) + "</p>" +
        (r.note ? '<p class="case__body">' + esc(r.note) + "</p>" : "") +
        '<p class="ced__p ced__p--gift">Compartida por ' + esc(r.author || "alguien") + "</p>" +
        "</div></figure>";
    }).join("") + lugares.map(function (l) {
      return '<figure class="case case--lug"><div>' +
        '<p class="ced__t">' + esc(l.name) + "</p>" +
        '<p class="ced__p' + (l.author ? " ced__p--gift" : "") + '">' +
        (l.author ? "Lo recordó " + esc(l.author) + (l.epoca ? ", " + esc(l.epoca) : "")
                  : esc(l.note || "Un lugar suyo")) + "</p></div></figure>";
    }).join("");

    $$(".case", rail).forEach(function (n) { n.remove(); });
    $(".rail__lead", rail).insertAdjacentHTML("afterend", html);
    remedir();
  }

  function pintarCanciones() {
    var todas = CANCIONES_SEMILLA.concat(S.canciones).map(function (s) {
      return { id: s.id, title: s.title, artist: s.artist,
               n: (s.base || 0) + (S.votos[s.id] || 0),
               mio: S.misVotos.indexOf(s.id) >= 0 };
    }).sort(function (a, b) { return b.n - a.n; });
    $("#songs").innerHTML = todas.map(function (s, i) {
      return '<div class="song"><span class="song__n">' + (i + 1) + "</span>" +
        '<div><p class="song__t">' + esc(s.title) + '</p><p class="song__a">' + esc(s.artist) + "</p></div>" +
        '<button class="vote" type="button" data-song="' + esc(s.id) + '" aria-pressed="' + s.mio + '" ' +
        'aria-label="Votar por ' + esc(s.title) + '">' + (s.mio ? "♥" : "♡") + " " + s.n + "</button></div>";
    }).join("");
    remedir();
  }

  function contar() {
    var n = {
      fotos: ARCH.length + S.subidas.length,
      recuerdos: S.recuerdos.length,
      recetas: S.recetas.length,
      canciones: CANCIONES_SEMILLA.length + S.canciones.length,
      velitas: S.velitas,
      personas: Object.keys(S.subidas.reduce(function (a, o) { a[o.by] = 1; return a; }, {})).length
    };
    Object.keys(n).forEach(function (k) {
      $$('[data-n="' + k + '"]').forEach(function (el) { el.textContent = n[k]; });
    });
  }

  // ── la placa ─────────────────────────────────────────────────────────────
  function irAPlaca(t) {
    ponerTipo(t);
    var y = $("#cierre").getBoundingClientRect().top + window.scrollY;
    window.scrollTo({ top: y, behavior: prefiereQuieto() ? "auto" : "smooth" });
    setTimeout(function () { $("#f-name").focus({ preventScroll: true }); }, 620);
  }
  function ponerTipo(t) {
    S.tipo = t;
    $$(".seg button").forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.t === t)); });
    $$("[data-p]").forEach(function (p) { p.hidden = p.dataset.p !== t; });
  }
  $$(".seg button").forEach(function (b) {
    b.addEventListener("click", function () { ponerTipo(b.dataset.t); });
  });
  $$("[data-go]").forEach(function (b) {
    b.addEventListener("click", function () { irAPlaca(b.dataset.go); });
  });

  // lee la foto y la comprime para que quepa en un documento de Firestore (1 MB)
  function leerFoto(input, prevSel) {
    var f = input.files && input.files[0];
    if (!f) return;
    var r = new FileReader();
    r.onload = function (ev) {
      var img = new Image();
      img.onload = function () {
        try {
          var MAX = 1100, k = Math.min(1, MAX / Math.max(img.width, img.height));
          var c = document.createElement("canvas");
          c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
          c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
          var q = 0.8, out = c.toDataURL("image/jpeg", q);
          while (out.length > 900000 && q > 0.35) { q -= 0.1; out = c.toDataURL("image/jpeg", q); }
          S.foto = out;
        } catch (err) { S.foto = ev.target.result; }
        var p = $(prevSel);
        p.hidden = false;
        p.innerHTML = "";
        var pv = new Image();
        pv.alt = "Vista previa de la imagen que elegiste";
        pv.style.maxHeight = "11rem";
        pv.src = S.foto;
        p.appendChild(pv);
      };
      img.onerror = function () { S.foto = ev.target.result; };
      img.src = ev.target.result;
    };
    r.readAsDataURL(f);
  }
  $("#f-file").addEventListener("change", function () { leerFoto(this, "#f-prev"); });
  $("#f-file2").addEventListener("change", function () { leerFoto(this, "#f-prev2"); });

  $("#plate").addEventListener("submit", function (e) {
    e.preventDefault();
    var nombre = $("#f-name").value.trim();
    if (!nombre) { toast("Escribe tu nombre para dejarlo"); $("#f-name").focus(); return; }
    var rel = $("#f-rel").value.trim();

    if (S.tipo === "foto") {
      if (!S.foto) { toast("Elige la fotografía"); return; }
      var e1 = { src: S.foto, label: $("#f-cap").value.trim() || "Un recuerdo", author: nombre };
      escribir("fotos", e1, function () {
        guardarLocal("ml_photos", "subidas", { k: "gift", id: "u" + Date.now(), c: e1.label, by: nombre });
      });
      limpiar(); toast("Tu fotografía ya está en el álbum");
      cargarSubidas().then(function () { window.scrollTo({ top: $("#album").offsetTop, behavior: "smooth" }); });

    } else if (S.tipo === "texto") {
      var t = $("#f-text").value.trim();
      if (!t) { toast("Escribe el recuerdo"); return; }
      escribir("recuerdos", { text: t, author: nombre, rel: rel,
        epoca: $("#f-epoca").value.trim(), lugar: $("#f-lugar").value.trim(), photo: null });
      limpiar(); toast("Gracias por escribirlo");

    } else if (S.tipo === "momento") {
      var d = $("#f-date").value, ti = $("#f-title").value.trim();
      if (!d || !ti) { toast("Falta la fecha o qué pasó"); return; }
      escribir("momentos", { date: d, title: ti, text: $("#f-desc").value.trim(),
        kind: "user", author: nombre });
      limpiar(); toast("Tu momento quedó en el año que le toca");

    } else {
      var p = $("#f-plato").value.trim(), rec = $("#f-rec").value.trim();
      if (!p) { toast("Escribe cómo se llama el platillo"); return; }
      if (!rec && !S.foto) { toast("Escribe la receta o sube la foto"); return; }
      escribir("recetas", { name: p, note: rec, photo: S.foto || null, author: nombre });
      limpiar(); toast("Su receta ya está en su cocina");
    }
  });

  function escribir(col, entry, fallback) {
    if (db) {
      db.collection(col).add(Object.assign({ t: stamp() }, entry))
        .catch(function () { if (fallback) fallback(); else toast("No se pudo guardar. Inténtalo otra vez."); });
    } else if (fallback) { fallback(); }
    else { toast("No hay conexión con la nube. Inténtalo más tarde."); }
  }
  function limpiar() {
    ["#f-cap", "#f-text", "#f-epoca", "#f-lugar", "#f-title", "#f-desc", "#f-plato", "#f-rec", "#f-date"]
      .forEach(function (s) { var el = $(s); if (el) el.value = ""; });
    S.foto = null; $("#f-prev").hidden = true; $("#f-prev2").hidden = true;
  }

  // ── velita, lugares, canciones ───────────────────────────────────────────
  $("#velita").addEventListener("click", function () {
    if (db) {
      db.doc("contadores/velitas").set({ n: inc(1) }, { merge: true }).catch(function () {
        S.velitas++; contar(); lsSet("ml_candles", S.velitas);
      });
    } else { S.velitas++; contar(); lsSet("ml_candles", S.velitas); }
    toast("Encendiste una velita");
  });

  $("#lug-add").addEventListener("click", function () {
    var n = $("#lug-n").value.trim();
    if (!n) { toast("Escribe el lugar"); return; }
    var e = { name: n, note: $("#lug-p").value.trim() };
    escribir("lugares", e, function () { S.lugaresNube.push(e); pintarCosas(); });
    $("#lug-n").value = ""; $("#lug-p").value = "";
    toast("Ese lugar ya es suyo otra vez");
  });

  $("#songs").addEventListener("click", function (e) {
    var b = e.target.closest("[data-song]");
    if (!b) return;
    var id = b.dataset.song, my = S.misVotos.slice(), i = my.indexOf(id);
    var d = i >= 0 ? -1 : 1;
    if (i >= 0) my.splice(i, 1); else my.push(id);
    S.misVotos = my; lsSet("ml_myvotes", my);
    if (db) db.doc("votos/" + id).set({ n: inc(d) }, { merge: true }).catch(function () {});
    else { S.votos[id] = (S.votos[id] || 0) + d; }
    pintarCanciones();
  });

  $("#song-add").addEventListener("click", function () {
    var t = $("#song-t").value.trim();
    if (!t) { toast("Escribe cómo se llama"); return; }
    var a = $("#song-a").value.trim() || "Sin artista";
    if (db) {
      var ref = db.collection("canciones").doc();
      ref.set({ title: t, artist: a, t: stamp() }).catch(function () {});
      db.doc("votos/" + ref.id).set({ n: inc(1) }, { merge: true }).catch(function () {});
      S.misVotos = S.misVotos.concat([ref.id]); lsSet("ml_myvotes", S.misVotos);
    } else {
      var id = "us" + Date.now();
      S.canciones.push({ id: id, title: t, artist: a, base: 1 });
      S.misVotos.push(id); pintarCanciones();
    }
    $("#song-t").value = ""; $("#song-a").value = "";
    toast("Quedó anotada, con tu voto");
  });

  // ── el índice sabe dónde estás ───────────────────────────────────────────
  function conectarIndice() {
    var links = $$(".idx a");
    var mapa = {};
    links.forEach(function (a) { mapa[a.getAttribute("href").slice(1)] = a; });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) { a.removeAttribute("aria-current"); });
        var a = mapa[e.target.id];
        if (a) a.setAttribute("aria-current", "true");
      });
    }, { rootMargin: "-45% 0px -45% 0px" });
    Object.keys(mapa).forEach(function (id) { var s = document.getElementById(id); if (s) io.observe(s); });
  }

  // ── arranque ─────────────────────────────────────────────────────────────
  function iniciar() {
    S.misVotos = ls("ml_myvotes", []);

    // las celdas de fotos subidas piden sus bytes cuando se acercan a la vista
    obs = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        var b = e.target; obs.unobserve(b);
        var id = b.dataset.id.split(":")[1];
        pedirSrc(id).then(function (src) {
          if (src && !b.firstChild) {
            var im = new Image(); im.src = src; im.alt = ""; im.loading = "lazy";
            b.appendChild(im);
          }
        });
      });
    }, { root: strip, rootMargin: "300px" });

    /* En el teléfono el primer acto tiene mucha menos altura de recorrido que
       en escritorio, así que con el mismo span la foto de entrada aparece y se
       va de un tirón. El span y la ventana del barrido se aflojan antes de
       montar, que es cuando el motor los lee. */
    if (window.innerWidth < 1080) {
      var ella = document.getElementById("ella");
      if (ella) {
        ella.setAttribute("data-sc-span", "2.8");
        /* La ventana va en fracción del acto, no en píxeles: con el span al
           doble, 0.35 de recorrido es cuatro veces más scroll que antes y aun
           así deja la foto entera durante el resto del acto, en lugar de
           dejarla a medio revelar media pantalla. */
        var plate = ella.querySelector("[data-sc-reveal]");
        if (plate) plate.setAttribute("data-sc-reveal-at", "0 0.35");
      }
    }

    crearVacia();
    pintarVida(); pintarMuro(); pintarCosas(); pintarCanciones(); contar();
    ponerTipo("foto");
    conectarIndice();
    conectarAlbum();

    armarCorrida();            // pinta ya con puro archivo
    cargarSubidas();           // y se rehace en cuanto llega el índice de la nube
    nube();

    ScrollCraft.mount(document.body);

    // las fotos del archivo también mueven la altura al terminar de cargar
    window.addEventListener("load", remedir);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", iniciar);
  else iniciar();
})();
