import { useState } from 'react'
import { sb } from './cliente.js'
import { Campo, ErrorLinea } from './ui.jsx'
import { useGuardado } from './useGuardado.js'

export default function Login() {
  const [email, setEmail] = useState('')
  const [clave, setClave] = useState('')

  // No hay registro ni "olvidé mi contraseña": las cuentas las crea un admin desde
  // el dashboard de Supabase (supabase/seed_staff.sql). Un formulario de registro
  // abierto en un panel clínico es una puerta que nadie pidió.
  const { enviar, guardando, error } = useGuardado(async () => {
    const { error: e } = await sb.auth.signInWithPassword({ email, password: clave })
    if (e) throw new Error('Correo o contraseña incorrectos')
  })

  return (
    <div className="login">
      <form onSubmit={enviar}>
        <h1>Panel AlmaVet</h1>
        <p className="suave pequeno">Acceso solo para el equipo de la clínica.</p>

        <Campo id="email" etiqueta="Correo">
          <input
            id="email"
            type="email"
            autoComplete="username"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Campo>

        <Campo id="clave" etiqueta="Contraseña">
          <input
            id="clave"
            type="password"
            autoComplete="current-password"
            required
            value={clave}
            onChange={(e) => setClave(e.target.value)}
          />
        </Campo>

        <ErrorLinea error={error} />

        <button className="boton" style={{ width: '100%' }} disabled={guardando}>
          {guardando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
