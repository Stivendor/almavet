import { useState } from 'react'
import { CalendarPlus, MessageCircle } from 'lucide-react'
import { actualizarSolicitud, convertirSolicitud, solicitudes } from '../db.js'
import { useAsync } from '../useAsync.js'
import { Campo, Chip, Dialogo, ErrorLinea, Estado } from '../ui.jsx'
import { useGuardado } from '../useGuardado.js'
import { fechaLarga } from '../formato.js'
import { enlaceWhatsAppA, formatoTelefono, hoyISO } from '../../whatsapp.js'
import { clinica } from '../../config.js'
import { ir } from '../router.js'

const ESTADOS = ['nueva', 'contactada', 'agendada', 'atendida', 'descartada']

// Lo que pidió el cliente, en una celda. Cada rama enseña sus propios campos:
// mostrar los diez con la mitad vacíos obliga a leer para encontrar el dato.
function Detalle({ s }) {
  if (s.rama === 'estilista') {
    return (
      <>
        <strong>{s.servicio}</strong>
        <div className="pequeno suave">Para el {fechaLarga(s.fecha_preferida)}</div>
        {s.comentarios && <div className="pequeno">{s.comentarios}</div>}
      </>
    )
  }
  return (
    <>
      <strong>{s.motivo}</strong> {s.urgente && <Chip valor="urgente" />}
      <div className="pequeno suave">
        Para el {fechaLarga(s.fecha_consulta)}
        {s.franja && ` · ${s.franja}`}
      </div>
      {s.sintomas && <div className="pequeno">{s.sintomas}</div>}
    </>
  )
}

