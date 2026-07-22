import { useEffect, useState } from 'react'

// Carga asíncrona con recarga manual. No hay TanStack Query porque no hay caché
// compartida entre pantallas que justifique 13 kB: cada vista pide lo suyo y lo
// vuelve a pedir después de escribir. Si aparecen datos compartidos, se cambia.
export function useAsync(fn, deps = []) {
  const [version, setVersion] = useState(0)
  const [estado, setEstado] = useState({ cargando: true, datos: null, error: null })

  useEffect(() => {
    // Evita pintar la respuesta de una consulta que ya no corresponde a lo que
    // se está viendo (cambiar de ficha antes de que llegue la anterior).
    let vigente = true
    setEstado((e) => ({ ...e, cargando: true }))
    fn()
      .then((datos) => vigente && setEstado({ cargando: false, datos, error: null }))
      .catch((error) => vigente && setEstado({ cargando: false, datos: null, error }))
    return () => {
      vigente = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, version])

  return { ...estado, recargar: () => setVersion((v) => v + 1) }
}
