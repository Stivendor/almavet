import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

export const configurado = Boolean(url && key)

// La llave publishable viaja en el bundle, igual que en la landing. Lo que protege
// las historias clínicas es RLS + public.es_staff(), no el secreto de la llave.
//
// Aquí sí se usa supabase-js (la landing no lo carga): la sesión con refresh de
// tokens y el manejo de expiración no son código que valga la pena escribir a mano.
export const sb = configurado ? createClient(url, key) : null
