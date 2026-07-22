import { useState } from 'react'
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react'
import { citas as leerCitas } from '../db.js'
import { useAsync } from '../useAsync.js'
import { Estado } from '../ui.jsx'
import { DialogoCita } from './formularios.jsx'
import { TarjetaCita } from './TarjetaCita.jsx'
import { diaCorto, diasDelRango, fechaLarga, lunes, rango, sumarDias } from '../formato.js'
import { hoyISO } from '../../whatsapp.js'

// Una columna por día. En semana son siete columnas que se envuelven si no caben.
export default function Agenda() {
  const [vista, setVista] = useState('semana')
  const [dia, setDia] = useState(hoyISO())
  const [creando, setCreando] = useState(false)

  const dias = vista === 'dia' ? 1 : 7
  const desde = vista === 'dia' ? dia : lunes(dia)
  const [ini, fin] = rango(desde, dias)
  const { datos, cargando, error, recargar } = useAsync(() => leerCitas(ini, fin), [ini, fin])

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
        <button className="boton boton-mini" type="button" onClick={() => setCreando(true)}>
          <Plus size={15} aria-hidden="true" /> Nueva cita
        </button>
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
                citasDelDia.map((c) => <TarjetaCita key={c.id} cita={c} alCambiar={recargar} />)
              )}
            </section>
          ))}
        </div>
      </Estado>

      {creando && (
        <DialogoCita
          fechaInicial={dia}
          onCerrar={() => setCreando(false)}
          onListo={() => {
            setCreando(false)
            recargar()
          }}
        />
      )}
    </>
  )
}
