/**
 * Preparacion del portal de HubSpot para el formulario del viaje: crea de
 * una vez las propiedades de contacto que faltan. De un solo uso, pero
 * inofensiva si se abre mas veces: lo que ya existe se deja tal cual.
 *
 * Se abre en el navegador con su llave en la URL:
 *   /.netlify/functions/preparar?llave=tvDYRmFzfARu
 * Primero ensena lo que va a crear; el enlace "Crear ahora" lo ejecuta.
 *
 * La llave va escrita aqui a proposito (no en una variable de Netlify): no
 * protege nada valioso —crear propiedades es aditivo, no borra nada— pero
 * evita que la pagina quede abierta a cualquiera que adivine la ruta. Misma
 * idea que el BACKFILL_TOKEN de la pre-release. Cuando el portal ya este
 * preparado, esta funcion se puede borrar del repo.
 *
 * Necesita HUBSPOT_ACCESS_TOKEN (la misma variable que usa el envio del
 * formulario) y que la app privada del token tenga el permiso de esquemas
 * de contactos (crm.schemas.contacts.write). Si falta, el informe lo dice
 * con el remedio, no falla en silencio.
 */

const LLAVE = "tvDYRmFzfARu";
const API = "https://api.hubapi.com/crm/v3/properties/contacts";
const TIMEOUT_MS = 10_000;

/* Las 9 que faltan. viaje_sonado ya existe en el portal (la usa la
   pre-release de VIBRA) y por eso no esta aqui. Los valores de las
   opciones son EXACTAMENTE los que envia el formulario, tildes incluidas. */
const PROPIEDADES = [
  { name: "previa_vibra", label: "Previa VIBRA", type: "enumeration", fieldType: "select",
    options: ["Sí", "No"] },
  { name: "previa_dia_inicio", label: "Previa · día de inicio", type: "enumeration", fieldType: "select",
    options: ["Miércoles 16", "Jueves 17"] },
  { name: "nivel_surf", label: "Nivel de surf", type: "enumeration", fieldType: "select",
    options: ["Debutante", "Iniciación", "Intermedio", "Avanzado"] },
  { name: "talla_neopreno", label: "Talla de neopreno", type: "enumeration", fieldType: "select",
    options: ["S", "M", "L", "XL", "Tengo mi propio neopreno"] },
  { name: "alergias_restricciones", label: "Alergias y restricciones", type: "string", fieldType: "textarea" },
  { name: "como_nos_has_conocido", label: "Cómo nos has conocido", type: "enumeration", fieldType: "select",
    options: ["Por Instagram de VIBRA", "Por Instagram de LiveOkey", "Otro"] },
  { name: "como_nos_has_conocido_detalle", label: "Cómo nos has conocido · detalle", type: "string", fieldType: "text" },
  { name: "motivacion_viaje", label: "Motivación del viaje", type: "string", fieldType: "textarea" },
  { name: "viaje_asturias", label: "Viaje Asturias", type: "string", fieldType: "text" },
];

