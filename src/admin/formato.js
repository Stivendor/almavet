import { hoyISO } from '../whatsapp.js'

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

// Citas del día agrupadas por hora, en orden. La agenda se lee así en voz alta:
// "a las 10 tienes tres". Devuelve [['10:00 a. m.', [cita, ...]], ...].
export function agruparPorHora(citas) {
  const grupos = new Map()
  for (const c of [...citas].sort((x, y) => x.fecha_hora.localeCompare(y.fecha_hora))) {
    const clave = hora(c.fecha_hora)
    if (!grupos.has(clave)) grupos.set(clave, [])
    grupos.get(clave).push(c)
  }
  return [...grupos]
}

// Rango [desde, hasta) en ISO para consultar citas de un día o de una semana.
export function rango(desdeISO, dias) {
  const d = new Date(`${desdeISO}T00:00:00`)
  const hasta = new Date(d)
  hasta.setDate(hasta.getDate() + dias)
  return [d.toISOString(), hasta.toISOString()]
}

// Lunes de la semana que contiene la fecha dada.
export function lunes(iso) {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
