import { clinica } from './config.js'

// 'YYYY-MM-DD' -> 'DD/MM/YYYY' (sin new Date(), que corre un día por zona horaria)
export function formatoFecha(iso) {
  if (!iso) return ''
  const [a, m, d] = iso.split('-')
  return `${d}/${m}/${a}`
}

// '320 438 7439', '+57 320 438 7439' o '3204387439' -> '+573204387439'.
// null si no es un celular colombiano (10 dígitos que empiezan por 3).
export function normalizarTelefono(v) {
  const digitos = String(v ?? '').replace(/\D/g, '')
  const local = digitos.length === 12 && digitos.startsWith('57') ? digitos.slice(2) : digitos
  return /^3\d{9}$/.test(local) ? `+57${local}` : null
}

// '+573204387439' -> '320 438 7439'. Espera un valor ya normalizado.
export function formatoTelefono(e164) {
  const l = e164.slice(3)
  return `${l.slice(0, 3)} ${l.slice(3, 6)} ${l.slice(6)}`
}

export function hoyISO() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Une líneas descartando las de campos opcionales vacíos.
const lineas = (...ls) => ls.filter(Boolean).join('\n')

export function construirMensaje(f) {
  // Solo se muestra cuando ya es un número válido: así la vista previa no
  // parpadea con teléfonos a medio escribir.
  const tel = normalizarTelefono(f.telefono)
  if (f.rama === 'estilista') {
    const detalle = [f.tipoMascota, f.tamano && `tamaño ${f.tamano}`].filter(Boolean).join(', ')
    return lineas(
      `Hola, soy ${f.nombreDueno}. Quiero agendar un servicio de *Estilista* para mi mascota ${f.nombreMascota}${detalle ? ` (${detalle})` : ''}.`,
      f.servicio && `Servicio: ${f.servicio}`,
      f.fecha && `Fecha preferida: ${formatoFecha(f.fecha)}`,
      f.comentarios && `Comentarios: ${f.comentarios}`,
      tel && `Teléfono: ${formatoTelefono(tel)}`
    )
  }
  return lineas(
    `Hola, soy ${f.nombreDueno}. Quiero agendar una *consulta clínica* para mi mascota ${f.nombreMascota}.`,
    f.motivo && `Motivo: ${f.motivo}`,
    f.sintomas && `Síntomas: ${f.sintomas}`,
    `¿Urgente?: ${f.urgente ? 'sí' : 'no'}`,
    f.fechaConsulta && `Fecha deseada para la consulta: ${formatoFecha(f.fechaConsulta)}`,
    f.franja && `Franja horaria preferida: ${f.franja}`,
    tel && `Teléfono: ${formatoTelefono(tel)}`
  )
}

export const enlaceWhatsApp = (texto) =>
  `https://wa.me/${clinica.whatsapp}?text=${encodeURIComponent(texto)}`

// Al revés que el anterior: la clínica le escribe a un cliente. Lo usa el panel
// para contactar solicitudes y mandar recordatorios de refuerzos sin pagar la
// API de WhatsApp Business — es el mismo click-to-chat, con otro destinatario.
export const enlaceWhatsAppA = (telefonoE164, texto) =>
  `https://wa.me/${String(telefonoE164).replace(/\D/g, '')}?text=${encodeURIComponent(texto)}`
