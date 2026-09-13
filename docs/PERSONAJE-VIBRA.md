# El personaje de VIBRA

Cinco recortes de Abraham en neopreno, con fondo transparente, para usar como
guía a lo largo de una página. Ya están en producción en la landing de
comunidades (`descubre-tu-clic.netlify.app/metodo-vibra`).

## Los archivos

En `img/`, servidos desde `/img/…` (les aplica la caché de un año de
`netlify.toml`, así que **no cambies sus nombres** si los reemplazas):

| Archivo | Pose | Para qué |
|---|---|---|
| `pj-1-presenta.webp` | de pie, palma abierta hacia su derecha | presentar algo que está a su lado |
| `pj-2-senala.webp` | índice señalando a su derecha | apuntar a un texto o a una lista |
| `pj-3-tres.webp` | mano arriba con tres dedos | "son tres pasos" |
| `pj-4-pregunta.webp` | brazos cruzados, ceja levantada | "pregúntame" / dudas |
| `pj-5-invita.webp` | mano extendida hacia el lector | invitar a pulsar algo |

250 KB los cinco. WebP con canal alfa (soporte universal).

## La regla que hay que respetar

**Las cinco comparten un lienzo de 560×1007 px.** Dentro de ese lienzo, el
cuerpo mide exactamente 900 px de coronilla a pies y está anclado **abajo a la
izquierda**. Eso está hecho a propósito y tiene una consecuencia práctica:

> **Dimensiona siempre por `height`, nunca por `width`.**
> `height: 200px; width: auto;`

Así el cuerpo sale igual de grande en las cinco poses y **los pies caen siempre
en la misma línea**, gesticule lo que gesticule. Si las dimensionas por ancho,
el personaje encoge y crece de sección en sección, porque cada pose ocupa un
ancho distinto (la del dedo señalando llega más lejos que la de brazos
cruzados).

El espacio vacío a la derecha del lienzo no es un error: es hacia donde va el
gesto. Si necesitas pegarlo a algo, usa márgenes negativos.

Para que mire hacia el otro lado: `transform: scaleX(-1)`.

## Esta web es oscura: lo que cambia

El brief del viaje va sobre `--bg:#12100F` con acento `--ac:#BC2813`, no sobre
la crema de VIBRA. Comprobado sobre ese negro: **se ve bien tal cual**, porque
la cara, las manos, los pies y los brillos del neopreno dan contraste de sobra.
Lo que se pierde un poco es el contorno de las piernas.

Si hace falta separarlo del fondo, un reborde muy fino y nada más — con más de
2 px se nota el halo y queda peor que sin nada:

```css
filter: drop-shadow(0 16px 24px rgba(0,0,0,.55))
        drop-shadow(0 0 2px rgba(245,241,236,.45));
```

## Maquetación

Contenedor en `display:flex; align-items:flex-end` (personaje + caja), con el
personaje en `flex:none` y márgenes negativos para que pise el borde y asome
por arriba. En móvil conviene sacarlo del flujo (`position:absolute`, anclado
abajo a la izquierda) o ponerlo encima de la caja.

Dos cosas que costaron y conviene no repetir:

1. **Deja aire por arriba.** El personaje asoma ~64 px por encima de la caja;
   sin margen superior extra, la cabeza pisa el párrafo anterior.
2. **Cuidado con el ancho en móvil.** Si lo pones al lado de una caja con
   contenido que no se puede estrechar, por debajo de ~820 px sácalo del flujo.

## Dónde encaja en el viaje — y dónde no

**Donde sí:**

- **El paso "El surf" del formulario** (`formulario/index.html`, `#h3t`). Es el
  encaje literal: el personaje va en neopreno. `pj-1-presenta` presentando la
  pregunta. Si solo se pone en un sitio, que sea este.
- **"Ya estás dentro"** (`#hg`), al terminar el formulario. `pj-5-invita`
  espejado, señalando lo que toca hacer después.
- **"Qué nos espera"** en el `index.html`, si se quiere que aparezca también en
  el brief y no solo en el formulario.

**Donde no:**

- **El hero del brief.** Lleva foto a pantalla completa con velo; meter un
  recorte encima es ruido sobre ruido.
- **En los cinco pasos del formulario.** Es un formulario que la gente rellena
  con prisa desde el móvil; repetirlo en todas las pantallas lo convierte en
  decoración y estorba.

## Si hacen falta más poses

Se generan con un modelo de imagen a partir de una foto de Abraham de cuerpo
entero, pidiendo **PNG con fondo transparente**, cuerpo completo sin cortar
pies ni manos, tres cuartos, y **usando una pose ya buena como referencia** para
que no cambie la cara entre poses. Después hay que normalizarlas al lienzo
común: medir de coronilla a pies, escalar para que el cuerpo mida 900 px y
pegarlas ancladas abajo a la izquierda en un lienzo de 560×1007. Si no se
normalizan, no se pueden intercambiar con estas.

Un aviso del recorte: si la herramienta entrega el tablero de ajedrez
**pintado** en vez de transparencia real, los huecos cerrados (el que dejan el
brazo y la cadera, por ejemplo) no se limpian quitando solo lo que toca el
borde. Hay que descartar además cualquier región clara que mezcle las dos
casillas del tablero.
