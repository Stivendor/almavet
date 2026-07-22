import { useState } from 'react'
import { Plus } from 'lucide-react'
import { crearProcedimiento, guardarProcedimiento, procedimientos } from '../db.js'
import { useAsync } from '../useAsync.js'
import { Campo, Dialogo, ErrorLinea, Estado } from '../ui.jsx'
import { useGuardado } from '../useGuardado.js'
import { dinero } from '../formato.js'

// Solo un admin llega hasta aquí (la pestaña se esconde y la policy de 0004 lo
// impide de verdad). El resto del equipo ve los precios al cobrar.
export default function Precios({ yo }) {
  const { datos, cargando, error, recargar } = useAsync(() => procedimientos(false), [])
  const [editando, setEditando] = useState(null)

  if (yo.rol !== 'admin') {
    return <p className="aviso">Solo un administrador puede cambiar la lista de precios.</p>
  }

  return (
    <>
      <div className="cabecera-vista">
        <h1>Precios</h1>
        <button className="boton boton-mini" type="button" onClick={() => setEditando('nuevo')}>
          <Plus size={14} aria-hidden="true" /> Nuevo servicio
        </button>
      </div>

      <Estado cargando={cargando} error={error}>
        <div className="tabla-marco">
          <table>
            <thead>
              <tr>
                <th>Servicio</th>
                <th>Área</th>
                <th className="numero">Precio</th>
                <th className="numero">Duración</th>
                <th>Estado</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {datos?.map((p) => (
                <tr key={p.id}>
                  <td>{p.nombre}</td>
                  <td>{p.categoria}</td>
                  <td className="numero">{dinero(p.precio_cop)}</td>
                  <td className="numero">{p.duracion_min ? `${p.duracion_min} min` : '—'}</td>
                  <td>{p.activo ? 'activo' : 'oculto'}</td>
                  <td>
                    <button
                      className="boton boton-mini boton-suave"
                      type="button"
                      onClick={() => setEditando(p)}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Estado>

      {editando && (
        <Dialogo
          titulo={editando === 'nuevo' ? 'Nuevo servicio' : editando.nombre}
          onCerrar={() => setEditando(null)}
        >
          <FormProcedimiento
            inicial={editando === 'nuevo' ? {} : editando}
            onCancelar={() => setEditando(null)}
            alGuardar={async (datos) => {
              if (editando === 'nuevo') await crearProcedimiento(datos)
              else await guardarProcedimiento(editando.id, datos)
              setEditando(null)
              recargar()
            }}
          />
        </Dialogo>
      )}
    </>
  )
}

function FormProcedimiento({ inicial = {}, alGuardar, onCancelar }) {
  const [f, setF] = useState({
    nombre: inicial.nombre ?? '',
    categoria: inicial.categoria ?? 'clinica',
    precio_cop: inicial.precio_cop ?? 0,
    duracion_min: inicial.duracion_min ?? '',
    activo: inicial.activo ?? true,
  })
  const set = (k) => (e) =>
    setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  const { enviar, guardando, error } = useGuardado(() =>
    alGuardar({
      ...f,
      precio_cop: Number(f.precio_cop),
      duracion_min: f.duracion_min === '' ? null : Number(f.duracion_min),
    }),
  )

  return (
    <form onSubmit={enviar}>
      <Campo id="s-nombre" etiqueta="Nombre">
        <input id="s-nombre" required value={f.nombre} onChange={set('nombre')} />
      </Campo>
      <div className="fila">
        <Campo id="s-categoria" etiqueta="Área">
          <select id="s-categoria" value={f.categoria} onChange={set('categoria')}>
            <option value="clinica">clínica</option>
            <option value="estetica">estética</option>
          </select>
        </Campo>
        <Campo id="s-precio" etiqueta="Precio (COP)">
          <input
            id="s-precio"
            type="number"
            min="0"
            step="500"
            required
            value={f.precio_cop}
            onChange={set('precio_cop')}
          />
        </Campo>
        <Campo id="s-duracion" etiqueta="Duración (min)">
          <input
            id="s-duracion"
            type="number"
            min="5"
            step="5"
            value={f.duracion_min}
            onChange={set('duracion_min')}
          />
        </Campo>
      </div>

      <div className="campo checkbox">
        <input id="s-activo" type="checkbox" checked={f.activo} onChange={set('activo')} />
        {/* No se borra un servicio: los cobros viejos lo siguen nombrando. */}
        <label htmlFor="s-activo">Disponible al cobrar</label>
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
