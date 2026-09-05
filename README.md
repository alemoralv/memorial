# Marilú · María Luz Galindo Rodríguez (1949 – 2026)

Un álbum abierto de su vida. Publicado en
<https://alemoralv.github.io/memorial/> desde la raíz de este repo (GitHub
Pages, rama `main`, sin build).

La página es una **colección**: cada objeto lleva su cédula. Las 141 del archivo
de la familia sólo dicen «Archivo de la familia», sin descripción: los nombres
de los archivos describen la escena, pero nadie de la familia los escribió ni
los revisó, así que un pie sacado de ahí afirma quién sale en la foto sin
respaldo. **Las únicas descripciones de la página son las que escribió una
persona al subir su fotografía**, y esas van con su nombre. Al bajar, las fotografías van
pasando **al ritmo de tu scroll**, nunca solas, y cada una que pasa se queda en
la hoja de contactos fija abajo. Esa hoja es el índice de la página, y su última
celda siempre está vacía: es la que falta, la tuya.

Y si quieres sentarte a verlas en lugar de bajarlas tú, **pícale a cualquier
foto de la hoja y arranca el pase automático de las 190**, con pausa, flechas y
teclado.

Justo encima de donde arranca el álbum hay un interruptor: **con el scroll** o
**como libro**, y se acuerda de lo que elegiste. El libro es la misma colección
puesta en hojas, y **también lo mueve tu scroll**: la hoja va girando al ritmo
con el que bajas y si te paras a media vuelta se queda a medio girar. Sólo se
pasa sola si le picas a ▶, y entonces va a la velocidad que elijas. En
horizontal enseña las dos páginas del pliego; en vertical una sola, porque de
canto no caben dos y porque con dos se saltaría una fotografía de cada dos.

