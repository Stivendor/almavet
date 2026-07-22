import { useState } from 'react'
import { CalendarPlus, MessageCircle, Pencil, Plus, Trash2 } from 'lucide-react'
import {
  anularCobro,
  citasDeMascota,
  cobrosDeMascota,
  crearPreventivo,
  crearVisita,
  guardarMascota,
  guardarVisita,
  mascota as leerMascota,
  preventivos as leerPreventivos,
  visitas as leerVisitas,
} from '../db.js'
import { useAsync } from '../useAsync.js'
import { Campo, Chip, Dialogo, ErrorLinea, Estado } from '../ui.jsx'
import { avisar } from '../avisos.js'
import { useGuardado } from '../useGuardado.js'
import { DialogoCita, FormCobro, FormMascota, FormVisita } from './formularios.jsx'
import { citaACalendario, dinero, edad, fechaLarga, hora, totalCobro } from '../formato.js'
import { enlaceWhatsAppA, formatoTelefono, hoyISO } from '../../whatsapp.js'
import { clinica } from '../../config.js'

const PESTANAS = [
  ['historial', 'Historial'],
  ['preventivos', 'Vacunas y refuerzos'],
  ['peso', 'Peso'],
  ['cobros', 'Cobros'],
  ['citas', 'Citas'],
]

export default function FichaMascota({ id }) {
  const { datos: m, cargando, error, recargar } = useAsync(() => leerMascota(id), [id])
  const [pestana, setPestana] = useState('historial')
  const [editando, setEditando] = useState(false)

  return (
    <Estado cargando={cargando} error={error}>
      {m && (
        <>
          <div className="cabecera-vista">
            <h1>{m.nombre}</h1>
            <span className="suave">
              {[m.especie, m.raza, m.sexo, edad(m.fecha_nacimiento)].filter(Boolean).join(' · ')}
            </span>
            <button
              className="boton boton-mini boton-suave"
              type="button"
              onClick={() => setEditando(true)}
            >
              <Pencil size={14} aria-hidden="true" /> Editar
            </button>
          </div>

          {/* Antes que cualquier otra cosa de la ficha: es el dato que cambia una
              decisión clínica en el momento. */}
          {m.alergias && (
            <p className="aviso aviso-error">
              <strong>Alergias:</strong> {m.alergias}
            </p>
          )}

          <div className="tarjeta">
            <div className="rejilla">
              <div>
                <span className="etiqueta">Dueño</span>
                <div>
                  <a href={`#/duenos/${m.dueno_id}`}>{m.duenos?.nombre}</a>
                </div>
              </div>
              <div>
                <span className="etiqueta">Celular</span>
                <div>
                  <a
                    href={enlaceWhatsAppA(
                      m.duenos?.telefono ?? '',
                      `Hola ${m.duenos?.nombre}, te escribimos del ${clinica.nombre} por ${m.nombre}.`,
                    )}
                    target="_blank"
                    rel="noopener"
                  >
                    <MessageCircle size={13} aria-hidden="true" />{' '}
                    {m.duenos?.telefono && formatoTelefono(m.duenos.telefono)}
                  </a>
                </div>
              </div>
              <div>
                <span className="etiqueta">Tamaño</span>
                <div>{m.tamano ?? '—'}</div>
              </div>
              <div>
                <span className="etiqueta">Esterilizado</span>
                <div>{m.esterilizado ? 'sí' : 'no'}</div>
              </div>
            </div>
            {m.notas && <p style={{ marginTop: '0.75rem' }}>{m.notas}</p>}
          </div>

          <div className="pestanas" role="tablist">
            {PESTANAS.map(([clave, etiqueta]) => (
              <button
                key={clave}
                role="tab"
                type="button"
                aria-selected={pestana === clave}
                onClick={() => setPestana(clave)}
              >
                {etiqueta}
              </button>
            ))}
          </div>

          {pestana === 'historial' && <Historial mascotaId={m.id} />}
          {pestana === 'preventivos' && <Preventivos mascotaId={m.id} />}
          {pestana === 'peso' && <Peso mascotaId={m.id} />}
          {pestana === 'cobros' && <Cobros mascota={m} />}
          {pestana === 'citas' && <Citas mascota={m} />}

          {editando && (
            <Dialogo titulo={`Editar a ${m.nombre}`} onCerrar={() => setEditando(false)}>
              <FormMascota
                inicial={m}
                onCancelar={() => setEditando(false)}
                alGuardar={async (datos) => {
                  await guardarMascota(m.id, datos)
                  avisar('Ficha actualizada')
                  setEditando(false)
                  recargar()
                }}
              />
            </Dialogo>
          )}
        </>
      )}
    </Estado>
  )
}

