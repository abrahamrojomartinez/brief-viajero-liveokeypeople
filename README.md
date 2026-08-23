# Asturias, 16–20 septiembre — VIBRA × LiveOkey

Dos dossieres del mismo viaje, uno por comunidad, en un solo sitio de Netlify.

| Ruta           | Quién     | Qué cuenta                            |
|----------------|-----------|---------------------------------------|
| `/`            | LiveOkey  | El finde de surf, 18–20 sept          |
| `/previa/`     | VIBRA     | La previa de coworking, 16–18 sept    |
| `/formulario/` | Las dos   | Formulario de gestión del viaje       |

- Panel: https://app.netlify.com/projects/vibra-con-liveokey-trip
- URL: https://vibra-con-liveokey-trip.netlify.app

## Estructura

```
index.html          21 KB   — dossier de LiveOkey (marca oscura, rojo #BC2813)
previa/index.html   23 KB   — dossier de VIBRA (papel crema, coral #E8724C)
formulario/index.html       — formulario del viaje (5 pasos, va a HubSpot)
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


## `/formulario/` — el formulario del viaje

Para quien **ya tiene la plaza**. No es de venta: no hay precios, ni plazas, ni
CTA de reserva. Sirve para organizar alojamiento, cocina, neoprenos y grupos.

Cinco pasos, y **la piel cambia según de quién es el bloque**. No es decorativo:
al rellenarlo entiendes de quién es cada parte del viaje.

| Paso | Título          | Piel                          |
|------|-----------------|-------------------------------|
| 1    | Quién eres      | papel, neutra                 |
| 2    | Tu viaje        | **VIBRA** — papel y coral     |
| 3    | El surf         | **LiveOkey** — negro y rojo   |
| 4    | Lo práctico     | papel, neutra                 |
| 5    | Cosas sobre ti  | **VIBRA** — papel y coral     |

El fondo de la página entera funde de un paso a otro en 400 ms. La paleta activa
vive en `body[data-piel]` y todo lo demás lee esas variables, así que cambiar de
paso es cambiar de paleta. Caveat solo aparece en los pasos de VIBRA; en el 3
nunca, porque la letra manuscrita no es de LiveOkey.

### Antes de que funcione: dos cosas en HubSpot

**1. Pegar el GUID.** Arriba del `<script>` hay una constante:

```js
var FORM_GUID = '';
```

Se saca en HubSpot > Marketing > Formularios > (el formulario) > Compartir.
Mientras esté vacía el formulario **avisa al enviar**, no falla en silencio.

**2. Crear las propiedades que faltan.** El portal (246666670) ya tiene
`firstname`, `email`, `city`, `mobilephone`, `instagram` y `viaje_sonado`.
Faltan nueve:

| Nombre interno | Tipo | Opciones |
|---|---|---|
| `previa_vibra` | desplegable | Sí · No |
| `previa_dia_inicio` | desplegable | Miércoles 16 · Jueves 17 |
| `nivel_surf` | desplegable | Debutante · Iniciación · Intermedio · Avanzado |
| `talla_neopreno` | desplegable | S · M · L · XL · Tengo mi propio neopreno |
| `alergias_restricciones` | texto multilínea | — |
| `como_nos_has_conocido` | desplegable | Por Instagram de VIBRA · Por Instagram de LiveOkey · Otro |
| `como_nos_has_conocido_detalle` | texto | — |
| `motivacion_viaje` | texto multilínea | — |
| `viaje_asturias` | texto | valor fijo «Asturias sept 2026» |

Después hay que crear un formulario en HubSpot con **exactamente esos campos**
y publicarlo. El endpoint rechaza la llamada entera si le mandas un campo que no
está en el formulario, y los valores de las opciones tienen que coincidir letra
por letra: cuidado con `Sí`, `Iniciación` y `Miércoles 16`.

Se envía desde el navegador a `api-eu1.hsforms.com` (Forms API v3): sin backend,
sin funciones de Netlify y **sin ninguna clave en el código**. El contacto se
deduplica por correo, así que reenviar actualiza en vez de duplicar.

### Las fotos

Faltan `img/paso-1.jpg` … `img/paso-5.jpg`. Mientras no existan, cada hueco se
pinta con un color plano de respaldo en la paleta del paso, así que la página se
rellena igual de bien sin ellas. Cuando estén, van en duotono automático: el CSS
las pasa a blanco y negro y las tiñe con los dos colores de la piel del paso, así
que valen fotos de cualquier procedencia y salen coherentes.

### Detalles que no se ven pero importan

- **Nada de `localStorage` ni `sessionStorage`.** El estado vive en memoria.
- Se valida al pulsar Siguiente, nunca mientras se escribe. El error sale debajo
  del campo y el foco salta al primero que falla.
- Enter avanza de paso; dentro de un textarea hace salto de línea.
- Si HubSpot falla, **los datos siguen en pantalla** y hay botón de reintentar.
  A la segunda aparece un `mailto:` con las respuestas ya escritas en el cuerpo.
- Campo trampa `empresa_web`, oculto por CSS y no con `type="hidden"`: si llega
  relleno, el envío se descarta en silencio y se enseña la pantalla de gracias
  igual.
- Modo claro forzado (`color-scheme: only light` + bloque `!important` en la
  media query de oscuro), como en los dos dossieres.
- `noindex`: es un formulario de gestión, no una página de captación. El enlace
  se reparte a mano, pero lleva Open Graph para que se vea bien en WhatsApp.
- La pantalla de gracias recuerda que es **un formulario por persona**.
