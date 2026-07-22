import { useState } from 'react'
import { Plus } from 'lucide-react'
import { anularCobro, cajaDelDia, cobrosDelDia } from '../db.js'
import { useAsync } from '../useAsync.js'
import { Chip, Dialogo, Estado } from '../ui.jsx'
import { avisar } from '../avisos.js'
import { BuscadorMascota, FormCobro } from './formularios.jsx'
import { dinero, fechaLarga, totalCobro } from '../formato.js'
import { hoyISO } from '../../whatsapp.js'

export default function Caja() {
  const [fecha, setFecha] = useState(hoyISO())
  const { datos, cargando, error, recargar } = useAsync(
    () => Promise.all([cobrosDelDia(fecha), cajaDelDia(fecha)]),
    [fecha],
  )
  const [cobros, porMetodo] = datos ?? [[], []]
  const total = porMetodo.reduce((t, f) => t + f.total_cop, 0)
  const [cobrando, setCobrando] = useState(false)
  const [mascota, setMascota] = useState(null)

  const cerrarCobro = () => {
    setCobrando(false)
    setMascota(null)
  }

  return (
    <>
      <div className="cabecera-vista">
        <h1>Caja</h1>
        {/* "Caja" es donde cualquiera va a cobrar: el botón tiene que estar aquí,
            no enterrado en la pestaña Cobros de la ficha (también sigue allá). */}
        <button className="boton boton-mini" type="button" onClick={() => setCobrando(true)}>
          <Plus size={15} aria-hidden="true" /> Nuevo cobro
        </button>
        <input
          type="date"
          aria-label="Día"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          style={{ width: 'auto' }}
        />
        <span className="suave">{fechaLarga(fecha)}</span>
      </div>

      {cobrando && (
        <Dialogo
          titulo={mascota ? `Cobro de ${mascota.nombre}` : 'Nuevo cobro'}
          onCerrar={cerrarCobro}
        >
          {!mascota ? (
            <BuscadorMascota elegida={null} alElegir={setMascota} />
          ) : (
            <>
              <BuscadorMascota elegida={mascota} alElegir={setMascota} />
              <FormCobro
                mascota={mascota}
                onCancelar={cerrarCobro}
                alListo={() => {
                  cerrarCobro()
                  recargar()
                }}
              />
            </>
          )}
        </Dialogo>
      )}

      <Estado cargando={cargando} error={error}>
        <>
          <div className="rejilla">
            <div className="tarjeta">
              <span className="cifra">{dinero(total)}</span>
              <span className="etiqueta">total cobrado</span>
            </div>
            {/* Solo los métodos que se usaron ese día: cuatro tarjetas en cero
                ocupan la pantalla sin decir nada. */}
            {porMetodo.map((m) => (
              <div className="tarjeta" key={m.metodo}>
                <span className="cifra">{dinero(m.total_cop)}</span>
                <span className="etiqueta">
                  {m.metodo} · {m.cobros} {m.cobros === 1 ? 'cobro' : 'cobros'}
                </span>
              </div>
            ))}
          </div>

          <h2 style={{ marginTop: '1.5rem' }}>Detalle</h2>
          {cobros.length === 0 ? (
            <p className="aviso">No hay cobros registrados este día.</p>
          ) : (
            <div className="tabla-marco">
              <table>
                <thead>
                  <tr>
                    <th>Mascota</th>
                    <th>Cliente</th>
                    <th>Servicios</th>
                    <th>Método</th>
                    <th className="numero">Total</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {cobros.map((c) => (
                    <tr key={c.id}>
                      <td>
                        <a href={`#/mascotas/${c.mascota_id}`}>{c.mascotas?.nombre}</a>
                      </td>
                      <td>{c.mascotas?.duenos?.nombre}</td>
                      <td className="pequeno">
                        {c.cobro_items?.map((i) => `${i.cantidad}× ${i.descripcion}`).join(', ')}
                      </td>
                      <td>
                        {c.metodo} <Chip valor={c.estado} />
                      </td>
                      <td className="numero">{dinero(totalCobro(c))}</td>
                      <td>
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
                            Anular
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      </Estado>
    </>
  )
}
