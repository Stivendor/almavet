import { useState } from 'react'
import { anularCobro, cajaDelDia, cobrosDelDia } from '../db.js'
import { useAsync } from '../useAsync.js'
import { Chip, Estado } from '../ui.jsx'
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

  return (
    <>
      <div className="cabecera-vista">
        <h1>Caja</h1>
        <input
          type="date"
          aria-label="Día"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          style={{ width: 'auto' }}
        />
        <span className="suave">{fechaLarga(fecha)}</span>
      </div>

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
