import { useState } from 'react'
import { CalendarPlus, MessageCircle } from 'lucide-react'
import { crearVisita, guardarCita } from '../db.js'
import { Dialogo } from '../ui.jsx'
import { avisar } from '../avisos.js'
import { FormCobro, FormVisita } from './formularios.jsx'
import { citaACalendario, fechaLarga, hora } from '../formato.js'
import { enlaceWhatsAppA } from '../../whatsapp.js'
import { clinica } from '../../config.js'

const ESTADOS = ['agendada', 'confirmada', 'atendida', 'no_asistio', 'cancelada']

// Confirmar las citas por WhatsApp es tarea diaria: mensaje ya redactado.
const mensajeConfirmacion = (c) =>
  `Hola ${c.mascotas?.duenos?.nombre}, te escribimos del ${clinica.nombre}. ` +
  `Te recordamos la cita de ${c.mascotas?.nombre} el ` +
  `${fechaLarga(new Date(c.fecha_hora).toLocaleDateString('sv'))} a las ${hora(c.fecha_hora)}. ` +
  `¿Nos confirmas que pueden venir?`

// LA tarjeta de cita. La usan la agenda y el tablero de hoy: una cita se ve y
// se opera igual en todo el panel, así el equipo aprende una sola anatomía.
export function TarjetaCita({ cita: c, alCambiar }) {
  // Cadena atendida -> visita -> cobro: { paso: 'visita'|'cobro', visitaId }
  const [atendida, setAtendida] = useState(null)

  const cambiarEstado = async (estado) => {
    await guardarCita(c.id, { estado })
    alCambiar()
    // Marcar atendida es el momento exacto de registrar la visita: la mascota
    // está saliendo del consultorio. "Ahora no" solo salta el paso.
    if (estado === 'atendida') setAtendida({ paso: 'visita' })
    else avisar(`Cita marcada como ${estado.replace('_', ' ')}`)
  }

  return (
    <article className="agenda-cita" data-estado={c.estado}>
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
          href={citaACalendario(
            c,
            c.mascotas?.nombre,
            c.mascotas?.duenos?.nombre,
            c.mascotas?.duenos?.telefono,
          )}
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
      {/* El estado va solo en el select; el color queda en el borde izquierdo. */}
      <select
        className="agenda-estado"
        aria-label={`Estado de la cita de ${c.mascotas?.nombre}`}
        value={c.estado}
        onChange={(e) => cambiarEstado(e.target.value)}
      >
        {ESTADOS.map((e) => (
          <option key={e} value={e}>
            {e.replace('_', ' ')}
          </option>
        ))}
      </select>

      {atendida && (
        <CadenaAtendida
          cita={c}
          paso={atendida.paso}
          visitaId={atendida.visitaId}
          alAvanzar={(visitaId) => setAtendida({ paso: 'cobro', visitaId })}
          onCerrar={() => setAtendida(null)}
        />
      )}
    </article>
  )
}

// Cita atendida -> registrar la visita -> cobrarla, sin salir de donde estés.
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
