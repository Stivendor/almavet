import { useEffect, useState } from 'react'

// Enrutado por hash. Nueve pantallas planas no justifican react-router-dom, y el
// hash además evita configurar rewrites por ruta en Vercel. Si algún día hacen
// falta rutas anidadas o transiciones, se cambia entonces.

// '#/mascotas/abc%20123' -> '/mascotas/abc%20123'
export const rutaDe = (hash) => hash.replace(/^#/, '') || '/'

// Devuelve los parámetros si el patrón encaja, o null si no.
// emparejar('/mascotas/:id', '/mascotas/abc') -> { id: 'abc' }
export function emparejar(patron, ruta) {
  const p = patron.split('/').filter(Boolean)
  const r = ruta.split('/').filter(Boolean)
  if (p.length !== r.length) return null
  const params = {}
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(':')) params[p[i].slice(1)] = decodeURIComponent(r[i])
    else if (p[i] !== r[i]) return null
  }
  return params
}

// Primera coincidencia gana, así que las rutas literales van antes que las que
// tienen parámetro.
export function resolver(rutas, ruta) {
  for (const [patron, ...resto] of rutas) {
    const params = emparejar(patron, ruta)
    if (params) return { patron, params, resto }
  }
  return null
}

export function useRuta() {
  const [hash, setHash] = useState(() => window.location.hash)
  useEffect(() => {
    const alCambiar = () => setHash(window.location.hash)
    window.addEventListener('hashchange', alCambiar)
    return () => window.removeEventListener('hashchange', alCambiar)
  }, [])
  return rutaDe(hash)
}

export const ir = (ruta) => {
  window.location.hash = ruta
}
