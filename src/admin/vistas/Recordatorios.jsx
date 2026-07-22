import { MessageCircle } from 'lucide-react'
import { recordatorios } from '../db.js'
import { useAsync } from '../useAsync.js'
import { Chip, Estado } from '../ui.jsx'
import { fechaLarga } from '../formato.js'
import { enlaceWhatsAppA, formatoTelefono } from '../../whatsapp.js'
import { clinica } from '../../config.js'

// Click-to-chat con el mensaje ya escrito. No se usa la API de WhatsApp Business
// a propósito: costaría plata y verificación de plantillas para un recordatorio
// que el equipo manda de a diez por semana.
const mensaje = (r) =>
  `Hola ${r.dueno}, te escribimos del ${clinica.nombre}. A ${r.mascota} le corresponde ${
    r.tipo === 'vacuna' ? 'el refuerzo de' : 'la aplicación de'
  } ${r.producto} el ${fechaLarga(r.proxima_dosis)}. ¿Te agendamos la cita?`

export default function Recordatorios() {
  const { datos, cargando, error } = useAsync(recordatorios, [])

  return (
    <>
      <div className="cabecera-vista">
        <h1>Recordatorios</h1>
        <span className="suave pequeno">Refuerzos vencidos o que vencen en los próximos 30 días</span>
      </div>

      <Estado cargando={cargando} error={error}>
        {datos?.length === 0 ? (
          <p className="aviso">No hay refuerzos pendientes. Todo al día.</p>
        ) : (
          <div className="tabla-marco">
            <table>
              <thead>
                <tr>
                  <th>Vence</th>
                  <th>Mascota</th>
                  <th>Cliente</th>
                  <th>Aplicación</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {datos?.map((r) => (
                  <tr key={r.id}>
                    <td>
                      {fechaLarga(r.proxima_dosis)}
                      <div className="pequeno">
                        {r.dias_restantes < 0 ? (
                          <Chip valor="vencido" />
                        ) : (
                          <span className="suave">en {r.dias_restantes} días</span>
                        )}
                      </div>
                    </td>
                    <td>
                      <a href={`#/mascotas/${r.mascota_id}`}>{r.mascota}</a>
                      <div className="pequeno suave">{r.especie}</div>
                    </td>
                    <td>
                      <a href={`#/duenos/${r.dueno_id}`}>{r.dueno}</a>
                      <div className="pequeno suave">{formatoTelefono(r.telefono)}</div>
                    </td>
                    <td>
                      <Chip valor={r.tipo} /> {r.producto}
                    </td>
                    <td>
                      <a
                        className="boton boton-mini boton-wa"
                        href={enlaceWhatsAppA(r.telefono, mensaje(r))}
                        target="_blank"
                        rel="noopener"
                      >
                        <MessageCircle size={14} aria-hidden="true" /> Recordar
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
