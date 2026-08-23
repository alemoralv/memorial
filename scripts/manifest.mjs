// Builds sitio/fotos.js: the archive manifest the page reads.
// The filenames are the only caption source the archive has, so this turns
// each one back into readable Spanish. Nothing here invents a fact: a photo
// with no date in its name gets no date in its label.
import { readdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
const AQUI = dirname(fileURLToPath(import.meta.url));
const DIR = resolve(AQUI, "../fotos");

// Phrases first, on the raw de-slugged text, before any token is accented.
const PHRASE = [
  [/^marcha el ine no se toca$/, "Marcha: el INE no se toca"],
  [/^marilu en bahia halong vietnam$/, "Marilú en la bahía de Ha Long, Vietnam"],
  [/^con su nieta en sacre coeur$/, "Con su nieta en el Sacré-Cœur"],
  [/^marilu comiendo hot dog en ny$/, "Marilú comiendo un hot dog en Nueva York"],
  [/^paseo en tuk tuk mercado guatemala$/, "Paseo en tuk-tuk por un mercado de Guatemala"],
  [/^entre roosevelt y churchill en londres$/, "Entre Roosevelt y Churchill, en Londres"],
  [/^marilu con cigarro en la habana$/, "Marilú con un cigarro en La Habana"],
  [/^amigas junto a auto clasico cuba$/, "Amigas junto a un auto clásico, en Cuba"],
  [/^familia con impermeables en japon$/, "La familia con impermeables, en Japón"],
  [/^selfie con nieto en munich$/, "Selfie con su nieto en Múnich"],
  [/^familia frente a convento izamal$/, "La familia frente al convento de Izamal"],
  [/^marilu soplando un diente de leon$/, "Marilú soplando un diente de león"],
  [/^tira de fotomaton familiar$/, "Tira de fotomatón en familia"],
  [/^rompiendo la pinata$/, "Rompiendo la piñata"],
  [/^de paseo con pinguinos de peluche$/, "De paseo con pingüinos de peluche"],
  [/^bajo la aurora boreal$/, "Bajo la aurora boreal"],
  [/^torii naranjas bajo la lluvia$/, "Torii naranjas bajo la lluvia"],
  [/^familia en ruinas mayas$/, "La familia en unas ruinas mayas"],
  [/^noche de ano nuevo en pareja$/, "Noche de Año Nuevo, en pareja"],
  [/^ano nuevo con sus nietas$/, "Año Nuevo con sus nietas"],
  [/^notas a mano para usar el correo$/, "Notas a mano para usar el correo"],
];

// Then tokens. Only words the slug actually stripped something from.
const WORD = {
  marilu: "Marilú", jardin: "jardín", cumpleanos: "cumpleaños",
  anos: "años", ano: "año", reunion: "reunión", salon: "salón",
  cafe: "café", celebracion: "celebración", bebe: "bebé",
  navideno: "navideño", navidena: "navideña", carinoso: "cariñoso",
  orquideas: "orquídeas", graduacion: "graduación", decoracion: "decoración",
  excursion: "excursión", clasico: "clásico", dia: "día", arbol: "árbol",
  bahia: "bahía", leon: "león", pinata: "piñata", habana: "Habana",
  japon: "Japón", munich: "Múnich", vietnam: "Vietnam", cuba: "Cuba",
  guatemala: "Guatemala", izamal: "Izamal", londres: "Londres",
  recien: "recién",
};


// Filenames written as keywords rather than sentences. These read the same
// facts back as Spanish somebody would actually say out loud.
const REWRITE = {
  "marilu-jardin-tropical-viaje": "Marilú en un jardín tropical, de viaje",
  "marilu-sentada-jardin-orquideas": "Marilú sentada entre orquídeas",
  "grupo-amigas-sala-de-espera": "Un grupo de amigas en una sala de espera",
  "paseo-en-cuatriciclo-ciudad": "Paseo en cuatriciclo por la ciudad",
  "seis-amigas-vestidos-de-colores": "Seis amigas de vestidos de colores",
  "tres-mujeres-foto-vintage": "Tres mujeres, fotografía antigua",
  "tres-amigas-riendo-foto-antigua": "Tres amigas riendo, fotografía antigua",
  "boda-vintage-blanco-y-negro": "Una boda en blanco y negro",
  "retrato-familiar-vintage-elegante": "Retrato familiar de gala",
  "pareja-vintage-evento-de-gala": "Una pareja en un evento de gala",
  "dos-mujeres-junto-al-mar-vintage": "Dos mujeres junto al mar",
  "grupo-de-amigas-evento-elegante": "Un grupo de amigas en un evento elegante",
  "grupo-de-amigas-en-evento": "Un grupo de amigas en un evento",
  "cena-con-amigas-restaurante": "Cena con amigas en un restaurante",
  "atardecer-en-la-playa-familia": "Atardecer en la playa, en familia",
  "retrato-familiar-en-jardin": "Retrato de la familia en el jardín",
  "marilu-y-esposo-con-sus-nietos": "Marilú y su esposo con los nietos",
  "marilu-con-esposo-y-nieto-bebe": "Marilú con su esposo y su nieto bebé",
  "comida-de-amigas-mesa-festiva": "Comida de amigas en una mesa festiva",
  "marilu-con-amigos-en-evento": "Marilú con amigos en un evento",
  "marilu-y-su-esposo-en-evento": "Marilú y su esposo en un evento",
  "retrato-con-nietos-en-porche": "Retrato con los nietos en el porche",
  "retrato-en-salon-verde-elegante": "Retrato en un salón verde",
  "libros-de-decoracion-en-repisa": "Sus libros de decoración en la repisa",
  "cumpleanos-en-familia-soplando-velas": "Cumpleaños en familia, soplando las velas",
  "amigas-en-escalera-casa-de-playa": "Amigas en la escalera de una casa de playa",
  "comida-grupo-amigos-terraza": "Comida con amigos en la terraza",
  "cena-de-amigas-noche-tropical": "Cena de amigas, noche tropical",
  "amigas-en-alberca-anos-70": "Amigas en la alberca",
  "con-bebe-y-nieta-en-jardin": "Con un bebé y su nieta en el jardín",
  "reunion-de-mujeres-en-jardin": "Reunión de mujeres en el jardín",
  "grupo-de-mujeres-frente-a-obra-de-arte": "Un grupo de mujeres frente a una obra",
  "cinco-amigas-frente-a-helechos": "Cinco amigas frente a unos helechos",
  "amigas-frente-a-arbol-iluminado": "Amigas frente a un árbol iluminado",
  "graduacion-con-flores-de-noche": "Una graduación de noche, con flores",
  "sorpresa-de-pastel-con-bengala": "La sorpresa del pastel, con bengala",
};

// One home video came with the archive: 18 segundos, con sonido.
const VIDEO = { "sorpresa-de-pastel-con-bengala": "fotos/sorpresa-de-pastel-con-bengala.mp4" };

const DECADE = { 70: "Años setenta.", 80: "Años ochenta." };

function label(slug) {
  const raw = slug.replace(/-/g, " ").trim();

  // a numbered plate in a series: familia-01 … familia-10
  const plate = /^([a-z]+)-(\d{2})$/.exec(slug);
  if (plate) return { c: "En familia", f: "Lámina " + Number(plate[2]) + " de una serie sin fecha." };

  // the camera's own filename carries no caption information. Say so.
  if (/^img \d/.test(raw)) return { c: "Sin título", f: "Sin datos en el archivo." };

  for (const [re, v] of PHRASE) if (re.test(raw)) return { c: v, f: "" };

  // a decade in the name is the one date the archive actually records
  let fact = "";
  let s = raw.replace(/\banos (70|80)\b/, (_, d) => { fact = DECADE[d]; return ""; })
             .replace(/\s+/g, " ").replace(/[ ,]+$/, "").trim();

  for (const [k, v] of Object.entries(WORD)) {
    s = s.replace(new RegExp("\\b" + k + "\\b", "g"), v);
  }
  s = s.charAt(0).toUpperCase() + s.slice(1);
  return { c: s, f: fact };
}

const out = [];
for (const f of readdirSync(DIR).filter((n) => /\.jpe?g$/i.test(n))) {
  const base = f.replace(/\.[^.]+$/, "");
  const slug = base.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  let w = 0, h = 0;
  try {
    const probe = execFileSync("ffprobe", ["-v", "error", "-select_streams", "v:0",
      "-show_entries", "stream=width,height", "-of", "csv=p=0",
      join(DIR, "v", slug + ".webp")], { encoding: "utf8" });
    [w, h] = probe.trim().split(",").map(Number);
  } catch { console.warn("sin webp:", slug); continue; }
  const l = label(slug);
  const row = { s: slug, c: REWRITE[slug] || l.c, f: l.f, w, h };
  if (VIDEO[slug]) row.v = VIDEO[slug];
  out.push(row);
}

out.sort((a, b) => a.s.localeCompare(b.s, "es"));
writeFileSync(
  resolve(AQUI, "../fotos.js"),
  "// Generado desde sitio/fotos/ por scripts/manifest.mjs. No editar a mano.\n" +
  "window.ARCHIVO=" + JSON.stringify(out) + ";\n",
);
console.log(out.length + " fotografías\n");
console.log(out.map((o) => o.c + (o.f ? "  — " + o.f : "")).join("\n"));
