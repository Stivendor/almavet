import { useState } from 'react'
import { CalendarPlus, ChevronLeft, ChevronRight } from 'lucide-react'
import { citas as leerCitas, guardarCita } from '../db.js'
import { useAsync } from '../useAsync.js'
import { Estado } from '../ui.jsx'
import {
  citaACalendario,
  diaCorto,
  diasDelRango,
  fechaLarga,
  hora,
  lunes,
  rango,
  sumarDias,
} from '../formato.js'
import { hoyISO } from '../../whatsapp.js'

const ESTADOS = ['agendada', 'confirmada', 'atendida', 'no_asistio', 'cancelada']

// Una columna por día. En semana son siete columnas con scroll horizontal en
// móvil: apilarlas obliga a bajar hasta el jueves para saber si hay algo el jueves.
export default function Agenda() {
  const [vista, setVista] = useState('semana')
  const [dia, setDia] = useState(hoyISO())

  const dias = vista === 'dia' ? 1 : 7
  const desde = vista === 'dia' ? dia : lunes(dia)
  const [ini, fin] = rango(desde, dias)
  const { datos, cargando, error, recargar } = useAsync(() => leerCitas(ini, fin), [ini, fin])

  const cambiarEstado = async (id, estado) => {
    await guardarCita(id, { estado })
    recargar()
  }

  // La cita se reparte por su día local, no por el UTC del timestamp.
  const porDia = new Map(diasDelRango(desde, dias).map((f) => [f, []]))
  for (const c of datos ?? []) {
    const clave = new Date(c.fecha_hora).toLocaleDateString('sv')
    porDia.get(clave)?.push(c)
  }
  for (const lista of porDia.values()) {
    lista.sort((a, b) => a.fecha_hora.localeCompare(b.fecha_hora))
  }

  const hoy = hoyISO()

  return (
    <>
      <div className="cabecera-vista">
        <h1>Agenda</h1>
        <div className="acciones">
          <button
            className="boton boton-mini boton-suave"
            type="button"
            aria-label={vista === 'dia' ? 'Día anterior' : 'Semana anterior'}
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
            aria-label={vista === 'dia' ? 'Día siguiente' : 'Semana siguiente'}
            onClick={() => setDia(sumarDias(dia, dias))}
          >
            <ChevronRight size={15} aria-hidden="true" />
          </button>
          <button
            className="boton boton-mini boton-suave"
            type="button"
            onClick={() => setDia(hoyISO())}
          >
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

      <p className="suave pequeno">
        {vista === 'dia'
          ? fechaLarga(desde)
          : `Del ${fechaLarga(desde)} al ${fechaLarga(sumarDias(desde, 6))}`}
      </p>

      <Estado cargando={cargando} error={error}>
        <div className={`agenda${vista === 'dia' ? ' agenda-dia' : ''}`}>
          {[...porDia].map(([fecha, citasDelDia]) => (
            <section className={`agenda-col${fecha === hoy ? ' es-hoy' : ''}`} key={fecha}>
              <h2 className="agenda-cabecera">
                {diaCorto(fecha)}
                {citasDelDia.length > 0 && (
                  <span className="agenda-conteo">{citasDelDia.length}</span>
                )}
              </h2>

              {citasDelDia.length === 0 ? (
                <p className="agenda-vacio">Sin citas</p>
              ) : (
                citasDelDia.map((c) => (
                  <article className="agenda-cita" data-estado={c.estado} key={c.id}>
                    <div className="agenda-fila">
                      <span className="agenda-hora">{hora(c.fecha_hora)}</span>
                      <a
                        className="agenda-cal"
                        href={citaACalendario(c, c.mascotas?.nombre, c.mascotas?.duenos?.nombre)}
                        target="_blank"
                        rel="noopener"
                        title="Añadir a Google Calendar"
                        aria-label={`Añadir a Google Calendar la cita de ${c.mascotas?.nombre}`}
                      >
                        <CalendarPlus size={14} aria-hidden="true" />
                      </a>
                    </div>
                    <a href={`#/mascotas/${c.mascota_id}`}>{c.mascotas?.nombre}</a>
                    <div className="pequeno suave">{c.mascotas?.duenos?.nombre}</div>
                    <div className="pequeno suave">
                      {c.rama} · {c.duracion_min} min
                      {c.motivo && ` · ${c.motivo}`}
                    </div>
                    {/* El estado va solo en el select: el chip de al lado decía
                        exactamente lo mismo y en 8.5rem no sobra ni una línea.
                        El color queda en el borde izquierdo de la tarjeta. */}
                    <select
                      className="agenda-estado"
                      aria-label={`Estado de la cita de ${c.mascotas?.nombre}`}
                      value={c.estado}
                      onChange={(e) => cambiarEstado(c.id, e.target.value)}
                    >
                      {ESTADOS.map((e) => (
                        <option key={e} value={e}>
                          {e.replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </article>
                ))
              )}
            </section>
          ))}
        </div>
      </Estado>
    </>
  )
}