// ------------------------------------------------------------------ historial
function Historial({ mascotaId }) {
  const { datos, cargando, error, recargar } = useAsync(() => leerVisitas(mascotaId), [mascotaId])
  const [editando, setEditando] = useState(null) // null | 'nueva' | visita

  return (
    <>
      <div className="acciones" style={{ marginBottom: '0.75rem' }}>
        <button className="boton boton-mini" type="button" onClick={() => setEditando('nueva')}>
          <Plus size={14} aria-hidden="true" /> Nueva visita
        </button>
      </div>

      <Estado cargando={cargando} error={error}>
        {datos?.length === 0 ? (
          <p className="aviso">Sin visitas registradas.</p>
        ) : (
          datos?.map((v) => (
            <div className="tarjeta" key={v.id}>
              <div className="cabecera-vista" style={{ marginBottom: '0.5rem' }}>
                <h3>{fechaLarga(v.fecha)}</h3>
                <Chip valor={v.tipo} />
                <span className="suave pequeno">
                  {[
                    v.peso_kg && `${v.peso_kg} kg`,
                    v.temperatura_c && `${v.temperatura_c} °C`,
                    v.veterinario,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </span>
                <button
                  className="boton boton-mini boton-suave"
                  type="button"
                  onClick={() => setEditando(v)}
                >
                  <Pencil size={13} aria-hidden="true" /> Editar
                </button>
              </div>
              <Linea etiqueta="Motivo" texto={v.anamnesis} />
              <Linea etiqueta="Examen físico" texto={v.examen_fisico} />
              <Linea etiqueta="Diagnóstico" texto={v.diagnostico} />
              <Linea etiqueta="Tratamiento" texto={v.tratamiento} />
              <Linea etiqueta="Observaciones" texto={v.observaciones} />
            </div>
          ))
        )}
      </Estado>

      {editando && (
        <Dialogo
          titulo={editando === 'nueva' ? 'Nueva visita' : `Visita del ${fechaLarga(editando.fecha)}`}
          onCerrar={() => setEditando(null)}
        >
          <FormVisita
            inicial={editando === 'nueva' ? {} : editando}
            onCancelar={() => setEditando(null)}
            alGuardar={async (datos) => {
              if (editando === 'nueva') await crearVisita({ ...datos, mascota_id: mascotaId })
              else await guardarVisita(editando.id, datos)
              avisar(editando === 'nueva' ? 'Visita registrada' : 'Visita actualizada')
              setEditando(null)
              recargar()
            }}
          />
        </Dialogo>
      )}
    </>
  )
}

const Linea = ({ etiqueta, texto }) =>
  texto ? (
    <p style={{ margin: '0 0 0.4rem' }}>
      <span className="etiqueta">{etiqueta}: </span>
      {texto}
    </p>
  ) : null

// ------------------------------------------------------------------ preventivos
function Preventivos({ mascotaId }) {
  const { datos, cargando, error, recargar } = useAsync(
    () => leerPreventivos(mascotaId),
    [mascotaId],
  )
  const [creando, setCreando] = useState(false)
  const hoy = hoyISO()

  return (
    <>
      <div className="acciones" style={{ marginBottom: '0.75rem' }}>
        <button className="boton boton-mini" type="button" onClick={() => setCreando(true)}>
          <Plus size={14} aria-hidden="true" /> Registrar aplicación
        </button>
      </div>

      <Estado cargando={cargando} error={error}>
        {datos?.length === 0 ? (
          <p className="aviso">Sin vacunas ni desparasitaciones registradas.</p>
        ) : (
          <div className="tabla-marco">
            <table>
              <thead>
                <tr>
                  <th>Aplicado</th>
                  <th>Tipo</th>
                  <th>Producto</th>
                  <th>Próxima dosis</th>
                  <th>Lote</th>
                </tr>
              </thead>
              <tbody>
                {datos?.map((p) => (
                  <tr key={p.id}>
                    <td>{fechaLarga(p.fecha_aplicacion)}</td>
                    <td>
                      <Chip valor={p.tipo} />
                    </td>
                    <td>{p.producto}</td>
                    <td>
                      {p.proxima_dosis ? (
                        <>
                          {fechaLarga(p.proxima_dosis)}{' '}
                          {p.proxima_dosis <= hoy && <Chip valor="vencido" />}
                        </>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="pequeno suave">{p.lote ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Estado>

      {creando && (
        <Dialogo titulo="Registrar aplicación" onCerrar={() => setCreando(false)}>
          <FormPreventivo
            onCancelar={() => setCreando(false)}
            alGuardar={async (datos) => {
              await crearPreventivo({ ...datos, mascota_id: mascotaId })
              avisar('Aplicación registrada')
              setCreando(false)
              recargar()
            }}
          />
        </Dialogo>
      )}
    </>
  )
}

function FormPreventivo({ alGuardar, onCancelar }) {
  const [f, setF] = useState({
    tipo: 'vacuna',
    producto: '',
    fecha_aplicacion: hoyISO(),
    proxima_dosis: '',
    lote: '',
    veterinario: '',
  })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const { enviar, guardando, error } = useGuardado(() =>
    alGuardar({
      ...f,
      proxima_dosis: f.proxima_dosis || null,
      lote: f.lote || null,
      veterinario: f.veterinario || null,
    }),
  )

  return (
    <form onSubmit={enviar}>
      <div className="fila">
        <Campo id="p-tipo" etiqueta="Tipo">
          <select id="p-tipo" value={f.tipo} onChange={set('tipo')}>
            <option value="vacuna">vacuna</option>
            <option value="desparasitación">desparasitación</option>
            <option value="antipulgas">antipulgas</option>
          </select>
        </Campo>
        <Campo id="p-producto" etiqueta="Producto">
          <input
            id="p-producto"
            required
            placeholder="Triple felina, Rabia, Bravecto…"
            value={f.producto}
            onChange={set('producto')}
          />
        </Campo>
      </div>
      <div className="fila">
        <Campo id="p-fecha" etiqueta="Fecha de aplicación">
          <input
            id="p-fecha"
            type="date"
            required
            value={f.fecha_aplicacion}
            onChange={set('fecha_aplicacion')}
          />
        </Campo>
        {/* Sin esta fecha no hay recordatorio: es la razón de ser de la tabla. */}
        <Campo
          id="p-proxima"
          etiqueta="Próxima dosis"
          ayuda="Sin fecha no se genera recordatorio"
        >
          <input
            id="p-proxima"
            type="date"
            value={f.proxima_dosis}
            onChange={set('proxima_dosis')}
          />
        </Campo>
      </div>
      <div className="fila">
        <Campo id="p-lote" etiqueta="Lote">
          <input id="p-lote" value={f.lote} onChange={set('lote')} />
        </Campo>
        <Campo id="p-vet" etiqueta="Aplicó">
          <input id="p-vet" value={f.veterinario} onChange={set('veterinario')} />
        </Campo>
      </div>

      <ErrorLinea error={error} />
      <div className="acciones">
        <button className="boton" disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>
        <button className="boton boton-suave" type="button" onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </form>
  )
}

// ------------------------------------------------------------------ peso
function Peso({ mascotaId }) {
  const { datos, cargando, error } = useAsync(() => leerVisitas(mascotaId), [mascotaId])
  const pesos = datos?.filter((v) => v.peso_kg != null) ?? []

  return (
    <Estado cargando={cargando} error={error}>
      {pesos.length === 0 ? (
        <p className="aviso">Ninguna visita tiene peso registrado.</p>
      ) : (
        <div className="tabla-marco">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th className="numero">Peso (kg)</th>
                <th className="numero">Cambio</th>
              </tr>
            </thead>
            <tbody>
              {pesos.map((v, i) => {
                // Las visitas vienen de más nueva a más vieja: la siguiente del
                // array es la anterior en el tiempo.
                const previo = pesos[i + 1]?.peso_kg
                const delta = previo == null ? null : (v.peso_kg - previo).toFixed(2)
                return (
                  <tr key={v.id}>
                    <td>{fechaLarga(v.fecha)}</td>
                    <td className="numero">{v.peso_kg}</td>
                    <td className="numero suave">
                      {delta == null ? '—' : `${delta > 0 ? '+' : ''}${delta}`}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Estado>
  )
}

// ------------------------------------------------------------------ cobros
function Cobros({ mascota }) {
  const { datos, cargando, error, recargar } = useAsync(
    () => cobrosDeMascota(mascota.id),
    [mascota.id],
  )
  const [creando, setCreando] = useState(false)

  return (
    <>
      <div className="acciones" style={{ marginBottom: '0.75rem' }}>
        <button className="boton boton-mini" type="button" onClick={() => setCreando(true)}>
          <Plus size={14} aria-hidden="true" /> Nuevo cobro
        </button>
      </div>

      <Estado cargando={cargando} error={error}>
        {datos?.length === 0 ? (
          <p className="aviso">Sin cobros registrados.</p>
        ) : (
          datos?.map((c) => (
            <div className="tarjeta" key={c.id}>
              <div className="cabecera-vista" style={{ marginBottom: '0.4rem' }}>
                <h3>{dinero(totalCobro(c))}</h3>
                <Chip valor={c.estado} />
                <span className="suave pequeno">
                  {fechaLarga(c.fecha)} · {c.metodo}
                </span>
                {c.estado !== 'anulado' && (
                  <button
                    className="boton boton-mini boton-peligro"
                    type="button"
                    onClick={async () => {
                      await anularCobro(c.id)
                      avisar('Cobro anulado')
                      recargar()
                    }}
                  >
                    <Trash2 size={13} aria-hidden="true" /> Anular
                  </button>
                )}
              </div>
              {c.cobro_items?.map((i) => (
                <p key={i.id} className="pequeno" style={{ margin: '0.15rem 0' }}>
                  {i.cantidad} × {i.descripcion} — {dinero(i.cantidad * i.precio_unit_cop)}
                </p>
              ))}
              {c.notas && <p className="pequeno suave">{c.notas}</p>}
            </div>
          ))
        )}
      </Estado>

      {creando && (
        <Dialogo titulo={`Cobro de ${mascota.nombre}`} onCerrar={() => setCreando(false)}>
          <FormCobro
            mascota={mascota}
            onCancelar={() => setCreando(false)}
            alListo={() => {
              setCreando(false)
              recargar()
            }}
          />
        </Dialogo>
      )}
    </>
  )
}

// ------------------------------------------------------------------ citas
function Citas({ mascota }) {
  const { datos, cargando, error, recargar } = useAsync(() => citasDeMascota(mascota.id), [mascota.id])
  const [creando, setCreando] = useState(false)

  return (
    <>
      <div className="acciones" style={{ marginBottom: '0.75rem' }}>
        <button className="boton boton-mini" type="button" onClick={() => setCreando(true)}>
          <Plus size={14} aria-hidden="true" /> Nueva cita
        </button>
      </div>

      {creando && (
        <DialogoCita
          mascotaFija={mascota}
          onCerrar={() => setCreando(false)}
          onListo={() => {
            setCreando(false)
            recargar()
          }}
        />
      )}

      <Estado cargando={cargando} error={error}>
      {datos?.length === 0 ? (
        <p className="aviso">Sin citas registradas.</p>
      ) : (
        <div className="tabla-marco">
          <table>
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Hora</th>
                <th>Rama</th>
                <th>Motivo</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {datos?.map((c) => (
                <tr key={c.id}>
                  <td>{new Date(c.fecha_hora).toLocaleDateString('es-CO')}</td>
                  <td>{hora(c.fecha_hora)}</td>
                  <td>{c.rama}</td>
                  <td>{c.motivo ?? '—'}</td>
                  <td>
                    <Chip valor={c.estado} />
                  </td>
                  <td>
                    <a
                      className="boton boton-mini boton-suave"
                      href={citaACalendario(c, mascota.nombre, mascota.duenos?.nombre)}
                      target="_blank"
                      rel="noopener"
                    >
                      <CalendarPlus size={13} aria-hidden="true" /> Calendar
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      </Estado>
    </>
  )
}
