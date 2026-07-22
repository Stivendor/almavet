import { hoyISO } from '../../whatsapp.js'
import { resumen } from '../db.js'
import { useAsync } from '../useAsync.js'
import { Estado } from '../ui.jsx'
import { TarjetaCita } from './TarjetaCita.jsx'
import { dinero, fechaLarga } from '../formato.js'

// Lo que hay que saber al abrir la clínica por la mañana, sin navegar a nada.
export default function Hoy() {
  const hoy = hoyISO()
  const { datos, cargando, error, recargar } = useAsync(() => resumen(hoy), [hoy])

  return (
    <Estado cargando={cargando} error={error}>
      {datos && (
        <>
          <div className="cabecera-vista">
            <h1>Hoy</h1>
            <span className="suave">{fechaLarga(hoy)}</span>
          </div>

          <div className="rejilla">
            {/* Las dos primeras son TAREAS: se encienden cuando hay pendientes y
                se apagan en cero. Las otras dos son informe: siempre neutras. */}
            <Cifra
              href="#/solicitudes"
              valor={datos.solicitudesNuevas}
              etiqueta="solicitudes sin atender"
              pendiente={datos.solicitudesNuevas > 0}
            />
            <Cifra
              href="#/recordatorios"
              valor={datos.recordatorios}
              etiqueta="refuerzos por avisar"
              pendiente={datos.recordatorios > 0}
            />
            <Cifra href="#/agenda" valor={datos.citasHoy.length} etiqueta="citas hoy" />
            <Cifra href="#/caja" valor={dinero(datos.cajaHoy)} etiqueta="cobrado hoy" />
          </div>

          <h2 style={{ marginTop: '1.5rem' }}>Agenda del día</h2>
          {datos.citasHoy.length === 0 ? (
            <p className="aviso">
              No hay citas agendadas para hoy. <a href="#/agenda">Crear una en la agenda</a>.
            </p>
          ) : (
            // Sin agrupar por franja: cada tarjeta ya dice su hora, y el grupo
            // la repetía como título.
            <div className="rejilla-citas">
              {[...datos.citasHoy]
                .sort((a, b) => a.fecha_hora.localeCompare(b.fecha_hora))
                .map((c) => (
                  <TarjetaCita key={c.id} cita={c} alCambiar={recargar} />
                ))}
            </div>
          )}
        </>
      )}
    </Estado>
  )
}

function Cifra({ href, valor, etiqueta, pendiente }) {
  return (
    <a className={`tarjeta tarjeta-boton${pendiente ? ' con-pendientes' : ''}`} href={href}>
      <span className={`cifra${valor === 0 ? ' cifra-cero' : ''}`}>{valor}</span>
      <span className="etiqueta">{etiqueta}</span>
    </a>
  )
}
