# Sitio conmemorativo — Marilú (María Luz Galindo Rodríguez)

Un espacio para recordarla: su historia, sus fotos, sus recuerdos, su
cocina, sus canciones y los lugares que amó.

---

## 1. Ver el sitio en tu compu

Necesitas abrirlo con un pequeño servidor local (no basta con doble clic,
porque el navegador bloquea la carga de `support.js` desde `file://`).

Con Python instalado, desde esta carpeta:

    python3 -m http.server 8000

Luego abre http://localhost:8000 en tu navegador.

(Otra opción, si usas VS Code: la extensión "Live Server".)

---

## 2. Estructura de archivos

    sitio/
      index.html      ← la página completa (aquí se edita TODO el contenido)
      support.js      ← motor que hace funcionar la página (no lo toques)
      fotos/          ← aquí van las fotos de Marilú (mira fotos/LEEME.txt)
      README.md       ← este archivo

---

## 3. Dónde editar cada cosa

Abre **index.html** y busca los comentarios marcados con
`// ⬇️ EDITA AQUÍ`. Cada uno es una lista fácil de editar:

- **Fotos** → `PHOTOS_SEED` (pon la ruta en `src`, ej: `'fotos/abuela-01.jpg'`)
- **Línea de vida** → `TIMELINE_SEED` (fecha en formato `AAAA-MM-DD`)
- **Recuerdos de ejemplo** → `MEMORIES_SEED` (reemplázalos por los reales o bórralos)
- **Recetas / platillos** → `RECETAS_SEED`
- **Lugares que amó** → `LUGARES_SEED`
- **Canciones y votos iniciales** → `SONGS_SEED`

También puedes cambiar textos directamente en el HTML (nombre, fechas,
la frase "so beat it", etc.).

---

## 4. IMPORTANTE — recuerdos y fotos que sube la gente

Ahora mismo, todo lo que un visitante escribe o sube (recuerdos, fotos,
momentos de la línea de vida, votos de canciones, velitas) se guarda en
**su propio navegador** (`localStorage`). Es decir: cada persona ve lo suyo,
pero **no se comparte** entre visitantes todavía.

Para que las aportaciones de familia y amigas se vean para TODOS, hay que
conectar una base de datos / backend. Los puntos exactos donde el sitio
guarda datos están en `index.html`, en la función `lsSet(...)` y en los
métodos `submit`, `voteSong`, `addSong`, `lightCandle`. Ahí es donde hay
que cambiar el guardado local por llamadas a tu API.

Opciones sencillas y gratuitas para empezar:
- **Supabase** (Postgres + API automática) — la más directa.
- **Firebase Firestore**.
- Un pequeño endpoint propio (Cloudflare Workers, Vercel Functions).

Mientras tanto, el sitio funciona perfecto como página estática para
mostrar todo lo que ya está cargado.

Nota sobre fotos subidas por la gente: se guardan como imagen embebida en
el navegador. Con backend, conviene subirlas a un almacenamiento (Supabase
Storage, Cloudflare R2, etc.) y guardar solo la URL.

---

## 5. Deploy con tu dominio de Porkbun

Porkbun vende el dominio; para publicar el sitio conéctalo a un hosting
estático gratuito (cualquiera de estos sirve):

**Opción recomendada — Cloudflare Pages / Netlify / Vercel:**
1. Sube esta carpeta `sitio/` a un repo de GitHub.
2. En Cloudflare Pages (o Netlify/Vercel) crea un proyecto desde ese repo.
   - Build command: (ninguno)
   - Output / publish directory: la raíz (donde está `index.html`)
3. En el panel del hosting, agrega tu dominio de Porkbun como dominio
   personalizado. Te dará unos registros DNS.
4. En Porkbun → tu dominio → DNS, pega esos registros (o cambia los
   nameservers a los de Cloudflare si usas Cloudflare).

Con eso, tu dominio quedará apuntando al memorial.

---

Hecho con cariño para Marilú. so beat it 🧡💜