export default function Solicitudes() {
  const [filtro, setFiltro] = useState('nueva')
  const { datos, cargando, error, recargar } = useAsync(() => solicitudes(filtro), [filtro])
  const [convirtiendo, setConvirtiendo] = useState(null)

  const cambiarEstado = async (id, estado) => {
    await actualizarSolicitud(id, { estado })
    recargar()
  }

  return (
    <>
      <div className="cabecera-vista">
        <h1>Solicitudes</h1>
        <select
          aria-label="Filtrar por estado"
          value={filtro}
          onChange={(e) => setFiltro(e.target.value)}
          style={{ width: 'auto' }}
        >
          <option value="">Todas</option>
          {ESTADOS.map((e) => (
            <option key={e} value={e}>
              {e}
            </option>
          ))}
        </select>
      </div>

      <Estado cargando={cargando} error={error}>
        {datos?.length === 0 ? (
          <p className="aviso">No hay solicitudes {filtro && `en estado "${filtro}"`}.</p>
        ) : (
          <div className="tabla-marco">
            <table>
              <thead>
                <tr>
                  <th>Recibida</th>
                  <th>Cliente</th>
                  <th>Mascota</th>
                  <th>Solicitud</th>
                  <th>Estado</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {datos?.map((s) => (
                  <tr key={s.id}>
                    <td className="pequeno suave">
                      {new Date(s.creada_en).toLocaleDateString('es-CO')}
                    </td>
                    <td>
                      {s.dueno_id ? (
                        <a href={`#/duenos/${s.dueno_id}`}>{s.nombre_dueno}</a>
                      ) : (
                        s.nombre_dueno
                      )}
                      <div className="pequeno suave">{formatoTelefono(s.telefono)}</div>
                    </td>
                    <td>
                      {s.mascota_id ? (
                        <a href={`#/mascotas/${s.mascota_id}`}>{s.nombre_mascota}</a>
                      ) : (
                        s.nombre_mascota
                      )}
                      <div className="pequeno suave">
                        {[s.tipo_mascota, s.tamano].filter(Boolean).join(', ')}
                      </div>
                    </td>
                    <td>
                      <Detalle s={s} />
                    </td>
                    <td>
                      <select
                        aria-label={`Estado de la solicitud de ${s.nombre_dueno}`}
                        value={s.estado}
                        onChange={(e) => cambiarEstado(s.id, e.target.value)}
                        style={{ width: 'auto' }}
                      >
                        {ESTADOS.map((e) => (
                          <option key={e} value={e}>
                            {e}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <div className="acciones">
                        <a
                          className="boton boton-mini boton-wa"
                          href={enlaceWhatsAppA(
                            s.telefono,
                            `Hola ${s.nombre_dueno}, te escribimos del ${clinica.nombre} por la solicitud que enviaste para ${s.nombre_mascota}.`,
                          )}
                          target="_blank"
                          rel="noopener"
                        >
                          <MessageCircle size={14} aria-hidden="true" /> Escribir
                        </a>
                        {!s.mascota_id && (
                          <button
                            className="boton boton-mini boton-suave"
                            type="button"
                            onClick={() => setConvirtiendo(s)}
                          >
                            <CalendarPlus size={14} aria-hidden="true" /> Agendar
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Estado>

      {convirtiendo && (
        <DialogoConvertir
          s={convirtiendo}
          onCerrar={() => setConvirtiendo(null)}
          onListo={() => {
            setConvirtiendo(null)
            recargar()
          }}
        />
      )}
    </>
  )
}

// Convertir = crear dueño + mascota + cita de una sola vez. La RPC hace las cuatro
// escrituras en una transacción; aquí solo se completa lo que el formulario web
// no pregunta.
function DialogoConvertir({ s, onCerrar, onListo }) {
  const [fecha, setFecha] = useState(s.fecha_preferida || s.fecha_consulta || hoyISO())
  const [hora, setHora] = useState(s.franja === 'tarde' ? '14:00' : '09:00')
  const [duracion, setDuracion] = useState(s.rama === 'estilista' ? 90 : 30)
  const [especie, setEspecie] = useState(s.tipo_mascota || '')

  const { enviar, guardando, error } = useGuardado(async () => {
    const r = await convertirSolicitud(
      s.id,
      new Date(`${fecha}T${hora}`).toISOString(),
      Number(duracion),
      especie,
    )
    onListo()
    ir(`/mascotas/${r.mascota_id}`)
  })

  return (
    <Dialogo titulo={`Agendar a ${s.nombre_mascota}`} onCerrar={onCerrar}>
      <form onSubmit={enviar}>
        <p className="pequeno suave">
          Se crea la ficha de {s.nombre_dueno} y de {s.nombre_mascota} si aún no existen, y la cita
          queda en la agenda. Si el teléfono ya está registrado, se reutiliza el cliente.
        </p>

        <div className="fila">
          <Campo id="fecha" etiqueta="Fecha">
            <input
              id="fecha"
              type="date"
              required
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </Campo>
          <Campo id="hora" etiqueta="Hora">
            <input
              id="hora"
              type="time"
              required
              value={hora}
              onChange={(e) => setHora(e.target.value)}
            />
          </Campo>
          <Campo id="duracion" etiqueta="Duración (min)">
            <input
              id="duracion"
              type="number"
              min="5"
              step="5"
              required
              value={duracion}
              onChange={(e) => setDuracion(e.target.value)}
            />
          </Campo>
        </div>

        {/* La rama clínica no pregunta la especie en la web: si falta, se pide aquí
            en vez de suponer "perro" y dejarlo mal en la ficha para siempre. */}
        {!s.tipo_mascota && (
          <Campo id="especie" etiqueta="Especie">
            <select
              id="especie"
              required
              value={especie}
              onChange={(e) => setEspecie(e.target.value)}
            >
              <option value="">Selecciona…</option>
              <option value="perro">perro</option>
              <option value="gato">gato</option>
            </select>
          </Campo>
        )}

        <ErrorLinea error={error} />

        <div className="acciones">
          <button className="boton" disabled={guardando}>
            {guardando ? 'Agendando…' : 'Crear ficha y cita'}
          </button>
          <button className="boton boton-suave" type="button" onClick={onCerrar}>
            Cancelar
          </button>
        </div>
      </form>
    </Dialogo>
  )
}