function pagina(titulo, cuerpo) {
  return new Response(
    `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>${titulo}</title>
<style>
body{font-family:system-ui,sans-serif;background:#F7F2E9;color:#211C1E;line-height:1.55;
  max-width:680px;margin:0 auto;padding:44px 22px}
h1{font-size:26px;margin-bottom:6px}
p{margin:10px 0}
.sub{color:#5E5753}
table{border-collapse:collapse;width:100%;margin:20px 0;font-size:14.5px}
td,th{text-align:left;padding:8px 10px;border-bottom:1px solid #E7DFD2;vertical-align:top}
th{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#8A827B}
code{background:#FDFAF4;border:1px solid #E7DFD2;border-radius:5px;padding:1px 6px;font-size:13px}
.ok{color:#3E7A3E;font-weight:600}.ya{color:#8A827B}.mal{color:#A32217;font-weight:600}
.btn{display:inline-block;margin-top:14px;background:#E8724C;color:#fff;font-weight:700;
  text-decoration:none;padding:13px 26px;border-radius:100px}
.aviso{background:#FDFAF4;border:1px solid #E7DFD2;border-left:3px solid #E8724C;
  border-radius:10px;padding:13px 16px;margin:18px 0;font-size:14.5px}
</style></head><body>${cuerpo}</body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}

async function hs(token, url, method, body) {
  return fetch(url, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });
}

export default async function handler(req) {
  const url = new URL(req.url);
  if (url.searchParams.get("llave") !== LLAVE) {
    return new Response("No encontrado", { status: 404 });
  }

  const token = process.env.HUBSPOT_ACCESS_TOKEN?.trim();
  if (!token) {
    return pagina("Falta el token", `<h1>Falta el token</h1>
<p>Todavía no está la variable <code>HUBSPOT_ACCESS_TOKEN</code> en este sitio de Netlify.</p>
<p class="sub">Panel de Netlify → vibra-con-liveokey-trip → Site configuration →
Environment variables → añade <code>HUBSPOT_ACCESS_TOKEN</code> con el mismo token que
usa el sitio de la pre-release, redespliega y vuelve a abrir esta página.</p>`);
  }

  const quiere = url.searchParams.get("crear") === "si";
  if (!quiere) {
    const filas = PROPIEDADES.map(p =>
      `<tr><td><code>${p.name}</code></td><td>${p.label}</td>
<td>${p.options ? p.options.join(" · ") : (p.fieldType === "textarea" ? "texto multilínea" : "texto")}</td></tr>`).join("");
    return pagina("Preparar HubSpot", `<h1>Preparar HubSpot para el viaje</h1>
<p class="sub">Esto crea en tu portal las propiedades de contacto que necesita el formulario
de Asturias. Lo que ya exista se deja tal cual, así que abrirlo dos veces no rompe nada.
(<code>viaje_sonado</code> no está en la lista: ya existe, la usa la pre-release.)</p>
<table><tr><th>Propiedad</th><th>Etiqueta</th><th>Opciones</th></tr>${filas}</table>
<a class="btn" href="?llave=${LLAVE}&crear=si">Crear ahora →</a>`);
  }

  const resultados = [];
  for (const p of PROPIEDADES) {
    try {
      const mira = await hs(token, `${API}/${p.name}`, "GET");
      if (mira.ok) { resultados.push({ p, estado: "ya" }); continue; }
      if (mira.status !== 404) {
        const t = await mira.text();
        resultados.push({ p, estado: "mal", detalle: `${mira.status}: ${t.slice(0, 200)}` });
        continue;
      }
      const cuerpo = {
        name: p.name, label: p.label, type: p.type, fieldType: p.fieldType,
        groupName: "contactinformation",
        ...(p.options ? { options: p.options.map((o, i) => ({ label: o, value: o, displayOrder: i })) } : {}),
      };
      const crea = await hs(token, API, "POST", cuerpo);
      if (crea.ok) { resultados.push({ p, estado: "ok" }); continue; }
      const t = await crea.text();
      const sinPermiso = crea.status === 403 || /MISSING_SCOPES|scope/i.test(t);
      resultados.push({ p, estado: "mal", detalle: `${crea.status}: ${t.slice(0, 200)}`, sinPermiso });
    } catch (e) {
      resultados.push({ p, estado: "mal", detalle: `red: ${e?.message ?? e}` });
    }
  }

  const creadas = resultados.filter(r => r.estado === "ok").length;
  const habia   = resultados.filter(r => r.estado === "ya").length;
  const fallos  = resultados.filter(r => r.estado === "mal");
  const filas = resultados.map(r => {
    const txt = r.estado === "ok" ? '<span class="ok">creada ✓</span>'
      : r.estado === "ya" ? '<span class="ya">ya existía</span>'
      : `<span class="mal">error</span><br><small>${(r.detalle || "").replace(/</g, "&lt;")}</small>`;
    return `<tr><td><code>${r.p.name}</code></td><td>${txt}</td></tr>`;
  }).join("");

  const avisoScope = fallos.some(f => f.sinPermiso) ? `<div class="aviso">
<b>Al token le falta un permiso.</b> En HubSpot: Ajustes → Integraciones → Aplicaciones
privadas → tu aplicación → Ámbitos (scopes) → activa
<code>crm.schemas.contacts.write</code>, guarda, y vuelve a abrir esta página.
El token no cambia: no hay que tocar Netlify.</div>` : "";

  const remate = fallos.length === 0 ? `<div class="aviso"><b>Todo listo.</b> El formulario ya
puede enviar y el panel del viaje ya puede leer. Haz un envío de prueba y compruébalo.</div>` : "";

  return pagina("Resultado", `<h1>Resultado</h1>
<p class="sub">${creadas} creadas · ${habia} ya existían · ${fallos.length} con error</p>
<table><tr><th>Propiedad</th><th>Estado</th></tr>${filas}</table>
${avisoScope}${remate}
<p class="sub">Abrir esta página otra vez es seguro: lo existente no se toca.</p>`);
}
