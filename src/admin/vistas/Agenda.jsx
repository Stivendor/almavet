import { useState } from 'react'
import { CalendarPlus, ChevronLeft, ChevronRight, MessageCircle, Plus } from 'lucide-react'
import { citas as leerCitas, crearVisita, guardarCita } from '../db.js'
import { useAsync } from '../useAsync.js'
import { Dialogo, Estado } from '../ui.jsx'
import { avisar } from '../avisos.js'
import { DialogoCita, FormCobro, FormVisita } from './formularios.jsx'
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
import { enlaceWhatsAppA, hoyISO } from '../../whatsapp.js'
import { clinica } from '../../config.js'

const ESTADOS = ['agendada', 'confirmada', 'atendida', 'no_asistio', 'cancelada']

// Confirmar las citas por WhatsApp es tarea diaria: mensaje ya redactado.
const mensajeConfirmacion = (c) =>
  `Hola ${c.mascotas?.duenos?.nombre}, te escribimos del ${clinica.nombre}. ` +
  `Te recordamos la cita de ${c.mascotas?.nombre} el ` +
  `${fechaLarga(new Date(c.fecha_hora).toLocaleDateString('sv'))} a las ${hora(c.fecha_hora)}. ` +
  `¿Nos confirmas que pueden venir?`

// Una columna por día. En semana son siete columnas que se envuelven si no caben.
export default function Agenda() {
  const [vista, setVista] = useState('semana')
  const [dia, setDia] = useState(hoyISO())
  const [creando, setCreando] = useState(false)
  // Cadena atendida -> visita -> cobro: { cita, paso: 'visita'|'cobro', visitaId }
  const [atendida, setAtendida] = useState(null)

  const dias = vista === 'dia' ? 1 : 7
  const desde = vista === 'dia' ? dia : lunes(dia)
  const [ini, fin] = rango(desde, dias)
  const { datos, cargando, error, recargar } = useAsync(() => leerCitas(ini, fin), [ini, fin])

  const cambiarEstado = async (cita, estado) => {
    await guardarCita(cita.id, { estado })
    recargar()
    // Marcar atendida es el momento exacto de registrar la visita: la mascota
    // está saliendo del consultorio. Se ofrece aquí para que la agenda y la
    // historia clínica no vivan desconectadas. "Cancelar" solo salta el paso.
    if (estado === 'atendida') setAtendida({ cita, paso: 'visita' })
    else avisar(`Cita marcada como ${estado.replace('_', ' ')}`)
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
                citasDelDia.map((c) => (
                  <article className="agenda-cita" data-estado={c.estado} key={c.id}>
                    <div className="agenda-fila">
                      <span className="agenda-hora">{hora(c.fecha_hora)}</span>
                      <a
                        className="agenda-icono"
                        href={enlaceWhatsAppA(c.mascotas?.duenos?.telefono ?? '', mensajeConfirmacion(c))}
                        target="_blank"
                        rel="noopener"
                        title="Confirmar por WhatsApp"
                        aria-label={`Confirmar por WhatsApp la cita de ${c.mascotas?.nombre}`}
                      >
                        <MessageCircle size={14} aria-hidden="true" />
                      </a>
                      <a
                        className="agenda-icono"
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
                    <select
                      className="agenda-estado"
                      aria-label={`Estado de la cita de ${c.mascotas?.nombre}`}
                      value={c.estado}
                      onChange={(e) => cambiarEstado(c, e.target.value)}
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

      {atendida && (
        <CadenaAtendida
          cita={atendida.cita}
          paso={atendida.paso}
          alAvanzar={(visitaId) => setAtendida({ ...atendida, paso: 'cobro', visitaId })}
          visitaId={atendida.visitaId}
          onCerrar={() => setAtendida(null)}
        />
      )}
    </>
  )
}

// Cita atendida -> registrar la visita -> cobrarla, sin salir de la agenda.
// Cada paso se puede saltar: a veces el veterinario registra la visita después,
// o el cobro lo hace otra persona.
function CadenaAtendida({ cita, paso, visitaId, alAvanzar, onCerrar }) {
  const mascota = { id: cita.mascota_id, nombre: cita.mascotas?.nombre }

  if (paso === 'visita') {
    return (
      <Dialogo titulo={`Registrar visita de ${mascota.nombre}`} onCerrar={onCerrar}>
        <p className="suave pequeno">
          La cita quedó atendida. Registra la visita en la historia clínica, o cierra y hazlo
          después desde la ficha.
        </p>
        <FormVisita
          inicial={{
            tipo: cita.rama === 'estilista' ? 'estética' : 'consulta',
            anamnesis: cita.motivo ?? '',
          }}
          textoCancelar="Ahora no"
          onCancelar={onCerrar}
          alGuardar={async (datos) => {
            const v = await crearVisita({ ...datos, mascota_id: mascota.id, cita_id: cita.id })
            avisar('Visita registrada')
            alAvanzar(v.id)
          }}
        />
      </Dialogo>
    )
  }

  return (
    <Dialogo titulo={`Cobrar a ${mascota.nombre}`} onCerrar={onCerrar}>
      <p className="suave pequeno">
        Visita guardada. ¿Registras el cobro de una vez? Queda enlazado a esta visita.
      </p>
      <FormCobro
        mascota={mascota}
        visitaId={visitaId}
        citaId={cita.id}
        textoCancelar="Ahora no"
        onCancelar={onCerrar}
        alListo={onCerrar}
      />
    </Dialogo>
  )
}
