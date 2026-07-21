import { useState } from 'react'
import { Scissors, Stethoscope, MessageCircle } from 'lucide-react'
import { construirMensaje, enlaceWhatsApp, hoyISO, normalizarTelefono } from './whatsapp'
import { guardarSolicitud } from './supabase'

const vacio = {
  nombreDueno: '',
  telefono: '',
  nombreMascota: '',
  tipoMascota: '',
  tamano: '',
  servicio: '',
  fecha: '',
  comentarios: '',
  motivo: '',
  sintomas: '',
  fechaConsulta: '',
  franja: '',
  urgente: false,
  web: '', // honeypot: los humanos no lo ven, los bots lo llenan
}

// Solo lo obligatorio: pedir de más en un formulario de WhatsApp espanta gente.
function validar(rama, f) {
  const e = {}
  if (!f.nombreDueno.trim()) e.nombreDueno = 'Escribe tu nombre'
  if (!normalizarTelefono(f.telefono))
    e.telefono = 'Escribe tu celular a 10 dígitos, empezando por 3'
  if (!f.nombreMascota.trim()) e.nombreMascota = 'Escribe el nombre de tu mascota'
  if (rama === 'estilista') {
    if (!f.tipoMascota) e.tipoMascota = 'Selecciona el tipo de mascota'
    if (!f.servicio) e.servicio = 'Selecciona el servicio que necesitas'
    if (!f.fecha) e.fecha = 'Elige una fecha preferida'
  } else {
    if (!f.motivo) e.motivo = 'Selecciona el motivo de la consulta'
    if (!f.fechaConsulta) e.fechaConsulta = 'Elige la fecha deseada para la consulta'
  }
  return e
}

function Campo({ id, etiqueta, error, ayuda, children }) {
  return (
    <div className={`campo${error ? ' campo-con-error' : ''}`}>
      <label htmlFor={id}>{etiqueta}</label>
      {children}
      {ayuda && !error && (
        <span className="ayuda" id={`${id}-ayuda`}>
          {ayuda}
        </span>
      )}
      {error && (
        <span className="error" id={`${id}-error`} role="alert">
          {error}
        </span>
      )}
    </div>
  )
}

