// Construye sitio/fotos.js: el catálogo del archivo que lee la página.
//
// NO genera pies de foto, y es a propósito. Los nombres de archivo describen la
// escena ("festejo-con-su-nieto-en-restaurante"), pero nadie de la familia los
// escribió ni los revisó, así que una descripción sacada de ahí es una
// afirmación sin respaldo sobre quién sale en la foto. En un memorial eso pesa
// más que la comodidad de tener un pie. Las únicas descripciones que la página
// enseña son las que escribió una persona al subir su fotografía.
//
// Aquí sólo salen datos que se pueden comprobar mirando el archivo: el nombre
// del archivo como identificador, y el ancho y alto reales de la imagen.
import { readdirSync, writeFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";

const AQUI = dirname(fileURLToPath(import.meta.url));
const DIR = resolve(AQUI, "../fotos");

// El único vídeo que venía en el archivo: 18 segundos, con sonido.
const VIDEO = { "sorpresa-de-pastel-con-bengala": true };

const out = [];
for (const f of readdirSync(DIR).filter((n) => /\.jpe?g$/i.test(n))) {
  const slug = f
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  let w = 0, h = 0;
  try {
    const probe = execFileSync(
      "ffprobe",
      ["-v", "error", "-select_streams", "v:0", "-show_entries",
       "stream=width,height", "-of", "csv=p=0", join(DIR, "v", slug + ".webp")],
      { encoding: "utf8" },
    );
    [w, h] = probe.trim().split(",").map(Number);
  } catch {
    console.warn("sin webp:", slug);
    continue;
  }
  const row = { s: slug, w, h };
  if (VIDEO[slug]) row.v = 1;
  out.push(row);
}

out.sort((a, b) => a.s.localeCompare(b.s, "es"));

const cabecera = [
  "// Generado desde sitio/fotos/ por scripts/manifest.mjs. No editar a mano.",
  "// Sin pies de foto a propósito: las descripciones sólo las pone la gente.",
  "",
].join("\n");

writeFileSync(
  resolve(AQUI, "../fotos.js"),
  cabecera + "window.ARCHIVO=" + JSON.stringify(out) + ";\n",
);
console.log(out.length + " fotografías en el catálogo, sin descripciones inventadas");