Pasado el álbum la página **corta a oscuro** una sola vez: ahí está *Stay*, la
canción que le hicieron, seis minutos con sus fotografías. Nunca arranca sola,
tiene sonido, y se calla en cuanto te la llevas de la pantalla o abres el pase.
También se puede
[escuchar en Spotify](https://open.spotify.com/track/3xyti5jsVnth7AQZL2LEaI).

Paleta: **caqui de fondo, tinta verde oscuro, y un solo acento, rosa profundo**.
El rosa tuvo que irse a un tono hondo (`#962F4F`): sobre papel claro un rosa
suave se queda en 2:1 y no aguanta ni como marca. Así clava 4.70:1 en los dos
sentidos, lo mismo como texto que como relleno de botón.

El proyector es la única parte que invierte a fondo oscuro, y es a propósito:
una fotografía proyectada necesita la sala apagada. Ahí el acento toma su
segunda claridad, mismo tono, y se reafirma `color` sobre el subárbol, porque
redefinir el token no re-tinta lo que ya heredó color.

---

## 1. Verla en tu compu

Hace falta un servidor local (abrirla con doble clic no funciona: el navegador
bloquea los scripts desde `file://`).

    python3 -m http.server 8000

Y abre <http://localhost:8000>.

---

## 2. Los archivos

    index.html        la página: estructura y estilos
    memorial.js       toda la lógica (álbum, hoja de contactos, formularios, nube)
    fotos.js          GENERADO. El catálogo del archivo, con pie de foto y medidas
    scrollcraft.css   motor de scroll (de la skill scrollcraft). No editar
    scrollcraft.js    motor de scroll. No editar
    fotos/            los originales. Es el archivo, no se tocan
    fotos/v/          versiones web de 1400 px. GENERADAS
    fotos/t/          miniaturas de 360 px para la hoja de contactos. GENERADAS
    scripts/          cómo se regenera lo generado
    video/            la canción: stay.mp4 y su portada. GENERADOS

`video/stay.mp4` no es el máster. El original vive fuera del repo, en
`../stay.mp4` (126 MB, 1920×1080), y GitHub no acepta archivos de más de 100 MB.
Lo que se publica sale de ahí con un pase de denoise, que es lo que de verdad lo
encoge: el grano de la película se lleva casi todos los bits.

    ffmpeg -i ../stay.mp4 -vf hqdn3d=1.5:1.5:6:6       -c:v libx264 -preset slow -crf 28 -maxrate 1400k -bufsize 2800k       -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart video/stay.mp4

    ffmpeg -ss 309 -i ../stay.mp4 -frames:v 1 -vf scale=1400:-2 video/stay-portada.webp

El `+faststart` no es opcional: sin él el índice queda al final del archivo y el
vídeo no empieza hasta que se descargó entero. El `preload="none"` del `<video>`
tampoco: son 45 MB que nadie debe pagar por entrar a la página.

---

## 3. Añadir fotografías al archivo

1. Copia los `.jpg` en `fotos/`. El nombre sirve para encontrarla, no como pie
   de foto: la página no le va a poner descripción.
2. Convierte y regenera el catálogo:

       bash scripts/optimizar.sh     # sólo convierte las nuevas
       node scripts/manifest.mjs

`manifest.mjs` guarda nada más lo comprobable: el nombre del archivo y el
tamaño real de la imagen. **No edites `fotos.js` a mano**: se sobrescribe.

Cuáles del archivo pasan grandes en el álbum, y en qué orden, está en
`CORRIDA_ARCHIVO` dentro de `memorial.js`. Va curado a propósito: de joven,
madre, su carácter, el mundo, adentro, la fiesta, los suyos. Después de ésas
entran las que trajo la gente, y ahí es donde los pies de foto cambian de
«Archivo de la familia» al nombre de quien la compartió.

---

## 4. Lo que sube la gente

Todo lo que alguien escribe o sube se guarda en **Firebase Firestore**
(proyecto `memorial-marilu`, sin cuentas ni contraseñas) y aparece al instante
para todos:

| Qué | Colección |
|---|---|
| Fotografías | `fotos` |
| Recuerdos del muro | `recuerdos` |
| Momentos de la línea de vida | `momentos` |
| Recetas | `recetas` |
| Lugares | `lugares` |
| Canciones y sus votos | `canciones`, `votos` |
| Velitas | `contadores/velitas` |

Si la nube no responde, cada envío cae a `localStorage` y la página sigue
funcionando en ese dispositivo.

**Por qué `fotos` se lee distinto.** Cada documento de `fotos` lleva la imagen
metida dentro como base64, así que traerse la colección entera son megas y
megas en cuanto abres. La página pide primero sólo los pies de foto y los
nombres (REST, con máscara de campos) y baja los bytes de cada imagen nada más
cuando esa fotografía está a punto de verse. Las demás colecciones son chicas y
sí van por `onSnapshot`, en vivo.

Si algún día son muchas más fotos, lo que conviene es mover las imágenes a
Firebase Storage y guardar sólo la URL.

---

## 5. Publicar un cambio

    git add -A && git commit -m "..." && git push

GitHub Pages republica solo en un par de minutos. Las rutas son **relativas**
a propósito: una ruta que empiece con `/` se rompe, porque el sitio no vive en
la raíz del dominio sino en `/memorial/`.

---

## 6. Notas para quien le meta mano

- `scrollcraft.js` mide dónde empieza y acaba cada sección **una sola vez**, al
  cargar. Como aquí el contenido llega después desde Firestore y cambia la
  altura de la página, hay que volver a medir: eso hace `remedir()` en
  `memorial.js`, y hay que llamarlo desde cualquier función nueva que pinte
  contenido. Si se olvida, las secciones de abajo se quedan trabadas.
- Las fotos se muestran **completas** (`object-fit: contain`), nunca recortadas
  para caber en una forma. Son evidencia.
- Todo número en la página es real: velitas, fotografías, personas, recuerdos.
  No hay ninguno inventado, y no debe haberlo.
- Cuántas fotos pasan grandes en el álbum lo fija `CORRIDA` en `memorial.js`
  (hoy 51: las de `CORRIDA_ARCHIVO` y luego las que trajo la gente, para que el
  traspaso se vea en los pies de foto). Si le subes, súbele también el
  `data-sc-span` de `#album` o pasan demasiado rápido: unos 0.19 vh por foto.
- El pase automático (`PASO`, 5 s) se detiene solo cuando llega al único vídeo
  del archivo y sigue cuando termina. Con `prefers-reduced-motion` no arranca.
- El motor lee `data-sc-span` **una sola vez**, al recoger los actos: cambiar el
  atributo y volver a medir no mueve nada. Para cambiar el largo de un acto en
  caliente (lo hace el interruptor del libro) hay que tocar también el acto
  vivo, que el motor expone en `ScrollCraft.instances[].acts`. Eso hace
  `ponerSpan()`.
- El largo del acto en modo libro no es un número fijo: sale de `libroSpan()`,
  que le da a cada vuelta `LIBRO_POR_VUELTA` pantallas de scroll (hoy 0.26) con
  un tope de 26. Cambia con las fotos que hay y con si se ven una o dos hojas,
  así que se vuelve a poner al llegar el índice de la nube y al girar el
  aparato.
- En modo libro mandan dos relojes, nunca a la vez: el scroll (por defecto) y
  el pase solo (con ▶). El scroll es el estado de verdad, así que el pase solo
  mueve el scroll en cada aterrizaje (`libroIrA`) para que al pausar el relevo
  no salte. Como el acto está fijado, ese movimiento no se ve.
- `window.scrollTo({behavior: "auto"})` **no** es de golpe: `auto` quiere decir
  «lo que diga la hoja de estilos», y `scrollcraft.css` pone
  `scroll-behavior: smooth` en el `html`. Para que sea de golpe hay que
  apagarlo un instante, que es lo que hace `libroIrA`.
- Hay un recuerdo de prueba en la colección `recuerdos`
  (`rreH9VdYiacR2cDMttYH`). Las reglas de Firestore permiten crear pero **no
  borrar**, así que desde el sitio no se puede quitar: hay que borrarlo en la
  consola de Firebase. Mientras tanto la página lo filtra por su id.
- Una escena fijada recorta lo que no cabe. El recibidor ahora usa altura natural
  en teléfono y con movimiento reducido. El libro reserva espacio para los mandos
  y ajusta su tamaño a la altura disponible; en ventanas muy bajas sus controles
  siguen accesibles con desplazamiento interno.

---

Hecho con cariño para Marilú. so beat it

## Refinamiento visual · septiembre de 2026

El recibidor muestra la fotografía desde el primer instante. El nombre de Marilú
acompaña una impresión sobre hojas de álbum, con profundidad suave en escritorio.
En teléfono se acomoda en una columna de altura natural. El índice está arriba,
con un menú desplegable en teléfono; la cronología se lee en vertical, el álbum
conserva sus dos modos, y Stay tiene su propia sala oscura.

`premium.css` y `premium.js` contienen esta presentación y sus interacciones.
El motor compartido sigue intacto. El álbum ahora coloca también las imágenes de
la nube que ya estaban en caché y espera a que la siguiente fotografía esté lista
antes de retirar la anterior. Las fotos, sus autores y la conexión con Firestore
se conservan. [SCROLLCRAFT.md](SCROLLCRAFT.md) documenta la dirección y la revisión.
