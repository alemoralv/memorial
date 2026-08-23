#!/usr/bin/env bash
# Genera las versiones web de cada fotografía del archivo.
#   fotos/v/<slug>.webp  → 1400 px de lado largo, para verla grande
#   fotos/t/<slug>.webp  →  360 px, para la hoja de contactos
# Los originales en fotos/*.jpg no se tocan nunca: son el archivo.
cd "$(dirname "$0")/../fotos" || exit 1
mkdir -p v t
n=0
for f in *.jpg *.JPG; do
  [ -e "$f" ] || continue
  b="${f%.*}"
  s=$(printf '%s' "$b" | tr 'A-Z' 'a-z' | tr -c 'a-z0-9\n' '-' | sed 's/-\+/-/g; s/^-//; s/-$//')
  [ -f "v/$s.webp" ] && [ -f "t/$s.webp" ] && continue     # ya está hecha
  ffmpeg -v error -y -i "$f" -vf "scale='min(1400,iw)':'min(1400,ih)':force_original_aspect_ratio=decrease:flags=lanczos" -c:v libwebp -quality 76 -compression_level 6 "v/$s.webp"
  ffmpeg -v error -y -i "$f" -vf "scale='min(360,iw)':'min(360,ih)':force_original_aspect_ratio=decrease:flags=lanczos" -c:v libwebp -quality 68 -compression_level 6 "t/$s.webp"
  n=$((n+1))
done
echo "$n fotografías nuevas convertidas"
