import { hoyISO } from '../whatsapp.js'
import { clinica } from '../config.js'

// El COP no tiene centavos; mostrarlos sería ruido en cada precio del panel.
const cop = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
})

export const dinero = (n) => cop.format(n ?? 0)

// Mismo criterio que la vista v_cobros: el total nunca se guarda, se suma.
export const totalCobro = (cobro) =>
  (cobro?.cobro_items ?? []).reduce((t, i) => t + i.cantidad * i.precio_unit_cop, 0)

const meses = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
]

// '2026-03-04' -> '4 de marzo de 2026'. Sin new Date(): con una fecha sin hora,
// el navegador la interpreta como UTC y en Colombia muestra el día anterior.
export function fechaLarga(iso) {
  if (!iso) return ''
  const [a, m, d] = iso.split('-')
  return `${Number(d)} de ${meses[Number(m) - 1]} de ${a}`
}

// Un timestamptz sí tiene instante propio: aquí la zona local es la correcta.
export const hora = (ts) =>
  new Date(ts).toLocaleTimeString('es-CO', { hour: 'numeric', minute: '2-digit' })

export const fechaDeISO = (ts) => new Date(ts).toISOString().slice(0, 10)

// '2020-05-17' -> '5 años 8 meses'. La edad manda en dosis y en criterio clínico,
// así que se muestra siempre que haya fecha de nacimiento.
export function edad(nacimiento, hoy = hoyISO()) {
  if (!nacimiento) return ''
  const [a1, m1, d1] = nacimiento.split('-').map(Number)
  const [a2, m2, d2] = hoy.split('-').map(Number)
  let total = (a2 - a1) * 12 + (m2 - m1) - (d2 < d1 ? 1 : 0)
  if (total < 0) return ''
  if (total === 0) return 'menos de 1 mes'
  const anios = Math.floor(total / 12)
  const resto = total % 12
  const partes = []
  if (anios) partes.push(`${anios} ${anios === 1 ? 'año' : 'años'}`)
  if (resto) partes.push(`${resto} ${resto === 1 ? 'mes' : 'meses'}`)
  return partes.join(' ')
}

// Rango [desde, hasta) en ISO para consultar citas de un día o de una semana.
export function rango(desdeISO, dias) {
  const d = new Date(`${desdeISO}T00:00:00`)
  const hasta = new Date(d)
  hasta.setDate(hasta.getDate() + dias)
  return [d.toISOString(), hasta.toISOString()]
}

// '2026-03-04T14:00:00.000Z' -> '20260304T140000Z', que es como Google quiere
// las fechas en el enlace.
const compacta = (d) => d.toISOString().replace(/[-:]|\.\d{3}/g, '')

// Enlace "añadir a Google Calendar". Mismo criterio que el click-to-chat de
// WhatsApp: es una URL, no una integración. Sin OAuth, sin tokens que renovar y
// sin un proyecto en Google Cloud que mantener. Cada quien la abre y guarda el
// evento en su propio calendario.
//
// Nota: lo que se ponga en `detalles` viaja a Google. Por eso no lleva el
// teléfono del dueño — quien atiende lo tiene en el panel.
export function enlaceCalendario({ titulo, inicio, duracionMin = 30, detalles, lugar }) {
  const ini = new Date(inicio)
  const fin = new Date(ini.getTime() + duracionMin * 60000)
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: titulo,
    dates: `${compacta(ini)}/${compacta(fin)}`,
    details: detalles ?? '',
    location: lugar ?? `${clinica.direccion}, ${clinica.ciudad}`,
  })
  return `https://calendar.google.com/calendar/render?${p}`
}

// El título y el detalle de una cita, en el formato que se guarda en el calendario.
export const citaACalendario = (cita, mascota, dueno) =>
  enlaceCalendario({
    titulo: `${mascota} · ${cita.rama === 'estilista' ? 'Estilista' : 'Clínica'} · AlmaVET`,
    inicio: cita.fecha_hora,
    duracionMin: cita.duracion_min,
    detalles: [dueno && `Dueño: ${dueno}`, cita.motivo && `Motivo: ${cita.motivo}`]
      .filter(Boolean)
      .join('\n'),
  })

// 'YYYY-MM-DD' desde un Date local. No vale toISOString(): eso pasa por UTC y en
// Colombia devuelve el día anterior para cualquier hora antes de las 7 p. m.
const iso = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export function sumarDias(desde, n) {
  const d = new Date(`${desde}T00:00:00`)
  d.setDate(d.getDate() + n)
  return iso(d)
}

// Lunes de la semana que contiene la fecha dada.
export function lunes(fecha) {
  const d = new Date(`${fecha}T00:00:00`)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return iso(d)
}

// Las columnas de la agenda: ['2026-03-02', '2026-03-03', ...].
export const diasDelRango = (desde, n) => Array.from({ length: n }, (_, i) => sumarDias(desde, i))

const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado']

// Índice fijo en vez de toLocaleDateString: el nombre del día no debe depender
// de qué locales tenga instalados el navegador que abra el panel.
export const diaSemana = (fecha) => DIAS[new Date(`${fecha}T00:00:00`).getDay()]
