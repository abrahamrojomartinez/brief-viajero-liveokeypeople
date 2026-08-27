/**
 * Diagnostico del token: quien es y que puede hacer.
 *
 * De usar y tirar. Sirve para saber, sin adivinar por el panel, a que
 * aplicacion pertenece HUBSPOT_ACCESS_TOKEN y que permisos tiene, cuando
 * la app no aparece donde uno espera.
 *
 * NUNCA imprime el token: solo su prefijo y su longitud, que es lo que
 * hace falta para reconocer de que tipo es.
 *
 * /.netlify/functions/token?llave=tvDYRmFzfARu
 */

const LLAVE = "tvDYRmFzfARu";
const TIMEOUT_MS = 10_000;

function esc(v) {
  return String(v ?? "").replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
}

async function prueba(nombre, url, opciones) {
  try {
    const r = await fetch(url, { ...opciones, signal: AbortSignal.timeout(TIMEOUT_MS) });
    const texto = await r.text();
    let datos = null;
    try { datos = JSON.parse(texto); } catch { /* no era JSON */ }
    return { nombre, estado: r.status, ok: r.ok, datos, texto: texto.slice(0, 400) };
  } catch (e) {
    return { nombre, estado: 0, ok: false, texto: `red: ${e?.message ?? e}` };
  }
}

export default async function handler(req) {
  if (new URL(req.url).searchParams.get("llave") !== LLAVE) {
    return new Response("No encontrado", { status: 404 });
  }

  const token = process.env.HUBSPOT_ACCESS_TOKEN?.trim();
  const cabecera = (extra = {}) => ({
    headers: { Authorization: `Bearer ${token}`, ...extra },
  });

  let cuerpo;
  if (!token) {
    cuerpo = `<h1>No hay token</h1>
<p>La variable <code>HUBSPOT_ACCESS_TOKEN</code> no está puesta en este sitio de Netlify.</p>`;
  } else {
    const tipo = token.startsWith("pat-na")   ? "Aplicación privada (cuenta de EE. UU. / na)"
              : token.startsWith("pat-eu")    ? "Aplicación privada (cuenta europea)"
              : token.startsWith("pat-")      ? "Aplicación privada"
              : token.startsWith("CJ") || token.startsWith("CN") ? "Token OAuth de una aplicación"
              : "Desconocido";

    const pruebas = await Promise.all([
      prueba("Quién es este token (OAuth)",
        `https://api.hubapi.com/oauth/v1/access-tokens/${encodeURIComponent(token)}`, {}),
      prueba("Quién es este token (app privada)",
        "https://api.hubapi.com/oauth/v2/private-apps/get/access-token-info",
        { method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tokenKey: token }) }),
      prueba("Datos de la cuenta",
        "https://api.hubapi.com/account-info/v3/details", cabecera()),
      prueba("LEER propiedades de contacto",
        "https://api.hubapi.com/crm/v3/properties/contacts?limit=1", cabecera()),
    ]);

    const info = pruebas.find(p => p.ok && p.datos && (p.datos.scopes || p.datos.hubId || p.datos.portalId));
    const ambitos = info?.datos?.scopes ?? null;
    const tieneEsquemas = Array.isArray(ambitos)
      ? ambitos.some(s => /crm\.schemas\.contacts\.write|^contacts$/.test(s))
      : null;

    const filasPruebas = pruebas.map(p => {
      const semaforo = p.ok ? "✅" : (p.estado === 404 ? "—" : "❌");
      return `<tr><td>${esc(p.nombre)}</td><td>${semaforo} ${p.estado || "sin respuesta"}</td>
<td><small>${esc(p.ok && p.datos ? JSON.stringify(p.datos).slice(0, 300) : p.texto)}</small></td></tr>`;
    }).join("");

    const bloqueAmbitos = ambitos
      ? `<h2>Permisos que tiene</h2>
<p>${tieneEsquemas
    ? '<b class="ok">Ya puede crear propiedades.</b> Vuelve a la página de preparación y dale a «Crear ahora».'
    : '<b class="mal">Le falta el permiso para crear propiedades</b> (<code>crm.schemas.contacts.write</code>).'}</p>
<p class="lista">${ambitos.map(s => `<code>${esc(s)}</code>`).join(" ")}</p>`
      : `<h2>Permisos</h2><p class="sub">HubSpot no ha querido decir a qué aplicación pertenece este
token. Mira la tabla de arriba: si «LEER propiedades» sale en verde, el token sirve y solo
es cuestión de permisos; si sale en rojo, el token no vale.</p>`;

    cuerpo = `<h1>Diagnóstico del token</h1>
<table>
<tr><td>Empieza por</td><td><code>${esc(token.slice(0, 7))}…</code> (${token.length} caracteres)</td></tr>
<tr><td>Parece ser</td><td><b>${esc(tipo)}</b></td></tr>
${info?.datos?.hubId || info?.datos?.portalId ? `<tr><td>Cuenta</td><td>${esc(info.datos.hubId ?? info.datos.portalId)}</td></tr>` : ""}
${info?.datos?.appId ? `<tr><td>Id de la aplicación</td><td>${esc(info.datos.appId)}</td></tr>` : ""}
${info?.datos?.userId ? `<tr><td>Usuario</td><td>${esc(info.datos.user ?? info.datos.userId)}</td></tr>` : ""}
</table>
${bloqueAmbitos}
<h2>Lo que ha contestado HubSpot</h2>
<table><tr><th>Prueba</th><th>Respuesta</th><th>Detalle</th></tr>${filasPruebas}</table>
<p class="sub">Esta página nunca enseña el token entero, solo sus primeras letras.</p>`;
  }

  return new Response(
    `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex"><title>Diagnóstico del token</title>
<style>
body{font-family:system-ui,sans-serif;background:#F7F2E9;color:#211C1E;line-height:1.55;
  max-width:760px;margin:0 auto;padding:44px 22px}
h1{font-size:26px;margin-bottom:14px}h2{font-size:18px;margin:26px 0 6px}
table{border-collapse:collapse;width:100%;margin:14px 0;font-size:14px}
td,th{text-align:left;padding:8px 10px;border-bottom:1px solid #E7DFD2;vertical-align:top}
th{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:#8A827B}
code{background:#FDFAF4;border:1px solid #E7DFD2;border-radius:5px;padding:1px 6px;font-size:12.5px}
small{color:#5E5753;word-break:break-word}
.sub{color:#5E5753;font-size:14px}.ok{color:#3E7A3E}.mal{color:#A32217}
.lista code{display:inline-block;margin:2px 2px}
</style></head><body>${cuerpo}</body></html>`,
    { headers: { "Content-Type": "text/html; charset=utf-8" } }
  );
}
