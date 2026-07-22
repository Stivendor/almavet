import { useState } from 'react'
import { MessageCircle, PawPrint, Pencil, Trash2 } from 'lucide-react'
import { borrarDueno, crearMascota, dueno as leerDueno, guardarDueno } from '../db.js'
import { useAsync } from '../useAsync.js'
import { Dialogo, ErrorLinea, Estado } from '../ui.jsx'
import { useGuardado } from '../useGuardado.js'
import { FormDueno, FormMascota } from './formularios.jsx'
import { edad } from '../formato.js'
import { enlaceWhatsAppA, formatoTelefono } from '../../whatsapp.js'
import { clinica } from '../../config.js'
import { ir } from '../router.js'

export default function FichaDueno({ id }) {
  const { datos: d, cargando, error, recargar } = useAsync(() => leerDueno(id), [id])
  const [editando, setEditando] = useState(false)
  const [nuevaMascota, setNuevaMascota] = useState(false)
  const [borrando, setBorrando] = useState(false)

  return (
    <Estado cargando={cargando} error={error}>
      {d && (
        <>
          <div className="cabecera-vista">
            <h1>{d.nombre}</h1>
            <a
              className="boton boton-mini boton-wa"
              href={enlaceWhatsAppA(
                d.telefono,
                `Hola ${d.nombre}, te escribimos del ${clinica.nombre}.`,
              )}
              target="_blank"
              rel="noopener"
            >
              <MessageCircle size={14} aria-hidden="true" /> {formatoTelefono(d.telefono)}
            </a>
            <button
              className="boton boton-mini boton-suave"
              type="button"
              onClick={() => setEditando(true)}
            >
              <Pencil size={14} aria-hidden="true" /> Editar
            </button>
          </div>

          <div className="tarjeta">
            <div className="rejilla">
              <Dato etiqueta="Correo" valor={d.email} />
              <Dato etiqueta="Documento" valor={d.documento} />
              <Dato etiqueta="Dirección" valor={d.direccion} />
              <Dato
                etiqueta="Autorización de datos"
                valor={d.autoriza_datos ? 'sí' : 'NO — pedirla antes de tratar sus datos'}
              />
            </div>
            {d.notas && <p style={{ marginTop: '0.75rem' }}>{d.notas}</p>}
          </div>

          <div className="cabecera-vista" style={{ marginTop: '1.5rem' }}>
            <h2>Mascotas</h2>
            <button
              className="boton boton-mini"
              type="button"
              onClick={() => setNuevaMascota(true)}
            >
              <PawPrint size={14} aria-hidden="true" /> Añadir mascota
            </button>
          </div>

          {d.mascotas?.length ? (
            <div className="rejilla">
              {d.mascotas.map((m) => (
                <a
                  key={m.id}
                  className="tarjeta"
                  href={`#/mascotas/${m.id}`}
                  style={{ textDecoration: 'none' }}
                >
                  <strong>{m.nombre}</strong>
                  <div className="pequeno suave">
                    {[m.especie, m.raza, edad(m.fecha_nacimiento)].filter(Boolean).join(' · ')}
                  </div>
                  {m.alergias && (
                    <div className="pequeno" style={{ color: 'var(--acento)' }}>
                      Alergias: {m.alergias}
                    </div>
                  )}
                </a>
              ))}
            </div>
          ) : (
            <p className="aviso">Este cliente no tiene mascotas registradas.</p>
          )}

          <div style={{ marginTop: '2.5rem' }}>
            <button
              className="boton boton-mini boton-peligro"
              type="button"
              onClick={() => setBorrando(true)}
            >
              <Trash2 size={14} aria-hidden="true" /> Eliminar cliente y sus datos
            </button>
          </div>

          {editando && (
            <Dialogo titulo="Editar cliente" onCerrar={() => setEditando(false)}>
              <FormDueno
                inicial={d}
                onCancelar={() => setEditando(false)}
                alGuardar={async (datos) => {
                  await guardarDueno(d.id, datos)
                  setEditando(false)
                  recargar()
                }}
              />
            </Dialogo>
          )}

          {nuevaMascota && (
            <Dialogo titulo={`Nueva mascota de ${d.nombre}`} onCerrar={() => setNuevaMascota(false)}>
              <FormMascota
                onCancelar={() => setNuevaMascota(false)}
                alGuardar={async (datos) => {
                  const m = await crearMascota({ ...datos, dueno_id: d.id })
                  setNuevaMascota(false)
                  ir(`/mascotas/${m.id}`)
                }}
              />
            </Dialogo>
          )}

          {borrando && <DialogoBorrar d={d} onCerrar={() => setBorrando(false)} />}
        </>
      )}
    </Estado>
  )
}

const Dato = ({ etiqueta, valor }) => (
  <div>
    <span className="etiqueta">{etiqueta}</span>
    <div>{valor || '—'}</div>
  </div>
)

// Ley 1581/2012: el titular puede pedir la supresión de sus datos. El borrado es
// real y en cascada, así que la pantalla dice exactamente qué se lleva por delante.
function DialogoBorrar({ d, onCerrar }) {
  const [texto, setTexto] = useState('')
  const { enviar, guardando, error } = useGuardado(async () => {
    await borrarDueno(d.id)
    ir('/clientes')
  })

  return (
    <Dialogo titulo="Eliminar cliente" onCerrar={onCerrar}>
      <form onSubmit={enviar}>
        <p className="aviso aviso-error">
          Se eliminan <strong>{d.nombre}</strong>, sus {d.mascotas?.length ?? 0} mascotas y toda su
          historia clínica, vacunas y cobros. No se puede deshacer.
        </p>
        <p className="pequeno suave">
          Escribe <strong>{d.nombre}</strong> para confirmar.
        </p>
        <input
          aria-label="Confirmar nombre del cliente"
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
        />
        <ErrorLinea error={error} />
        <div className="acciones" style={{ marginTop: '0.75rem' }}>
          <button className="boton boton-peligro" disabled={guardando || texto !== d.nombre}>
            {guardando ? 'Eliminando…' : 'Eliminar definitivamente'}
          </button>
          <button className="boton boton-suave" type="button" onClick={onCerrar}>
            Cancelar
          </button>
        </div>
      </form>
    </Dialogo>
  )
}
