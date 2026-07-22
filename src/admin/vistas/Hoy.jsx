import { hoyISO } from '../../whatsapp.js'
import { resumen } from '../db.js'
import { useAsync } from '../useAsync.js'
import { Chip, Estado } from '../ui.jsx'
import { agruparPorHora, dinero, fechaLarga } from '../formato.js'

// Lo que hay que saber al abrir la clínica por la mañana, sin navegar a nada.
export default function Hoy() {
  const hoy = hoyISO()
  const { datos, cargando, error } = useAsync(() => resumen(hoy), [hoy])

  return (
    <Estado cargando={cargando} error={error}>
      {datos && (
        <>
          <div className="cabecera-vista">
            <h1>Hoy</h1>
            <span className="suave">{fechaLarga(hoy)}</span>
          </div>

          <div className="rejilla">
            <a className="tarjeta" href="#/solicitudes" style={{ textDecoration: 'none' }}>
              <span className="cifra">{datos.solicitudesNuevas}</span>
              <span className="etiqueta">solicitudes sin atender</span>
            </a>
            <a className="tarjeta" href="#/agenda" style={{ textDecoration: 'none' }}>
              <span className="cifra">{datos.citasHoy.length}</span>
              <span className="etiqueta">citas hoy</span>
            </a>
            <a className="tarjeta" href="#/recordatorios" style={{ textDecoration: 'none' }}>
              <span className="cifra">{datos.recordatorios}</span>
              <span className="etiqueta">refuerzos por avisar</span>
            </a>
            <a className="tarjeta" href="#/caja" style={{ textDecoration: 'none' }}>
              <span className="cifra">{dinero(datos.cajaHoy)}</span>
              <span className="etiqueta">cobrado hoy</span>
            </a>
          </div>

          <h2 style={{ marginTop: '1.5rem' }}>Agenda del día</h2>
          {datos.citasHoy.length === 0 ? (
            <p className="aviso">No hay citas agendadas para hoy.</p>
          ) : (
            agruparPorHora(datos.citasHoy).map(([franja, citas]) => (
              <div className="tarjeta" key={franja}>
                <h3>{franja}</h3>
                {citas.map((c) => (
                  <p key={c.id} style={{ margin: '0.25rem 0' }}>
                    <a href={`#/mascotas/${c.mascota_id}`}>{c.mascotas?.nombre}</a>{' '}
                    <span className="suave pequeno">de {c.mascotas?.duenos?.nombre}</span>{' '}
                    <Chip valor={c.rama} clase="rama" /> <Chip valor={c.estado} />
                  </p>
                ))}
              </div>
            ))
          )}
        </>
      )}
    </Estado>
  )
}
