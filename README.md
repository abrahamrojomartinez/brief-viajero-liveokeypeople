# Asturias, 16–20 septiembre — VIBRA × LiveOkey

Dos dossieres del mismo viaje, uno por comunidad, en un solo sitio de Netlify.

| Ruta           | Quién     | Qué cuenta                            |
|----------------|-----------|---------------------------------------|
| `/`            | LiveOkey  | El finde de surf, 18–20 sept          |
| `/previa/`     | VIBRA     | La previa de coworking, 16–18 sept    |
| `/formulario/` | LiveOkey  | Formulario de gestión del viaje       |

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

Cinco pasos: Quién eres · Tu viaje · El surf · Lo práctico · Cosas sobre ti.

**Marca única: LiveOkey.** Negro `#12100F`, rojo `#BC2813`, hueso `#F5F1EC`, de
principio a fin. La paleta entera vive en `:root` y todo lo demás lee esas
variables, así que la marca se cambia desde un solo sitio. Nada de Caveat: la
letra manuscrita es de VIBRA, y aquí su equivalente es la Fraunces en itálica,
como en el dossier de LiveOkey.

VIBRA aparece **en la cabecera, a la derecha del logo de LiveOkey**, separada
por una línea fina: «y la previa con» en letra diminuta sobre su logotipo (la
onda y la palabra `vibra` en Fraunces 900). Va deliberadamente pequeña —
25 px de alto frente a los 32 del logo de LiveOkey — y en hueso, no en coral:
el coral de VIBRA sobre el negro de LiveOkey es justo lo que no toca. Enlaza
a `/previa/`. No hay pie de página.

### Cómo llega a HubSpot

**Igual que la pre-release de VIBRA**: una función de servidor con el token
en variable de entorno, sin ninguna clave en el navegador y sin formulario
de HubSpot. La función vive en `netlify/functions/formulario.mjs`, recibe el
envío del navegador en `/.netlify/functions/formulario`, valida en servidor
(espejo de la validación del navegador, opciones cerradas incluidas), crea el
contacto y, si el email ya existe, lo **actualiza** en vez de duplicar. La
primera palabra del nombre va a `firstname` y el resto a `lastname`, como en
la pre-release.

Si una propiedad no existe en el portal, aquí **no** se descarta en silencio
(en la pre-release sí, porque Supabase guarda la verdad; aquí HubSpot es el
único destino): la función devuelve el error con el nombre de la propiedad y
el navegador ofrece reintentar sin perder nada.

### Antes de que funcione: dos cosas

**1. El token en Netlify.** En el panel del sitio `vibra-con-liveokey-trip`:
Site configuration → Environment variables → añadir `HUBSPOT_ACCESS_TOKEN`
con el mismo token de app privada que usa la pre-release, y redeploy.
Mientras falte, la función responde 503 y el formulario **avisa al enviar**
(«todavía no está conectado»), no falla en silencio.

**2. Nada más.** No hay que crear propiedades ni formularios en HubSpot.

### El truco del plan gratuito (solución temporal)

HubSpot Free corta en **10 propiedades personalizadas por portal** y ya están
todas ocupadas (9 de la pre-release + las del viaje que dieron tiempo a crear).
Así que las respuestas propias del viaje **no van cada una a su propiedad**:
viajan todas juntas, etiquetadas como JSON, dentro de `viaje_asturias`:

```json
{"viaje":"Asturias sept 2026","previa":"Sí","dia":"Miércoles 16",
 "nivel":"Iniciación","talla":"L","alergias":"ninguna",
 "conocido":"Otro","detalle":"…","motiva":"…"}
```

- `instagram` y `viaje_sonado` sí se escriben en sus propiedades de siempre:
  existen y significan lo mismo que en la pre-release.
- **Ninguna propiedad de la pre-release se reutiliza** (`fuente`, `carta_url`…):
  los contactos son compartidos entre proyectos y se machacarían sus datos.
- El panel del Cuaderno desempaqueta el JSON, así que los gráficos no se
  enteran del truco. El coste real: dentro de HubSpot no se puede filtrar por
  nivel o talla (para eso está el panel), y la lista de inscritos se hace con
  «viaje_asturias es conocido», que sigue funcionando.
