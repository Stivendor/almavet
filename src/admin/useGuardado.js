import { useState } from 'react'

// Envío de formulario con estado de guardado y error visible. Lo comparten los
// ocho formularios del panel: sin esto, cada uno reinventa los mismos tres useState.
export function useGuardado(alGuardar) {
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState(null)

  const enviar = async (ev) => {
    ev.preventDefault()
    setGuardando(true)
    setError(null)
    try {
      await alGuardar()
    } catch (e) {
      setError(e)
    } finally {
      setGuardando(false)
    }
  }

  return { enviar, guardando, error }
}
