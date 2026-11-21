#!/bin/sh
# Renders the app icons in public/ from the SVG sources in this folder.
# Needs rsvg-convert (librsvg) and ImageMagick. Run from apps/web: sh brand/render.sh
set -e
cd "$(dirname "$0")/.."
cp brand/mark.svg public/favicon.svg
rsvg-convert -w 180 -h 180 brand/mark-square.svg -o public/apple-touch-icon.png
rsvg-convert -w 192 -h 192 brand/mark.svg -o public/icon-192.png
rsvg-convert -w 512 -h 512 brand/mark.svg -o public/icon-512.png
rsvg-convert -w 512 -h 512 brand/mark-maskable.svg -o public/icon-maskable-512.png
tmp=$(mktemp -d)
for s in 16 32 48; do rsvg-convert -w $s -h $s brand/mark.svg -o "$tmp/$s.png"; done
magick "$tmp/16.png" "$tmp/32.png" "$tmp/48.png" public/favicon.ico
rm -r "$tmp"
