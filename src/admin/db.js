import { sb } from './cliente.js'
import { normalizarTelefono } from '../whatsapp.js'

// Todas las consultas del panel en un archivo: así se ve de un vistazo qué toca
// la app y con qué forma, en vez de repartir `.from(...)` por veinte componentes.
const ok = ({ data, error }) => {
  if (error) throw new Error(error.message)
  return data
}

export const perfil = () => sb.from('staff').select('*').maybeSingle().then(ok)

// ------------------------------------------------------------------ solicitudes
export function solicitudes(estado) {
  let q = sb
    .from('solicitudes')
    .select('*')
    .order('creada_en', { ascending: false })
    .limit(200)
  if (estado) q = q.eq('estado', estado)
  return q.then(ok)
}

export const actualizarSolicitud = (id, cambios) =>
  sb.from('solicitudes').update(cambios).eq('id', id).then(ok)

export const convertirSolicitud = (id, fechaHora, duracion, especie) =>
  sb
    .rpc('convertir_solicitud', {
      p_solicitud: id,
      p_fecha_hora: fechaHora,
      p_duracion: duracion,
      p_especie: especie || null,
    })
    .then(ok)

// ------------------------------------------------------------------ dueños
export function buscarDuenos(texto) {
  const tel = normalizarTelefono(texto)
  let q = sb
    .from('duenos')
    .select('*, mascotas(id, nombre, especie, activo)')
    .order('creado_en', { ascending: false })
    .limit(50)
  // Un teléfono completo va por igualdad (índice único); lo demás por nombre.
  if (tel) q = q.eq('telefono', tel)
  else if (texto?.trim()) q = q.ilike('nombre', `%${texto.trim()}%`)
  return q.then(ok)
}

export const dueno = (id) =>
  sb.from('duenos').select('*, mascotas(*)').eq('id', id).single().then(ok)

export const crearDueno = (datos) => sb.from('duenos').insert(datos).select().single().then(ok)

export const guardarDueno = (id, cambios) =>
  sb.from('duenos').update(cambios).eq('id', id).select().single().then(ok)

export const borrarDueno = (id) => sb.from('duenos').delete().eq('id', id).then(ok)

// ------------------------------------------------------------------ mascotas
export const mascota = (id) =>
  sb.from('mascotas').select('*, duenos(*)').eq('id', id).single().then(ok)

export const crearMascota = (datos) => sb.from('mascotas').insert(datos).select().single().then(ok)

export const guardarMascota = (id, cambios) =>
  sb.from('mascotas').update(cambios).eq('id', id).select().single().then(ok)

// ------------------------------------------------------------------ historia clínica
export const visitas = (mascotaId) =>
  sb
    .from('visitas')
    .select('*')
    .eq('mascota_id', mascotaId)
    .order('fecha', { ascending: false })
    .then(ok)

export const crearVisita = (datos) => sb.from('visitas').insert(datos).select().single().then(ok)

export const guardarVisita = (id, cambios) =>
  sb.from('visitas').update(cambios).eq('id', id).select().single().then(ok)

export const preventivos = (mascotaId) =>
  sb
    .from('preventivos')
    .select('*')
    .eq('mascota_id', mascotaId)
    .order('fecha_aplicacion', { ascending: false })
    .then(ok)

export const crearPreventivo = (datos) =>
  sb.from('preventivos').insert(datos).select().single().then(ok)

export const borrarPreventivo = (id) => sb.from('preventivos').delete().eq('id', id).then(ok)

// ------------------------------------------------------------------ agenda
export const citas = (desde, hasta) =>
  sb
    .from('citas')
    .select('*, mascotas(id, nombre, especie, duenos(id, nombre, telefono))')
    .gte('fecha_hora', desde)
    .lt('fecha_hora', hasta)
    .order('fecha_hora')
    .then(ok)

export const citasDeMascota = (mascotaId) =>
  sb
    .from('citas')
    .select('*')
    .eq('mascota_id', mascotaId)
    .order('fecha_hora', { ascending: false })
    .then(ok)

export const crearCita = (datos) => sb.from('citas').insert(datos).select().single().then(ok)

export const guardarCita = (id, cambios) =>
  sb.from('citas').update(cambios).eq('id', id).select().single().then(ok)

// ------------------------------------------------------------------ dinero
export function procedimientos(soloActivos = true) {
  let q = sb.from('procedimientos').select('*').order('categoria').order('nombre')
  if (soloActivos) q = q.eq('activo', true)
  return q.then(ok)
}

export const crearProcedimiento = (datos) =>
  sb.from('procedimientos').insert(datos).select().single().then(ok)

export const guardarProcedimiento = (id, cambios) =>
  sb.from('procedimientos').update(cambios).eq('id', id).select().single().then(ok)

// Se consulta la tabla con sus líneas embebidas en vez de la vista v_cobros: el
// total se suma en el cliente con totalCobro() y así no se depende de que
// PostgREST infiera la relación de una vista hacia mascotas.
export const cobrosDeMascota = (mascotaId) =>
  sb
    .from('cobros')
    .select('*, cobro_items(*)')
    .eq('mascota_id', mascotaId)
    .order('fecha', { ascending: false })
    .then(ok)

export const cobrosDelDia = (fecha) =>
  sb
    .from('cobros')
    .select('*, cobro_items(*), mascotas(id, nombre, duenos(nombre))')
    .eq('fecha', fecha)
    .order('creado_en', { ascending: false })
    .then(ok)

// El agregado sí sale de la vista: sumar por método en SQL es una consulta, y en
// el cliente serían todas las filas del día viajando para sumarlas dos veces.
export const cajaDelDia = (fecha) => sb.from('v_caja_dia').select('*').eq('fecha', fecha).then(ok)

// El cobro y sus líneas entran juntos o no entra ninguno: un cobro sin items es
// un cobro de cero pesos que descuadra la caja del día.
export const crearCobro = (cobro, items) =>
  sb.rpc('crear_cobro', { p_cobro: cobro, p_items: items }).then(ok)

export const anularCobro = (id) =>
  sb.from('cobros').update({ estado: 'anulado' }).eq('id', id).then(ok)

// ------------------------------------------------------------------ recordatorios
export const recordatorios = () =>
  sb.from('v_recordatorios').select('*').order('proxima_dosis').limit(200).then(ok)

// ------------------------------------------------------------------ tablero
// Cuatro cifras en una sola ida: `head: true` trae el conteo sin las filas.
export async function resumen(hoy) {
  const [nuevas, hoyCitas, avisos, caja] = await Promise.all([
    sb.from('solicitudes').select('id', { count: 'exact', head: true }).eq('estado', 'nueva'),
    citas(`${hoy}T00:00:00`, `${hoy}T23:59:59`),
    sb.from('v_recordatorios').select('id', { count: 'exact', head: true }),
    cajaDelDia(hoy),
  ])
  if (nuevas.error) throw new Error(nuevas.error.message)
  if (avisos.error) throw new Error(avisos.error.message)
  return {
    solicitudesNuevas: nuevas.count ?? 0,
    citasHoy: hoyCitas,
    recordatorios: avisos.count ?? 0,
    cajaHoy: caja.reduce((t, f) => t + f.total_cop, 0),
  }
}
