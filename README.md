# Asturias, 16–20 septiembre — VIBRA × LiveOkey

Dos dossieres del mismo viaje, uno por comunidad, en un solo sitio de Netlify.

| Ruta        | Quién     | Qué cuenta                         |
|-------------|-----------|------------------------------------|
| `/`         | LiveOkey  | El finde de surf, 18–20 sept       |
| `/previa/`  | VIBRA     | La previa de coworking, 16–18 sept |

- Panel: https://app.netlify.com/projects/vibra-con-liveokey-trip
- URL: https://vibra-con-liveokey-trip.netlify.app

## Estructura

```
index.html          21 KB   — dossier de LiveOkey (marca oscura, rojo #BC2813)
previa/index.html   23 KB   — dossier de VIBRA (papel crema, coral #E8724C)
img/                        — las 18 fotos + los dos recortes para compartir
netlify.toml                — cabeceras de caché
```

**Los enlaces entre los dos son relativos y dependen de esta estructura.**
En `index.html` el botón «Ver la previa →» apunta a `previa/`, y en
`previa/index.html` el botón «Conoce cómo será el finde →» apunta a `../`.
Si algún día se mueven de sitio, hay que actualizar esos dos enlaces.

## Peso

Los HTML venían con las fotos incrustadas en base64 y pesaban 550 KB y 775 KB.
Ahora pesan 21 KB y 23 KB: el texto se pinta antes de que baje ninguna foto.

- Cada foto es un archivo suelto en `/img/`, con caché de un año.
- Las que ganaban algo llevan además versión **WebP** vía `<picture>`, con el
  JPG de respaldo. `descanso-activo` y `taller` no la llevan: venían ya muy
  comprimidas y el WebP salía más gordo que el original.
- La portada de cada página carga con `fetchpriority="high"`; el resto va con
  `loading="lazy"`.
- `picture{display:contents}` hace falta para que el `<img>` siga siendo el hijo
  directo del grid (`.mosaic`, `.pair`) y de `.hero`. Y `picture
  source{display:none}` también: con el padre en `display:contents` el
  `<source>` genera caja y se come una celda del mosaico.
- Las imágenes no llevan atributos `width`/`height` a propósito: el CSS las
  dimensiona por un solo lado (`aspect-ratio` en los mosaicos, `height` fija en
  los logos) y esos atributos deformaban la proporción.

## Compartir por WhatsApp e Instagram

Cada página lleva etiquetas Open Graph con su propio recorte 1200×630
(`img/og-liveokey.jpg`, `img/og-vibra.jpg`), para que el enlace salga con foto
y titular en vez de pelado. Esas URL son absolutas: si algún día se pone un
dominio propio, hay que actualizarlas.

## Modo oscuro

Las dos páginas tienen paleta fija (LiveOkey oscura, VIBRA crema) y un bloque
`@media (prefers-color-scheme: dark)` cuyo trabajo es que el móvil en modo
oscuro **no** cambie nada. Comprobado: las dos renderizan idénticas en claro y
en oscuro.

Ese bloque traía dos trozos de CSS pegados por error que, en VIBRA, dejaban las
tarjetas y la polaroid sin fondo y les cambiaban el padding. Se quitaron, y se
restauraron al final del bloque los colores propios de VIBRA que las reglas
`!important` heredadas del dossier oscuro estaban pisando: el coral del bloque
abierto, el borde de la opción destacada y el titular del bonus.

## Los botones «Entrar al grupo»

Los dos CTAs de cada página llevan al grupo del viaje:

```
https://chat.whatsapp.com/JJHIlEKwLEhDQYDeJ0PVSc
```

Si alguna vez se rehace el grupo, o se restablece el enlace desde los ajustes,
WhatsApp genera un código nuevo y estos cuatro enlaces dejan de servir.

## Nota sobre `.sec.dark`

El CSS de las dos páginas define una sección `.sec.dark` con foto de fondo
(`img/lok-fondo-oscuro.jpg` y `img/vibra-fondo-oscuro.jpg`), pero **ningún
elemento del HTML usa esa clase**. Las fotos se conservan por si se recupera la
sección; mientras tanto ningún navegador las descarga, así que no pesan nada al
visitante.
