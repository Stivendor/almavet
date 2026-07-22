import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { citas as leerCitas, guardarCita } from '../db.js'
import { useAsync } from '../useAsync.js'
import { Chip, Estado } from '../ui.jsx'
import { agruparPorHora, fechaLarga, lunes, rango } from '../formato.js'
import { hoyISO } from '../../whatsapp.js'

const ESTADOS = ['agendada', 'confirmada', 'atendida', 'no_asistio', 'cancelada']

const sumarDias = (iso, n) => {
  const d = new Date(`${iso}T00:00:00`)
  d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// Lista agrupada por hora, no rejilla de calendario: con dos ramas y horario de
// 10 a 19 la rejilla es más código y se lee peor en el móvil del mostrador.
export default function Agenda() {
  const [vista, setVista] = useState('dia')
  const [dia, setDia] = useState(hoyISO())

  const dias = vista === 'dia' ? 1 : 7
  const desde = vista === 'dia' ? dia : lunes(dia)
  const [ini, fin] = rango(desde, dias)
  const { datos, cargando, error, recargar } = useAsync(() => leerCitas(ini, fin), [ini, fin])

  const cambiarEstado = async (id, estado) => {
    await guardarCita(id, { estado })
    recargar()
  }

  // Un día por bloque, tanto en vista de día como de semana.
  const porDia = new Map()
  for (const c of datos ?? []) {
    const clave = new Date(c.fecha_hora).toLocaleDateString('sv')
    if (!porDia.has(clave)) porDia.set(clave, [])
    porDia.get(clave).push(c)
  }

  return (
    <>
      <div className="cabecera-vista">
        <h1>Agenda</h1>
        <div className="acciones">
          <button
            className="boton boton-mini boton-suave"
            type="button"
            aria-label="Anterior"
            onClick={() => setDia(sumarDias(dia, -dias))}
          >
            <ChevronLeft size={15} aria-hidden="true" />
          </button>
          <input
            type="date"
            aria-label="Fecha"
            value={dia}
            onChange={(e) => setDia(e.target.value)}
            style={{ width: 'auto' }}
          />
          <button
            className="boton boton-mini boton-suave"
            type="button"
            aria-label="Siguiente"
            onClick={() => setDia(sumarDias(dia, dias))}
          >
            <ChevronRight size={15} aria-hidden="true" />
          </button>
          <button className="boton boton-mini boton-suave" type="button" onClick={() => setDia(hoyISO())}>
            Hoy
          </button>
          <select
            aria-label="Rango"
            value={vista}
            onChange={(e) => setVista(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="dia">Día</option>
            <option value="semana">Semana</option>
          </select>
        </div>
      </div>

      <Estado cargando={cargando} error={error}>
        {datos?.length === 0 ? (
          <p className="aviso">No hay citas en este rango.</p>
        ) : (
          [...porDia].map(([fecha, citasDelDia]) => (
            <section key={fecha} style={{ marginBottom: '1.5rem' }}>
              <h2>{fechaLarga(fecha)}</h2>
              {agruparPorHora(citasDelDia).map(([franja, enEsaHora]) => (
                <div className="tarjeta" key={franja}>
                  <h3>{franja}</h3>
                  {enEsaHora.map((c) => (
                    <div className="cabecera-vista" key={c.id} style={{ marginBottom: '0.35rem' }}>
                      <a href={`#/mascotas/${c.mascota_id}`}>{c.mascotas?.nombre}</a>
                      <span className="suave pequeno">
                        {c.mascotas?.duenos?.nombre} · {c.rama} · {c.duracion_min} min
                        {c.motivo && ` · ${c.motivo}`}
                      </span>
                      <select
                        aria-label={`Estado de la cita de ${c.mascotas?.nombre}`}
                        value={c.estado}
                        onChange={(e) => cambiarEstado(c.id, e.target.value)}
                        style={{ width: 'auto' }}
                      >
                        {ESTADOS.map((e) => (
                          <option key={e} value={e}>
                            {e.replace('_', ' ')}
                          </option>
                        ))}
                      </select>
                      <Chip valor={c.estado} />
                    </div>
                  ))}
                </div>
              ))}
            </section>
          ))
        )}
      </Estado>
    </>
  )
}
