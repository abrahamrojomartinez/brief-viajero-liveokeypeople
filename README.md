# Dossier VIBRA × LiveOkey — Asturias, 15–20 septiembre

Sitio estático de un solo archivo. `index.html` es el dossier del viaje; las
imágenes viven en `/img`.

## Estructura

```
index.html          22 KB   — el dossier (antes 820 KB con las imágenes incrustadas)
img/                526 KB  — las 13 fotos y logos, en archivos sueltos
netlify.toml                — cabeceras de caché
brief_viajero.html          — dossier anterior (LiveOkey Marruecos 2026)
```

## Publicar en Netlify

El repo ya está listo; solo falta conectarlo:

1. En Netlify → **Add new site → Import an existing project → GitHub**.
2. Elegir este repositorio y la rama que se quiera publicar.
3. Dejar el comando de build vacío y el directorio de publicación en `.`
   (ya viene definido en `netlify.toml`).
4. En **Site configuration → Change site name**, poner `vibra-liveokey-asturias`
   para que la URL quede `https://vibra-liveokey-asturias.netlify.app`.

A partir de ahí, cada push a esa rama redespliega solo.

## Notas de rendimiento

- El HTML pasó de 820 KB a 22 KB al sacar las imágenes a archivos sueltos:
  el texto se pinta antes de que baje ninguna foto.
- La portada (`img/portada-atardecer.jpg`) carga con `fetchpriority="high"`;
  el resto va con `loading="lazy"`.
- Todas las imágenes llevan `width`/`height` para que la página no dé saltos
  mientras carga.
- Las fotos se sirven con caché de un año; el HTML se revalida siempre, así
  que los cambios se ven al recargar.
