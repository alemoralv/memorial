# Marilú · el mundo detrás del álbum

Refinamiento del 5 de septiembre de 2026 con la skill
[scroll-craft](https://github.com/nateherkai/scroll-craft).

El fondo recorre París desde el aire, montañas, un sendero junto a un lago y
una mesa con un cuaderno de recetas. Las fotografías familiares y el contenido
permanecen en un plano superior, sobre papel de la paleta original. París tiene
antecedentes en los viajes del archivo; los nuevos paisajes son ambientación
generada, no fotografías familiares ni afirmaciones sobre lugares favoritos.

`paisajes.css` y `paisajes.js` añaden esta presentación al sitio existente. El
vuelo y el gesto de escritura siguen el scroll en ambas direcciones. Los cuatro
fondos se combinan según la sección visible, con desplazamiento suave separado
de los montajes del álbum y de la luz. La geometría se vuelve a medir cuando
llegan recuerdos de Firestore o cambia el tamaño de la ventana.

Se conserva la gramática de colección, su índice, la hoja de contactos y el
álbum como momento principal. No se agregan secciones ni duración de scroll.
La curva sigue siendo reconocimiento, ternura, cercanía, pausa, conexión,
familiaridad, pertenencia y cariño. Se trata de una revisión de la misma página,
no de una página nueva que pretenda superar el criterio de cuatro diferencias.
El brief se elaboró con la dirección creativa delegada expresamente por el usuario.

## Archivos y generación

- Cuatro imágenes de KIE, modelo `seedream/5-pro-text-to-image`.
- Dos clips de cinco segundos de KIE, modelo `kling/v2-1-pro`.
- WebP y MP4 locales bajo `assets/paisajes/`, con versiones más pequeñas para
  teléfono. Los pósteres de los clips salen de su primer fotograma.
- MP4 H.264, sin audio, 24 fps, GOP 8 en escritorio y 4 en móvil, faststart.
  Las dos versiones de video de escritorio suman 5.82 MB; las de móvil, 2.56 MB.
- La clave KIE_API_KEY sólo se leyó desde el `.env` del workspace padre durante
  la generación. No está en el sitio. No se enviaron fotografías familiares.
- Prompts, identificadores de tareas y originales están fuera del sitio, en
  `../scrollcraft/builds/marilu-paisajes/`. El helper de generación vive en `.work`.

El video se solicita al acercarse su escena. Ante un error se conserva la imagen.
Con movimiento reducido o ahorro de datos no se descargan los clips decorativos.
Sin JavaScript queda el póster de París y el fallback existente del memorial.
Todos los recursos publicados mantienen rutas relativas para `/memorial/`.

## Verificación

```powershell
$env:PAISAJES_URL='http://localhost:4520/'
node scripts/verify-premium.mjs
node scripts/verify-atmosphere.mjs
node scripts/verify-paisajes.mjs
```

- Pasaron los nueve grupos existentes: contribuciones en Firebase simulado,
  compresión de fotos, velitas, teclado y visor, libro y persistencia, fotografía
  compartida en caché, menú móvil, Stay y fallback sin JavaScript.
- Cinco configuraciones: 1440×1000, 768×1024, 390×844, 360×640 y escritorio con
  movimiento reducido. Sin desbordamiento horizontal ni excepciones JavaScript.
- Los cuatro pósteres decodifican; el fondo queda debajo de `main` y no recibe
  clics. Los dos clips avanzan y retroceden al mover el scroll en los cuatro tamaños.
- El contraste del texto pequeño de apertura, medido sobre capturas reales,
  fue al menos 5.40:1. No representa una auditoría WCAG completa.
- Se comparó el texto de `main`, navegación, visor, hoja de contactos y fallback
  con HEAD. Es idéntico. `memorial.js`, el catálogo, el motor, premium y atmósfera
  no tienen diferencias de contenido (normalizando los finales de línea de Git).
- La revisión visual corrigió fotos que excedían la altura útil y títulos de
  lugares demasiado estrechos. Se inspeccionaron imágenes y secuencias KIE,
  además de aperturas, transiciones, álbum y cierre en el navegador.

Evidencia ignorada por Git: `lab/paisajes-checks/`, `lab/paisajes-final/`,
`lab/atmosfera/` y `lab/premium-interactions/`. Las primeras hojas de Scrollcraft
en `lab/paisajes-walk-*` midieron antes de que llegaran todos los recuerdos y
no cubrieron el cierre. Los recorridos corregidos `lab/paisajes-ready-*` esperan
los datos y la estabilización de la altura antes de medir. Los fallos previos del
verificador (CRLF de Git y desplazamiento nulo de un hero en flujo) se corrigieron
en la prueba; no eran cambios en el contenido ni fallas del video.

Chrome puede cancelar solicitudes parciales de MP4 al buscar otro fotograma;
las comprobaciones de decodificación y playhead se hacen por separado. Firestore
puede cancelar conexiones largas: estas revisiones no certifican su disponibilidad.
No se enviaron contribuciones de prueba a producción. La revisión móvil se hizo
en Chrome emulado, no en un iPhone físico o Safari.

Vista local: http://localhost:4520/.

Los tres recorridos finales de Scrollcraft contienen 143 fotogramas revisados,
sin scroll muerto detectado. Alcanzan el cierre completo; sus cues medidos pasan
4.5:1. La curva observada coincide con la planeada: el paisaje acompaña y el álbum
sigue siendo el encuentro principal. El usuario autorizó commit y push a `main`.