export default function AppointmentForm({ rama, setRama }) {
  const [f, setF] = useState(vacio)
  const [errores, setErrores] = useState({})
  const hoy = hoyISO()

  const set = (campo) => (ev) =>
    setF({ ...f, [campo]: ev.target.type === 'checkbox' ? ev.target.checked : ev.target.value })

  const props = (campo) => ({
    id: campo,
    value: f[campo],
    onChange: set(campo),
    'aria-invalid': errores[campo] ? 'true' : undefined,
    'aria-describedby': errores[campo] ? `${campo}-error` : undefined,
  })

  // Vista previa en vivo: el mismo armado del mensaje real, con placeholders
  // donde faltan los campos obligatorios.
  const mensajePreview = rama
    ? construirMensaje({
        ...f,
        rama,
        nombreDueno: f.nombreDueno.trim() || '[tu nombre]',
        nombreMascota: f.nombreMascota.trim() || '[tu mascota]',
      })
    : ''
  const horaPreview = new Date().toLocaleTimeString('es-CO', {
    hour: 'numeric',
    minute: '2-digit',
  })

  function enviar(ev) {
    ev.preventDefault()
    if (!rama) {
      setErrores({ rama: 'Elige primero qué servicio necesitas' })
      return
    }
    const e = validar(rama, f)
    setErrores(e)
    const primero = Object.keys(e)[0]
    if (primero) {
      document.getElementById(primero)?.focus()
      return
    }
    // Sin await: si se espera la respuesta, el navegador bloquea la pestaña de WhatsApp.
    if (!f.web) guardarSolicitud({ ...f, rama })
    window.open(enlaceWhatsApp(construirMensaje({ ...f, rama })), '_blank', 'noopener')
  }

  return (
    <form className="form-envoltorio" onSubmit={enviar} noValidate>
      <fieldset style={{ border: 0, padding: 0, margin: 0 }}>
        <legend className="campo">
          <strong>¿Qué necesita tu mascota?</strong>
        </legend>
        <div className="ramas">
          <button
            type="button"
            className="rama-tarjeta"
            aria-pressed={rama === 'estilista'}
            onClick={() => setRama('estilista')}
          >
            <Scissors size={28} aria-hidden="true" />
            Estilista
            <small>Baño y corte de pelo</small>
          </button>
          <button
            type="button"
            className="rama-tarjeta"
            aria-pressed={rama === 'clinica'}
            onClick={() => setRama('clinica')}
          >
            <Stethoscope size={28} aria-hidden="true" />
            Clínica
            <small>Consultas y vacunación</small>
          </button>
        </div>
        {errores.rama && (
          <span className="error" role="alert">
            {errores.rama}
          </span>
        )}
      </fieldset>

      <div className="form-grid">
        <div>
          <Campo id="nombreDueno" etiqueta="Tu nombre" error={errores.nombreDueno}>
            <input type="text" autoComplete="name" {...props('nombreDueno')} />
          </Campo>

          <Campo
            id="telefono"
            etiqueta="Tu número de WhatsApp"
            error={errores.telefono}
            ayuda="Para confirmarte la cita y tener el historial de tu mascota."
          >
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="300 123 4567"
              {...props('telefono')}
            />
          </Campo>

          <Campo id="nombreMascota" etiqueta="Nombre de tu mascota" error={errores.nombreMascota}>
            <input type="text" {...props('nombreMascota')} />
          </Campo>

          {rama === 'estilista' && (
            <div className="campos-rama">
              <Campo id="tipoMascota" etiqueta="Tipo de mascota" error={errores.tipoMascota}>
                <select {...props('tipoMascota')}>
                  <option value="">Selecciona una opción</option>
                  <option value="perro">Perro</option>
                  <option value="gato">Gato</option>
                </select>
              </Campo>

              <Campo id="tamano" etiqueta="Tamaño (opcional)">
                <select {...props('tamano')}>
                  <option value="">Selecciona una opción</option>
                  <option value="pequeño">Pequeño</option>
                  <option value="mediano">Mediano</option>
                  <option value="grande">Grande</option>
                </select>
              </Campo>

              <Campo id="servicio" etiqueta="Servicio deseado" error={errores.servicio}>
                <select {...props('servicio')}>
                  <option value="">Selecciona una opción</option>
                  {/* El corte siempre va con baño: no se ofrece corte solo. */}
                  <option value="baño">Baño</option>
                  <option value="baño + corte">Baño + corte</option>
                  <option value="otro">Otro</option>
                </select>
              </Campo>

              <Campo id="fecha" etiqueta="Fecha preferida" error={errores.fecha}>
                <input type="date" min={hoy} {...props('fecha')} />
              </Campo>

              <Campo
                id="comentarios"
                etiqueta="Comentarios (opcional)"
                ayuda="Cuéntanos si es nervioso o agresivo, si tiene alergias o si quieres un corte especial."
              >
                <textarea {...props('comentarios')} />
              </Campo>
            </div>
          )}

          {rama === 'clinica' && (
            <div className="campos-rama">
              <Campo id="motivo" etiqueta="Motivo de la consulta" error={errores.motivo}>
                <select {...props('motivo')}>
                  <option value="">Selecciona una opción</option>
                  <option value="chequeo general">Chequeo general</option>
                  <option value="vacunación">Vacunación</option>
                  <option value="enfermedad o síntomas">Enfermedad o síntomas</option>
                  <option value="cirugía">Cirugía</option>
                  <option value="urgencia">Urgencia</option>
                </select>
              </Campo>

              <Campo
                id="sintomas"
                etiqueta="Breve descripción de los síntomas (opcional)"
                ayuda="Qué le pasa, desde cuándo y si ha cambiado de comportamiento."
              >
                <textarea {...props('sintomas')} />
              </Campo>

              <Campo
                id="fechaConsulta"
                etiqueta="Fecha deseada de la consulta"
                error={errores.fechaConsulta}
              >
                <input type="date" min={hoy} {...props('fechaConsulta')} />
              </Campo>

              <Campo id="franja" etiqueta="Franja horaria preferida (opcional)">
                <select {...props('franja')}>
                  <option value="">Sin preferencia</option>
                  <option value="mañana">Mañana</option>
                  <option value="tarde">Tarde</option>
                </select>
              </Campo>

              <label className="urgente" htmlFor="urgente">
                <input id="urgente" type="checkbox" checked={f.urgente} onChange={set('urgente')} />
                Es urgente, necesito atención lo antes posible
              </label>
            </div>
          )}
        </div>

        {rama && (
          <aside className="preview-col">
            <p className="preview-titulo">Así llegará tu mensaje a la clínica:</p>
            <div className="preview-wa">
              <div className="burbuja">
                {mensajePreview}
                <span className="burbuja-hora">{horaPreview}</span>
              </div>
            </div>
          </aside>
        )}
      </div>

      <input
        className="trampa"
        type="text"
        name="web"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={f.web}
        onChange={set('web')}
      />

      <button type="submit" className="boton boton-whatsapp">
        <MessageCircle size={20} aria-hidden="true" />
        Enviar por WhatsApp
      </button>
      <p className="nota-envio">
        Se abrirá WhatsApp con tu solicitud ya escrita, solo debes enviarla.
      </p>
    </form>
  )
}
