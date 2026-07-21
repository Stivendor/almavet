import { normalizarTelefono } from './whatsapp.js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

// La BD valida las listas de valores con CHECK, y '' no está en ninguna.
const oNull = (v) => (String(v ?? '').trim() ? v : null)

// ponytail: un POST al Data API no justifica supabase-js (+54 kB gzip de auth,
// realtime y storage que esta página no usa). Cuando exista el CRM, ese sí lo
// necesita — pero como app aparte, no cargándoselo a la landing.
export function guardarSolicitud(f) {
  // Sin credenciales el sitio sigue funcionando: guardar la solicitud es un
  // extra, nunca un punto de falla del flujo de WhatsApp.
  if (!url || !key) return

  fetch(`${url}/rest/v1/solicitudes`, {
    method: 'POST',
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    // Sobrevive a que el navegador descarte la página al saltar a WhatsApp.
    keepalive: true,
    body: JSON.stringify({
      rama: f.rama,
      nombre_dueno: f.nombreDueno.trim(),
      telefono: normalizarTelefono(f.telefono),
      nombre_mascota: f.nombreMascota.trim(),
      tipo_mascota: oNull(f.tipoMascota),
      tamano: oNull(f.tamano),
      servicio: oNull(f.servicio),
      fecha_preferida: oNull(f.fecha),
      comentarios: oNull(f.comentarios),
      motivo: oNull(f.motivo),
      sintomas: oNull(f.sintomas),
      fecha_consulta: oNull(f.fechaConsulta),
      franja: oNull(f.franja),
      urgente: Boolean(f.urgente),
    }),
  })
    .then(async (r) => {
      if (!r.ok) console.error('No se pudo guardar la solicitud:', r.status, await r.text())
    })
    .catch((e) => console.error('No se pudo guardar la solicitud:', e))
}
