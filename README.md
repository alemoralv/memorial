# Marilú · María Luz Galindo Rodríguez (1949 – 2026)

Un álbum abierto de su vida. Publicado en
<https://alemoralv.github.io/memorial/> desde la raíz de este repo (GitHub
Pages, rama `main`, sin build).

La página es una **colección**: cada fotografía, cada receta y cada lugar lleva
la misma cédula (título, dato, procedencia), y las 141 del archivo de la familia
se etiquetan igual que las que trae la gente. Al bajar, las fotografías van
pasando **al ritmo de tu scroll**, nunca solas, y cada una que pasa se queda en
la hoja de contactos fija abajo. Esa hoja es el índice de la página, y su última
celda siempre está vacía: es la que falta, la tuya.

Y si quieres sentarte a verlas en lugar de bajarlas tú, **pícale a cualquier
foto de la hoja y arranca el pase automático de las 190**, con pausa, flechas y
teclado. Es la única parte de la página que avanza sola, y sólo porque alguien
lo pidió.

Paleta: verde oscuro de fondo, tipografía beige, y un solo acento, rosa.

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

---

## 3. Añadir fotografías al archivo

1. Copia los `.jpg` en `fotos/`. **El nombre del archivo es el pie de foto**:
   escríbelo descriptivo y en español, con guiones.
   `marilu-el-dia-de-su-boda.jpg` → «Marilú el día de su boda».
2. Convierte y regenera el catálogo:

       bash scripts/optimizar.sh     # sólo convierte las nuevas
       node scripts/manifest.mjs

`manifest.mjs` devuelve los acentos que el nombre del archivo pierde
(`cumpleanos` → cumpleaños). Si una foto sale con un pie raro, añádela al mapa
`REWRITE` de ese script y vuelve a correrlo. **No edites `fotos.js` a mano**: se
sobrescribe.

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

---

Hecho con cariño para Marilú. so beat it