- `como_nos_has_conocido_detalle` existe pero no se usa (el detalle va en el
  JSON): se puede archivar para recuperar un hueco.
- **Migración futura**: con plan de pago o huecos libres, se crean las 7 que
  faltan y se desempaqueta el histórico leyendo este mismo JSON. No se pierde
  nada por el camino.

**La lista de inscritos**: todos los contactos del viaje llevan la propiedad
`viaje_asturias` = «Asturias sept 2026». Una lista activa de contactos con el
filtro «Viaje Asturias es conocido» (o igual a ese valor) recoge sola a todo
el que rellene el formulario, y el mismo truco vale para Tenerife o El Palmar
clonando la propiedad.

### Las fotos

Cada paso lleva una de las fotos que ya viven en `/img/`, elegida por tema. No se
duplica ningún archivo: se apunta a las mismas que usan los dossieres, así que
heredan su caché de un año.

| Paso | Foto | De dónde |
|---|---|---|
| 1 · Quién eres | `lok-portada` | LiveOkey — la familia en el agua |
| 2 · Tu viaje | `cowork` | VIBRA — la previa es cowork |
| 3 · El surf | `surf-clase` | LiveOkey — antes de la clase |
| 4 · Lo práctico | `cocina-comuna` | VIBRA — la cocina, que es de lo que va el paso |
| 5 · Cosas sobre ti | `atardecer-mar` | VIBRA — para la parte más personal |

Van en **duotono automático**: el CSS las pasa a blanco y negro y las tiñe con los
dos colores de LiveOkey (`#0C0A09` en las sombras, `#E4796A` en las luces), así
que sirve cualquier foto y todas salen coherentes. Para cambiar una, basta con
apuntar a otro archivo: no hay que retocar nada.

Todas se sirven en **WebP** vía `<picture>` con el JPG de respaldo. `picture` va
en `display:contents` y `picture source` en `display:none`, como en los dossieres:
si no, el `<source>` genera caja y descoloca al `<img>` posicionado. Si una foto
no cargara, el hueco se pinta con un color plano de la paleta.

### Detalles que no se ven pero importan

- **Nada de `localStorage` ni `sessionStorage`.** El estado vive en memoria.
- Todos los campos son obligatorios, Instagram incluido. Los únicos valores
  opcionales de verdad son los que dependen de otra respuesta (el día de la
  previa, el detalle de «Otro»).
- El día de la previa está **siempre a la vista pero atenuado** (deshabilitado,
  42% de opacidad) hasta que responden que sí: al llegar ya se ve que ese dato
  existe. Cambiar a «No» lo apaga y limpia. Y la previa se explica con un enlace
  directo al dossier, en pestaña nueva, sin desplegable.
- Se valida al pulsar Siguiente, nunca mientras se escribe. El error sale debajo
  del campo y el foco salta al primero que falla.
- El campo de texto de «Otro» **se ve desde el principio**, colgando de la propia
  opción: al leerla ya se entiende que ahí se escribe, sin tener que pulsar nada.
  Escribir dentro marca la opción solo, y marcar la opción lleva el cursor dentro.
  Cambiar a otra respuesta lo limpia. Como ese campo vive dentro del `fieldset`,
  la validación apunta a `:scope > .err` y a los controles propios de cada caja:
  si no, el error del grupo se escribía en la caja del campo de texto.
- Enter avanza de paso; dentro de un textarea hace salto de línea.
- Si HubSpot falla, **los datos siguen en pantalla** y hay botón de reintentar.
  A la segunda, el aviso remite al grupo de WhatsApp. No se pide ni se ofrece
  ninguna dirección de correo en ninguna parte.
- Campo trampa `empresa_web`, oculto por CSS y no con `type="hidden"`: si llega
  relleno, el envío se descarta en silencio y se enseña la pantalla de gracias
  igual.
- Modo claro forzado (`color-scheme: only light` + bloque `!important` en la
  media query de oscuro), como en los dos dossieres.
- `noindex`: es un formulario de gestión, no una página de captación. El enlace
  se reparte a mano, pero lleva Open Graph para que se vea bien en WhatsApp.
- La pantalla de gracias recuerda que es **un formulario por persona**.
