/**
 * Formulario del viaje Asturias 2026 → HubSpot.
 *
 * Mismo patrón que la pre-release de VIBRA (lib/hubspot.ts): el token vive
 * en la variable de entorno HUBSPOT_ACCESS_TOKEN de ESTE sitio de Netlify
 * (vibra-con-liveokey-trip) y nunca toca el navegador. Se crea el contacto
 * y, si ya existe (mismo email), se actualiza: sin duplicados.
 *
 * Diferencia deliberada con la pre-release: allí, si una propiedad no
 * existe en el portal, se quita y se reintenta, porque Supabase guarda la
 * verdad. Aquí HubSpot es el ÚNICO destino, así que una propiedad que
 * falta es un error que se devuelve con su nombre, no un dato que se
 * pierde en silencio.
 */

const HUBSPOT_API = "https://api.hubapi.com/crm/v3/objects/contacts";
const TIMEOUT_MS = 10_000;

/* Qué acepta el formulario. Cualquier otra cosa se ignora. */
const OPCIONES = {
  previa: ["Sí", "No"],
  dia: ["Miércoles 16", "Jueves 17"],
  nivel: ["Debutante", "Iniciación", "Intermedio", "Avanzado"],
  talla: ["S", "M", "L", "XL", "Tengo mi propio neopreno"],
  conocido: ["Por Instagram de VIBRA", "Por Instagram de LiveOkey", "Otro"],
};

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function texto(v, max = 1000) {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

function construyeProps(d) {
  // Como en la pre-release: primera palabra al nombre, el resto al apellido.
  const [firstname, ...resto] = texto(d.nombre, 120).split(/\s+/);
  const props = {
    email: texto(d.email, 254),
    firstname,
    city: texto(d.ciudad, 120),
    mobilephone: texto(d.movil, 40),
    instagram: texto(d.instagram, 120),
    previa_vibra: d.previa,
    nivel_surf: d.nivel,
    talla_neopreno: d.talla,
    alergias_restricciones: texto(d.alergias),
    como_nos_has_conocido: d.conocido,
    motivacion_viaje: texto(d.motivacion, 3000),
    viaje_sonado: texto(d.sonado, 3000),
    viaje_asturias: "Asturias sept 2026",
  };
  if (resto.length > 0) props.lastname = resto.join(" ");
  if (d.previa === "Sí") props.previa_dia_inicio = d.dia;
  if (d.conocido === "Otro") props.como_nos_has_conocido_detalle = texto(d.detalle, 500);
  return props;
}

function propietariaQueFalta(body) {
  // HubSpot dice: Property "nivel_surf" does not exist. En el cuerpo JSON
  // esas comillas llegan escapadas (\"), asi que se admiten las dos formas.
  if (!/PROPERTY_DOESNT_EXIST|does not exist/i.test(body)) return null;
  return body.match(/propert(?:y|ies)[^"]*\\?"([a-z0-9_]+)\\?"/i)?.[1] ?? "(sin identificar)";
}

async function hubspot(token, url, method, properties) {
  return fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ properties }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
}

export default async function handler(req) {
  if (req.method !== "POST") return json(405, { error: "METHOD" });

  let d;
  try {
    d = await req.json();
  } catch {
    return json(400, { error: "BODY" });
  }

  // Trampa para bots: si viene rellena, fingimos que todo fue bien.
  if (texto(d.empresa_web) !== "") return json(200, { ok: true });

  // Validación de servidor: espejo de la del navegador.
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(texto(d.email));
  const faltan = [];
  if (texto(d.nombre).length < 2) faltan.push("nombre");
  if (!emailOk) faltan.push("email");
  if (texto(d.ciudad).length < 2) faltan.push("ciudad");
  if (texto(d.movil).replace(/\D/g, "").length < 9) faltan.push("movil");
  if (texto(d.instagram).length < 2) faltan.push("instagram");
  for (const [campo, valores] of Object.entries(OPCIONES)) {
    if (campo === "dia" && d.previa !== "Sí") continue;
    if (!valores.includes(d[campo])) faltan.push(campo);
  }
  if (texto(d.alergias).length < 2) faltan.push("alergias");
  if (d.conocido === "Otro" && texto(d.detalle).length < 2) faltan.push("detalle");
  if (texto(d.motivacion).length < 3) faltan.push("motivacion");
  if (texto(d.sonado).length < 3) faltan.push("sonado");
  if (d.consent !== true) faltan.push("consent");
  if (faltan.length > 0) return json(400, { error: "CAMPOS", campos: faltan });

  const token = process.env.HUBSPOT_ACCESS_TOKEN?.trim();
  if (!token) return json(503, { error: "NOT_CONFIGURED" });

  const props = construyeProps(d);

  try {
    const res = await hubspot(token, HUBSPOT_API, "POST", props);
    if (res.ok) return json(200, { ok: true });
    const body = await res.text();

    // 409 → ya existe ese email → se actualiza en vez de duplicar.
    if (res.status === 409) {
      const id = body.match(/Existing ID:\s*(\d+)/)?.[1];
      if (!id) return json(502, { error: "HUBSPOT", detalle: body.slice(0, 300) });
      const patch = await hubspot(token, `${HUBSPOT_API}/${id}`, "PATCH", props);
      if (patch.ok) return json(200, { ok: true });
      const patchBody = await patch.text();
      const falta = propietariaQueFalta(patchBody);
      if (falta) return json(502, { error: "PROPIEDAD", propiedad: falta });
      console.error("[formulario] PATCH falló:", patch.status, patchBody);
      return json(502, { error: "HUBSPOT", detalle: patchBody.slice(0, 300) });
    }

    const falta = propietariaQueFalta(body);
    if (falta) return json(502, { error: "PROPIEDAD", propiedad: falta });
    console.error("[formulario] POST falló:", res.status, body);
    return json(502, { error: "HUBSPOT", detalle: body.slice(0, 300) });
  } catch (e) {
    console.error("[formulario] red:", e);
    return json(502, { error: "RED" });
  }
}
