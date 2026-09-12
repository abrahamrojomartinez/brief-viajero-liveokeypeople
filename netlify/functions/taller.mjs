/**
 * Taller «Oso, Tigre y Dragón» (dinámica de propósito) → HubSpot.
 *
 * Mismo patrón y mismo token que netlify/functions/formulario.mjs: el
 * HUBSPOT_ACCESS_TOKEN vive en las variables de este sitio de Netlify y
 * nunca toca el navegador.
 *
 * DÓNDE SE GUARDA. El plan gratuito de HubSpot da 10 propiedades por
 * portal y están las 10 ocupadas, así que NO se crea ninguna: las
 * puntuaciones se meten dentro del JSON de viaje_asturias, bajo la clave
 * "animales". Eso obliga a leer primero lo que hay y fusionar, nunca
 * sobrescribir: si alguien rellenó el formulario del viaje, sus
 * respuestas están en ese mismo JSON y machacarlas sería perder datos.
 *
 * Por sesión, no por persona: "animales" guarda una entrada por sesión
 * ("viernes" y "domingo"), así el antes y el después conviven y se puede
 * medir el delta del viaje. Repetir la misma sesión sobrescribe solo esa.
 */

const API = "https://api.hubapi.com/crm/v3/objects/contacts";
const BUSCA = `${API}/search`;
const TIMEOUT_MS = 10_000;

const ANIMALES = ["oso", "tigre", "dragon"];
const SESIONES = ["viernes", "domingo"];

function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function texto(v, max = 1000) {
  return typeof v === "string" ? v.trim().slice(0, max) : "";
}

/* Un radio válido es un entero del 1 al 10. Nada más. */
function radio(v) {
  const n = typeof v === "number" ? v : Number.parseInt(v, 10);
  return Number.isInteger(n) && n >= 1 && n <= 10 ? n : null;
}

function trio(obj) {
  if (!obj || typeof obj !== "object") return null;
  const out = {};
  for (const a of ANIMALES) {
    const n = radio(obj[a]);
    if (n === null) return null;
    out[a] = n;
  }
  return out;
}

async function hubspot(token, url, method, cuerpo) {
  return fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(cuerpo),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
}

/* El JSON del viaje puede venir vacío, o no ser JSON si alguien lo editó a
   mano en HubSpot. En ese caso NO se tira: se guarda lo que había en
   "_previo" y se sigue, que perder un dato es peor que llevar basura. */
function abrePaquete(crudo) {
  const s = texto(crudo, 60_000);
  if (!s) return {};
  try {
    const p = JSON.parse(s);
    return p && typeof p === "object" && !Array.isArray(p) ? p : { _previo: s };
  } catch {
    return { _previo: s };
  }
}

export default async function handler(req) {
  if (req.method !== "POST") return json(405, { error: "METHOD" });

  let d;
  try {
    d = await req.json();
  } catch {
    return json(400, { error: "BODY" });
  }

  // Trampa para bots, como en el formulario.
  if (texto(d.empresa_web) !== "") return json(200, { ok: true });

  const nombre = texto(d.nombre, 120);
  const email = texto(d.email, 254);
  const hoy = trio(d.hoy);
  const dic = trio(d.diciembre);
  const animal = ANIMALES.includes(d.animal) ? d.animal : null;
  const compromiso = texto(d.compromiso, 500);
  const sesion = SESIONES.includes(d.sesion) ? d.sesion : "viernes";

  const faltan = [];
  if (nombre.length < 2) faltan.push("nombre");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) faltan.push("email");
  if (!hoy) faltan.push("hoy");
  if (!dic) faltan.push("diciembre");
  if (!animal) faltan.push("animal");
  if (compromiso.length < 3) faltan.push("compromiso");
  if (faltan.length > 0) return json(400, { error: "CAMPOS", campos: faltan });

  const token = process.env.HUBSPOT_ACCESS_TOKEN?.trim();
  if (!token) return json(503, { error: "NOT_CONFIGURED" });

  const entrada = {
    hoy,
    diciembre: dic,
    hambriento: animal,
    compromiso,
    ts: new Date().toISOString(),
  };

  try {
    // 1. ¿Existe ya ese email? Se pide de paso el paquete del viaje.
    const busca = await hubspot(token, BUSCA, "POST", {
      filterGroups: [
        { filters: [{ propertyName: "email", operator: "EQ", value: email }] },
      ],
      properties: ["viaje_asturias"],
      limit: 1,
    });
    if (!busca.ok) {
      const b = await busca.text();
      console.error("[taller] búsqueda falló:", busca.status, b);
      return json(502, { error: "HUBSPOT", detalle: b.slice(0, 300) });
    }
    const encontrado = (await busca.json())?.results?.[0] ?? null;

    // 2. Se fusiona: lo que ya había + esta sesión.
    const paquete = encontrado
      ? abrePaquete(encontrado.properties?.viaje_asturias)
      : {};
    if (!paquete.viaje) paquete.viaje = "Asturias sept 2026";
    const animales =
      paquete.animales && typeof paquete.animales === "object" && !Array.isArray(paquete.animales)
        ? paquete.animales
        : {};
    animales[sesion] = entrada;
    paquete.animales = animales;

    const props = { viaje_asturias: JSON.stringify(paquete) };

    // 3. Se escribe. Si el contacto es nuevo, se crea con nombre y email.
    if (encontrado) {
      const patch = await hubspot(token, `${API}/${encontrado.id}`, "PATCH", {
        properties: props,
      });
      if (patch.ok) return json(200, { ok: true, nuevo: false });
      const b = await patch.text();
      console.error("[taller] PATCH falló:", patch.status, b);
      return json(502, { error: "HUBSPOT", detalle: b.slice(0, 300) });
    }

    const [firstname, ...resto] = nombre.split(/\s+/);
    props.email = email;
    props.firstname = firstname;
    if (resto.length > 0) props.lastname = resto.join(" ");

    const post = await hubspot(token, API, "POST", { properties: props });
    if (post.ok) return json(200, { ok: true, nuevo: true });
    const b = await post.text();
    // Carrera: alguien creó el contacto entre la búsqueda y el alta.
    if (post.status === 409) {
      const id = b.match(/Existing ID:\s*(\d+)/)?.[1];
      if (id) {
        const patch = await hubspot(token, `${API}/${id}`, "PATCH", {
          properties: { viaje_asturias: props.viaje_asturias },
        });
        if (patch.ok) return json(200, { ok: true, nuevo: false });
      }
    }
    console.error("[taller] POST falló:", post.status, b);
    return json(502, { error: "HUBSPOT", detalle: b.slice(0, 300) });
  } catch (e) {
    console.error("[taller] red:", e);
    return json(502, { error: "RED" });
  }
}
