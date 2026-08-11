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

## Netlify

El proyecto ya está creado en el equipo **Digital Change**:

- Panel: https://app.netlify.com/projects/vibra-con-liveokey-trip
- URL: https://vibra-con-liveokey-trip.netlify.app

Falta conectarlo a este repo para que se publique y se actualice solo:

1. En el panel del proyecto → **Project configuration → Build & deploy →
   Link repository** (o **Import from Git**).
2. Elegir `abrahamrojomartinez/brief-viajero-liveokeypeople` y la rama a publicar.
3. Dejar el comando de build vacío y el directorio de publicación en `.`
   (ya viene definido en `netlify.toml`).

A partir de ahí, cada push a esa rama redespliega solo.

## Notas de rendimiento

- El HTML pasó de 820 KB a 22 KB al sacar las imágenes a archivos sueltos:
  el texto se pinta antes de que baje ninguna foto.
- La portada (`img/portada-atardecer.jpg`) carga con `fetchpriority="high"`;
  el resto va con `loading="lazy"`.
- Las imágenes no llevan atributos `width`/`height` a propósito: el CSS las
  dimensiona por un solo lado (`height` fija en los logos, `aspect-ratio` en
  los mosaicos) y esos atributos sobrescribían la proporción y las deformaban.
  El `aspect-ratio` del CSS ya evita los saltos de maquetación.
- Las fotos se sirven con caché de un año; el HTML se revalida siempre, así
  que los cambios se ven al recargar.

## Los botones "Entrar al grupo"

Los dos CTAs (el de la cabecera y el del cierre) llevan al grupo del viaje:

```
https://chat.whatsapp.com/JJHIlEKwLEhDQYDeJ0PVSc
```

Son las dos únicas apariciones de `chat.whatsapp.com` en `index.html`.

Si alguna vez hay que rehacer el grupo, WhatsApp genera un código de
invitación nuevo y estos dos enlaces dejan de servir: habría que sustituirlos.
Lo mismo si se restablece el enlace desde los ajustes del grupo.
