import { useState } from 'react'
import { Search, Trash2 } from 'lucide-react'
import { Campo, Dialogo, ErrorLinea } from '../ui.jsx'
import { avisar } from '../avisos.js'
import { useGuardado } from '../useGuardado.js'
import { useAsync } from '../useAsync.js'
import { buscarMascotas, crearCita, crearCobro, procedimientos } from '../db.js'
import { dinero } from '../formato.js'
import { formatoTelefono, hoyISO, normalizarTelefono } from '../../whatsapp.js'

// Todos los formularios que se usan desde más de una pantalla viven aquí, para
// que "añadir un campo" sea un cambio en un sitio y no dos formularios que se
// van separando con el tiempo.

export function FormDueno({ inicial = {}, alGuardar, onCancelar }) {
  const [f, setF] = useState({
    nombre: inicial.nombre ?? '',
    telefono: inicial.telefono ?? '',
    email: inicial.email ?? '',
    documento: inicial.documento ?? '',
    direccion: inicial.direccion ?? '',
    notas: inicial.notas ?? '',
    autoriza_datos: inicial.autoriza_datos ?? false,
  })
  const set = (k) => (e) =>
    setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  const { enviar, guardando, error } = useGuardado(async () => {
    const telefono = normalizarTelefono(f.telefono)
    // El teléfono es la llave natural con la que la base deduplica clientes:
    // guardarlo sin normalizar crea un segundo dueño para la misma persona.
    if (!telefono) throw new Error('El celular debe tener 10 dígitos y empezar por 3')
    await alGuardar({
      ...f,
      telefono,
      email: f.email || null,
      documento: f.documento || null,
      direccion: f.direccion || null,
      notas: f.notas || null,
      // La fecha de la autorización es la prueba; sin ella la casilla no vale.
      autorizado_en: f.autoriza_datos ? (inicial.autorizado_en ?? new Date().toISOString()) : null,
    })
  })

  return (
    <form onSubmit={enviar}>
      <div className="fila">
        <Campo id="d-nombre" etiqueta="Nombre">
          <input id="d-nombre" required value={f.nombre} onChange={set('nombre')} />
        </Campo>
        <Campo id="d-telefono" etiqueta="Celular">
          <input
            id="d-telefono"
            inputMode="tel"
            required
            placeholder="320 438 7439"
            value={f.telefono}
            onChange={set('telefono')}
          />
        </Campo>
      </div>
      <div className="fila">
        <Campo id="d-email" etiqueta="Correo (opcional)">
          <input id="d-email" type="email" value={f.email} onChange={set('email')} />
        </Campo>
        <Campo id="d-documento" etiqueta="Documento (opcional)">
          <input id="d-documento" value={f.documento} onChange={set('documento')} />
        </Campo>
      </div>
      <Campo id="d-direccion" etiqueta="Dirección (opcional)">
        <input id="d-direccion" value={f.direccion} onChange={set('direccion')} />
      </Campo>
      <Campo id="d-notas" etiqueta="Notas">
        <textarea id="d-notas" value={f.notas} onChange={set('notas')} />
      </Campo>

      <div className="campo checkbox">
        <input
          id="d-autoriza"
          type="checkbox"
          checked={f.autoriza_datos}
          onChange={set('autoriza_datos')}
        />
        <label htmlFor="d-autoriza">
          Autorizó el tratamiento de sus datos (Ley 1581 de 2012)
        </label>
      </div>

      <ErrorLinea error={error} />
      <div className="acciones">
        <button className="boton" disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>
        {onCancelar && (
          <button className="boton boton-suave" type="button" onClick={onCancelar}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}

export function FormMascota({ inicial = {}, alGuardar, onCancelar }) {
  const [f, setF] = useState({
    nombre: inicial.nombre ?? '',
    especie: inicial.especie ?? 'perro',
    raza: inicial.raza ?? '',
    sexo: inicial.sexo ?? '',
    tamano: inicial.tamano ?? '',
    fecha_nacimiento: inicial.fecha_nacimiento ?? '',
    esterilizado: inicial.esterilizado ?? false,
    alergias: inicial.alergias ?? '',
    notas: inicial.notas ?? '',
  })
  const set = (k) => (e) =>
    setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  const { enviar, guardando, error } = useGuardado(() =>
    // Los CHECK de la base rechazan '' porque no está en ninguna lista de valores.
    alGuardar({
      ...f,
      raza: f.raza || null,
      sexo: f.sexo || null,
      tamano: f.tamano || null,
      fecha_nacimiento: f.fecha_nacimiento || null,
      alergias: f.alergias || null,
      notas: f.notas || null,
    }),
  )

  return (
    <form onSubmit={enviar}>
      <div className="fila">
        <Campo id="m-nombre" etiqueta="Nombre">
          <input id="m-nombre" required value={f.nombre} onChange={set('nombre')} />
        </Campo>
        <Campo id="m-especie" etiqueta="Especie">
          <select id="m-especie" required value={f.especie} onChange={set('especie')}>
            <option value="perro">perro</option>
            <option value="gato">gato</option>
          </select>
        </Campo>
        <Campo id="m-raza" etiqueta="Raza">
          <input id="m-raza" value={f.raza} onChange={set('raza')} />
        </Campo>
      </div>
      <div className="fila">
        <Campo id="m-sexo" etiqueta="Sexo">
          <select id="m-sexo" value={f.sexo} onChange={set('sexo')}>
            <option value="">—</option>
            <option value="macho">macho</option>
            <option value="hembra">hembra</option>
          </select>
        </Campo>
        <Campo id="m-tamano" etiqueta="Tamaño">
          <select id="m-tamano" value={f.tamano} onChange={set('tamano')}>
            <option value="">—</option>
            <option value="pequeño">pequeño</option>
            <option value="mediano">mediano</option>
            <option value="grande">grande</option>
          </select>
        </Campo>
        <Campo id="m-nacimiento" etiqueta="Fecha de nacimiento">
          <input
            id="m-nacimiento"
            type="date"
            max={hoyISO()}
            value={f.fecha_nacimiento}
            onChange={set('fecha_nacimiento')}
          />
        </Campo>
      </div>

      <div className="campo checkbox">
        <input
          id="m-esterilizado"
          type="checkbox"
          checked={f.esterilizado}
          onChange={set('esterilizado')}
        />
        <label htmlFor="m-esterilizado">Esterilizado</label>
      </div>

      {/* Arriba del todo en la ficha: es el dato que puede matar a un paciente. */}
      <Campo id="m-alergias" etiqueta="Alergias">
        <input id="m-alergias" value={f.alergias} onChange={set('alergias')} />
      </Campo>
      <Campo id="m-notas" etiqueta="Notas">
        <textarea id="m-notas" value={f.notas} onChange={set('notas')} />
      </Campo>

      <ErrorLinea error={error} />
      <div className="acciones">
        <button className="boton" disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>
        {onCancelar && (
          <button className="boton boton-suave" type="button" onClick={onCancelar}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}

// ---------------------------------------------------------------- buscador de mascota
// Elegir paciente por nombre de mascota o de dueño. Es un <div>, no un <form>:
// siempre vive dentro del formulario de otra cosa (cita, cobro) y los forms no
// se anidan. El Enter se captura a mano por lo mismo.
export function BuscadorMascota({ elegida, alElegir }) {
  const [texto, setTexto] = useState('')
  const [resultados, setResultados] = useState(null)
  const [buscando, setBuscando] = useState(false)
  const [error, setError] = useState(null)

  const buscar = async () => {
    if (!texto.trim()) return
    setBuscando(true)
    setError(null)
    try {
      setResultados(await buscarMascotas(texto))
    } catch (e) {
      setError(e)
    } finally {
      setBuscando(false)
    }
  }

  if (elegida) {
    return (
      <div className="buscador-elegida">
        <span>
          <strong>{elegida.nombre}</strong>{' '}
          <span className="suave pequeno">
            {elegida.especie} · de {elegida.duenos?.nombre}
          </span>
        </span>
        <button className="boton boton-mini boton-suave" type="button" onClick={() => alElegir(null)}>
          Cambiar
        </button>
      </div>
    )
  }

  return (
    <div className="campo">
      <label htmlFor="buscar-mascota">Paciente</label>
      <div className="fila">
        <input
          id="buscar-mascota"
          placeholder="Nombre de la mascota o del dueño"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              buscar()
            }
          }}
        />
        <button className="boton boton-suave encoge" type="button" onClick={buscar} disabled={buscando}>
          <Search size={15} aria-hidden="true" /> {buscando ? 'Buscando…' : 'Buscar'}
        </button>
      </div>

      <ErrorLinea error={error} />
      {resultados?.length === 0 && (
        <span className="pequeno suave">
          Sin resultados. Si es un cliente nuevo, créalo primero en la pestaña Clientes.
        </span>
      )}
      {resultados?.length > 0 && (
        <ul className="buscador-lista">
          {resultados.map((m) => (
            <li key={m.id}>
              <button type="button" onClick={() => alElegir(m)}>
                <strong>{m.nombre}</strong>
                <span className="suave pequeno">
                  {m.especie} · de {m.duenos?.nombre}
                  {m.duenos?.telefono && ` · ${formatoTelefono(m.duenos.telefono)}`}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ---------------------------------------------------------------- nueva cita
// El flujo más común de la clínica: suena el teléfono y hay que dar una cita.
// Vive como diálogo completo porque se abre desde la agenda y desde la ficha.
export function DialogoCita({ mascotaFija, fechaInicial, onCerrar, onListo }) {
  const [mascota, setMascota] = useState(mascotaFija ?? null)
  const [rama, setRama] = useState('clinica')
  const [fecha, setFecha] = useState(fechaInicial ?? hoyISO())
  const [horaCita, setHoraCita] = useState('09:00')
  const [duracion, setDuracion] = useState(30)
  const [motivo, setMotivo] = useState('')

  const { enviar, guardando, error } = useGuardado(async () => {
    if (!mascota) throw new Error('Busca y elige el paciente primero')
    await crearCita({
      mascota_id: mascota.id,
      rama,
      fecha_hora: new Date(`${fecha}T${horaCita}`).toISOString(),
      duracion_min: Number(duracion),
      motivo: motivo.trim() || null,
    })
    avisar(`Cita de ${mascota.nombre} creada`)
    onListo()
  })

  return (
    <Dialogo titulo="Nueva cita" onCerrar={onCerrar}>
      <form onSubmit={enviar}>
        <BuscadorMascota elegida={mascota} alElegir={setMascota} />

        <div className="fila">
          <Campo id="nc-rama" etiqueta="Área">
            <select
              id="nc-rama"
              value={rama}
              onChange={(e) => {
                setRama(e.target.value)
                // Duración típica de cada rama; se puede ajustar después.
                setDuracion(e.target.value === 'estilista' ? 90 : 30)
              }}
            >
              <option value="clinica">clínica</option>
              <option value="estilista">estilista</option>
            </select>
          </Campo>
          <Campo id="nc-fecha" etiqueta="Fecha">
            <input
              id="nc-fecha"
              type="date"
              required
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
            />
          </Campo>
          <Campo id="nc-hora" etiqueta="Hora">
            <input
              id="nc-hora"
              type="time"
              required
              value={horaCita}
              onChange={(e) => setHoraCita(e.target.value)}
            />
          </Campo>
          <Campo id="nc-duracion" etiqueta="Minutos">
            <input
              id="nc-duracion"
              type="number"
              min="5"
              step="5"
              required
              value={duracion}
              onChange={(e) => setDuracion(e.target.value)}
            />
          </Campo>
        </div>

        <Campo id="nc-motivo" etiqueta="Motivo (opcional)">
          <input
            id="nc-motivo"
            placeholder="baño, chequeo general, vacunación…"
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
          />
        </Campo>

        <ErrorLinea error={error} />
        <div className="acciones">
          <button className="boton" disabled={guardando}>
            {guardando ? 'Creando…' : 'Crear cita'}
          </button>
          <button className="boton boton-suave" type="button" onClick={onCerrar}>
            Cancelar
          </button>
        </div>
      </form>
    </Dialogo>
  )
}

// ---------------------------------------------------------------- visita
const TIPOS_VISITA = ['consulta', 'vacunación', 'cirugía', 'urgencia', 'control', 'estética']

export function FormVisita({ inicial = {}, alGuardar, onCancelar, textoCancelar = 'Cancelar' }) {
  const [f, setF] = useState({
    fecha: inicial.fecha ?? hoyISO(),
    tipo: inicial.tipo ?? 'consulta',
    peso_kg: inicial.peso_kg ?? '',
    temperatura_c: inicial.temperatura_c ?? '',
    anamnesis: inicial.anamnesis ?? '',
    examen_fisico: inicial.examen_fisico ?? '',
    diagnostico: inicial.diagnostico ?? '',
    tratamiento: inicial.tratamiento ?? '',
    observaciones: inicial.observaciones ?? '',
    veterinario: inicial.veterinario ?? '',
  })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })

  const { enviar, guardando, error } = useGuardado(() =>
    alGuardar({
      ...f,
      // Los CHECK numéricos rechazan '': el campo vacío es null, no cero.
      peso_kg: f.peso_kg === '' ? null : Number(f.peso_kg),
      temperatura_c: f.temperatura_c === '' ? null : Number(f.temperatura_c),
      anamnesis: f.anamnesis || null,
      examen_fisico: f.examen_fisico || null,
      diagnostico: f.diagnostico || null,
      tratamiento: f.tratamiento || null,
      observaciones: f.observaciones || null,
      veterinario: f.veterinario || null,
    }),
  )

  return (
    <form onSubmit={enviar}>
      <div className="fila">
        <Campo id="v-fecha" etiqueta="Fecha">
          <input id="v-fecha" type="date" required value={f.fecha} onChange={set('fecha')} />
        </Campo>
        <Campo id="v-tipo" etiqueta="Tipo">
          <select id="v-tipo" value={f.tipo} onChange={set('tipo')}>
            {TIPOS_VISITA.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </Campo>
        <Campo id="v-peso" etiqueta="Peso (kg)">
          <input
            id="v-peso"
            type="number"
            step="0.01"
            min="0.01"
            value={f.peso_kg}
            onChange={set('peso_kg')}
          />
        </Campo>
        <Campo id="v-temp" etiqueta="Temp. (°C)">
          <input
            id="v-temp"
            type="number"
            step="0.1"
            min="30"
            max="45"
            value={f.temperatura_c}
            onChange={set('temperatura_c')}
          />
        </Campo>
      </div>

      <Campo id="v-anamnesis" etiqueta="Motivo / anamnesis">
        <textarea id="v-anamnesis" value={f.anamnesis} onChange={set('anamnesis')} />
      </Campo>
      <Campo id="v-examen" etiqueta="Examen físico">
        <textarea id="v-examen" value={f.examen_fisico} onChange={set('examen_fisico')} />
      </Campo>
      <Campo id="v-diagnostico" etiqueta="Diagnóstico">
        <textarea id="v-diagnostico" value={f.diagnostico} onChange={set('diagnostico')} />
      </Campo>
      <Campo id="v-tratamiento" etiqueta="Tratamiento">
        <textarea id="v-tratamiento" value={f.tratamiento} onChange={set('tratamiento')} />
      </Campo>
      <div className="fila">
        <Campo id="v-obs" etiqueta="Observaciones">
          <input id="v-obs" value={f.observaciones} onChange={set('observaciones')} />
        </Campo>
        <Campo id="v-vet" etiqueta="Atendió">
          <input id="v-vet" value={f.veterinario} onChange={set('veterinario')} />
        </Campo>
      </div>

      <ErrorLinea error={error} />
      <div className="acciones">
        <button className="boton" disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar visita'}
        </button>
        <button className="boton boton-suave" type="button" onClick={onCancelar}>
          {textoCancelar}
        </button>
      </div>
    </form>
  )
}

// ---------------------------------------------------------------- cobro
export function FormCobro({ mascota, visitaId, citaId, alListo, onCancelar, textoCancelar = 'Cancelar' }) {
  const { datos: catalogo } = useAsync(() => procedimientos(true), [])
  const [items, setItems] = useState([])
  const [metodo, setMetodo] = useState('efectivo')
  const [fecha, setFecha] = useState(hoyISO())
  const [notas, setNotas] = useState('')

  const anadir = (id) => {
    const p = catalogo?.find((x) => x.id === id)
    if (!p) return
    setItems([
      ...items,
      {
        procedimiento_id: p.id,
        descripcion: p.nombre,
        cantidad: 1,
        precio_unit_cop: p.precio_cop,
      },
    ])
  }

  const cambiar = (i, campo, valor) =>
    setItems(items.map((it, j) => (i === j ? { ...it, [campo]: Number(valor) } : it)))

  const total = items.reduce((t, i) => t + i.cantidad * i.precio_unit_cop, 0)

  const { enviar, guardando, error } = useGuardado(async () => {
    if (items.length === 0) throw new Error('Añade al menos un servicio')
    await crearCobro(
      {
        mascota_id: mascota.id,
        visita_id: visitaId ?? null,
        cita_id: citaId ?? null,
        fecha,
        metodo,
        estado: 'pagado',
        notas,
      },
      items,
    )
    avisar(`Cobro de ${dinero(total)} registrado`)
    alListo()
  })

  return (
    <form onSubmit={enviar}>
      <Campo id="c-anadir" etiqueta="Añadir servicio">
        <select id="c-anadir" value="" onChange={(e) => anadir(e.target.value)}>
          <option value="">Selecciona del catálogo…</option>
          {catalogo?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre} — {dinero(p.precio_cop)}
            </option>
          ))}
        </select>
      </Campo>

      {items.length > 0 && (
        <div className="tabla-marco" style={{ marginBottom: '0.75rem' }}>
          <table>
            <thead>
              <tr>
                <th>Servicio</th>
                <th className="numero">Cant.</th>
                <th className="numero">Precio</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {items.map((i, idx) => (
                <tr key={idx}>
                  <td>{i.descripcion}</td>
                  <td className="numero">
                    <input
                      type="number"
                      min="1"
                      aria-label={`Cantidad de ${i.descripcion}`}
                      value={i.cantidad}
                      onChange={(e) => cambiar(idx, 'cantidad', e.target.value)}
                      style={{ width: '4.5rem' }}
                    />
                  </td>
                  <td className="numero">
                    {/* El precio del catálogo es el sugerido: los descuentos y los
                        casos raros se ajustan aquí, no editando la lista de precios. */}
                    <input
                      type="number"
                      min="0"
                      step="500"
                      aria-label={`Precio de ${i.descripcion}`}
                      value={i.precio_unit_cop}
                      onChange={(e) => cambiar(idx, 'precio_unit_cop', e.target.value)}
                      style={{ width: '7rem' }}
                    />
                  </td>
                  <td>
                    <button
                      className="boton boton-mini boton-peligro"
                      type="button"
                      aria-label={`Quitar ${i.descripcion}`}
                      onClick={() => setItems(items.filter((_, j) => j !== idx))}
                    >
                      <Trash2 size={13} aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              ))}
              <tr>
                <td colSpan="2">
                  <strong>Total</strong>
                </td>
                <td className="numero">
                  <strong>{dinero(total)}</strong>
                </td>
                <td />
              </tr>
            </tbody>
          </table>
        </div>
      )}

      <div className="fila">
        <Campo id="c-fecha" etiqueta="Fecha">
          <input id="c-fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} />
        </Campo>
        <Campo id="c-metodo" etiqueta="Método de pago">
          <select id="c-metodo" value={metodo} onChange={(e) => setMetodo(e.target.value)}>
            <option value="efectivo">efectivo</option>
            <option value="transferencia">transferencia</option>
            <option value="tarjeta">tarjeta</option>
            <option value="otro">otro</option>
          </select>
        </Campo>
      </div>
      <Campo id="c-notas" etiqueta="Notas">
        <input id="c-notas" value={notas} onChange={(e) => setNotas(e.target.value)} />
      </Campo>

      <ErrorLinea error={error} />
      <div className="acciones">
        <button className="boton" disabled={guardando}>
          {guardando ? 'Guardando…' : `Cobrar ${dinero(total)}`}
        </button>
        <button className="boton boton-suave" type="button" onClick={onCancelar}>
          {textoCancelar}
        </button>
      </div>
    </form>
  )
}
