import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'

// ---------------------------------------------------------------- avisos
// Muestra las confirmaciones que dispara avisar() (avisos.js). Sin esto la
// única señal de guardado era que la lista se recargaba, y la gente le daba
// dos veces al botón por la duda.
export function Avisos() {
  const [lista, setLista] = useState([])

  useEffect(() => {
    const alAviso = (e) => {
      const id = crypto.randomUUID()
      setLista((l) => [...l, { id, texto: e.detail }])
      setTimeout(() => setLista((l) => l.filter((a) => a.id !== id)), 3500)
    }
    window.addEventListener('aviso', alAviso)
    return () => window.removeEventListener('aviso', alAviso)
  }, [])

  return (
    <div className="avisos" role="status" aria-live="polite">
      {lista.map((a) => (
        <div className="aviso-flotante" key={a.id}>
          {a.texto}
        </div>
      ))}
    </div>
  )
}

// Envuelve el resultado de useAsync: mientras carga o si falló, no se pinta la
// vista a medias. Cada pantalla se queda con su caso de éxito y nada más.
export function Estado({ cargando, error, children }) {
  if (cargando) return <p className="aviso">Cargando…</p>
  if (error)
    return (
      <p className="aviso aviso-error" role="alert">
        {error.message}
      </p>
    )
  return children
}

export function Campo({ id, etiqueta, error, ayuda, children }) {
  return (
    <div className="campo">
      <label htmlFor={id}>{etiqueta}</label>
      {children}
      {ayuda && !error && <span className="pequeno suave">{ayuda}</span>}
      {error && (
        <span className="campo-error" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}

// Los estados de la BD vienen en snake_case ('no_asistio'); el chip los muestra
// como se leen.
export const Chip = ({ valor, clase }) =>
  valor ? (
    <span className={`chip chip-${clase ?? valor}`}>{String(valor).replace(/_/g, ' ')}</span>
  ) : null

// <dialog> nativo: el foco atrapado, el Esc y el backdrop ya vienen resueltos por
// el navegador. Reimplementarlos en React es la parte que siempre sale accesible a medias.
export function Dialogo({ titulo, onCerrar, children }) {
  const ref = useRef(null)
  useEffect(() => {
    ref.current?.showModal()
  }, [])

  return (
    <dialog
      ref={ref}
      onCancel={(e) => {
        e.preventDefault()
        onCerrar()
      }}
    >
      <div className="dialogo-cabecera">
        <h2>{titulo}</h2>
        <button type="button" onClick={onCerrar} aria-label="Cerrar">
          <X size={20} aria-hidden="true" />
        </button>
      </div>
      <div className="dialogo-cuerpo">{children}</div>
    </dialog>
  )
}

export const ErrorLinea = ({ error }) =>
  error ? (
    <p className="aviso aviso-error" role="alert">
      {error.message}
    </p>
  ) : null

export const Vacio = ({ children }) => <p className="aviso">{children}</p>
