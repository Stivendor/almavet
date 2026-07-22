import { useState } from 'react'
import { PawPrint, Search, UserPlus } from 'lucide-react'
import { buscarDuenos, crearDueno, mascotasPorNombre } from '../db.js'
import { useAsync } from '../useAsync.js'
import { Dialogo, Estado } from '../ui.jsx'
import { avisar } from '../avisos.js'
import { FormDueno } from './formularios.jsx'
import { formatoTelefono } from '../../whatsapp.js'
import { ir } from '../router.js'

export default function Clientes() {
  const [texto, setTexto] = useState('')
  const [busqueda, setBusqueda] = useState('')
  // La gente busca tanto por dueño como por mascota ("vengo con Luna"): las dos
  // consultas corren juntas y se muestran en secciones separadas.
  const { datos, cargando, error, recargar } = useAsync(
    () => Promise.all([buscarDuenos(busqueda), busqueda.trim() ? mascotasPorNombre(busqueda) : []]),
    [busqueda],
  )
  const [duenos, mascotas] = datos ?? [null, []]
  const [creando, setCreando] = useState(false)

  return (
    <>
      <div className="cabecera-vista">
        <h1>Clientes</h1>
        <button className="boton boton-mini" type="button" onClick={() => setCreando(true)}>
          <UserPlus size={15} aria-hidden="true" /> Nuevo cliente
        </button>
      </div>

      {/* Se busca al enviar y no en cada tecla: sin debounce, teclear "Sebastián"
          serían nueve consultas para leer la última. */}
      <form
        className="fila"
        style={{ marginBottom: '1rem' }}
        onSubmit={(e) => {
          e.preventDefault()
          setBusqueda(texto)
        }}
      >
        <input
          aria-label="Buscar por dueño, mascota o celular"
          placeholder="Dueño, mascota o celular"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <button className="boton encoge">
          <Search size={15} aria-hidden="true" /> Buscar
        </button>
      </form>

      <Estado cargando={cargando} error={error}>
        {mascotas?.length > 0 && (
          <>
            <h2>
              <PawPrint size={16} aria-hidden="true" /> Mascotas
            </h2>
            <div className="rejilla" style={{ marginBottom: '1rem' }}>
              {mascotas.map((m) => (
                <a
                  key={m.id}
                  className="tarjeta tarjeta-boton"
                  href={`#/mascotas/${m.id}`}
                >
                  <strong>{m.nombre}</strong>
                  <div className="pequeno suave">
                    {m.especie}
                    {m.raza && ` · ${m.raza}`} · de {m.duenos?.nombre}
                  </div>
                </a>
              ))}
            </div>
            <h2>Clientes</h2>
          </>
        )}

        {duenos?.length === 0 ? (
          <p className="aviso">
            {mascotas?.length
              ? 'Ningún dueño con ese nombre; arriba están las mascotas que coinciden.'
              : busqueda
                ? `Sin resultados para "${busqueda}".`
                : 'Todavía no hay clientes.'}
          </p>
        ) : (
          <div className="tabla-marco">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Celular</th>
                  <th>Mascotas</th>
                </tr>
              </thead>
              <tbody>
                {duenos?.map((d) => (
                  <tr key={d.id}>
                    <td>
                      <a href={`#/duenos/${d.id}`}>{d.nombre}</a>
                      {!d.autoriza_datos && (
                        <div className="pequeno" style={{ color: 'var(--alerta)' }}>
                          sin autorización de datos
                        </div>
                      )}
                    </td>
                    <td>{formatoTelefono(d.telefono)}</td>
                    <td>
                      {d.mascotas?.length
                        ? d.mascotas
                            .filter((m) => m.activo)
                            .map((m) => (
                              <a
                                key={m.id}
                                className="chip"
                                href={`#/mascotas/${m.id}`}
                                style={{ marginRight: '0.25rem', textDecoration: 'none' }}
                              >
                                {m.nombre}
                              </a>
                            ))
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Estado>

      {creando && (
        <Dialogo titulo="Nuevo cliente" onCerrar={() => setCreando(false)}>
          <FormDueno
            onCancelar={() => setCreando(false)}
            alGuardar={async (nuevo) => {
              const d = await crearDueno(nuevo)
              avisar('Cliente creado')
              setCreando(false)
              recargar()
              ir(`/duenos/${d.id}`)
            }}
          />
        </Dialogo>
      )}
    </>
  )
}
