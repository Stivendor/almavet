// Confirmación de que algo se guardó. Un CustomEvent en window en vez de un
// contexto de React: cualquier módulo puede avisar sin que el árbol entero
// dependa de un provider. Lo escucha <Avisos/> en ui.jsx.
export const avisar = (texto) => window.dispatchEvent(new CustomEvent('aviso', { detail: texto }))
