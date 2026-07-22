import { useEffect, useState } from 'react'
import {
  BellRing,
  CalendarDays,
  Inbox,
  LayoutDashboard,
  LogOut,
  Tag,
  Users,
  Wallet,
} from 'lucide-react'
import { configurado, sb } from './cliente.js'
import { perfil } from './db.js'
import { resolver, useRuta } from './router.js'
import { useAsync } from './useAsync.js'
import { Avisos, Estado } from './ui.jsx'
import Login from './Login.jsx'
import Hoy from './vistas/Hoy.jsx'
import Solicitudes from './vistas/Solicitudes.jsx'
import Agenda from './vistas/Agenda.jsx'
import Clientes from './vistas/Clientes.jsx'
import FichaDueno from './vistas/FichaDueno.jsx'
import FichaMascota from './vistas/FichaMascota.jsx'
import Recordatorios from './vistas/Recordatorios.jsx'
import Caja from './vistas/Caja.jsx'
import Precios from './vistas/Precios.jsx'

// [patrón, componente, etiqueta del menú, icono]. Sin etiqueta = no sale en el
// menú, se llega desde una lista. La primera coincidencia gana, y como '/duenos'
// y '/duenos/:id' tienen distinto número de segmentos, el orden no importa.
const rutas = [
  ['/', Hoy, 'Hoy', LayoutDashboard],
  ['/solicitudes', Solicitudes, 'Solicitudes', Inbox],
  ['/agenda', Agenda, 'Agenda', CalendarDays],
  ['/clientes', Clientes, 'Clientes', Users],
  ['/recordatorios', Recordatorios, 'Recordatorios', BellRing],
  ['/caja', Caja, 'Caja', Wallet],
  ['/precios', Precios, 'Precios', Tag],
  ['/duenos/:id', FichaDueno],
  ['/mascotas/:id', FichaMascota],
]

const menu = rutas.filter(([, , etiqueta]) => etiqueta)

export default function App() {
  const [sesion, setSesion] = useState(undefined)

  useEffect(() => {
    if (!sb) return
    sb.auth.getSession().then(({ data }) => setSesion(data.session))
    const { data } = sb.auth.onAuthStateChange((_evento, s) => setSesion(s))
    return () => data.subscription.unsubscribe()
  }, [])

  if (!configurado) {
    return (
      <div className="login">
        <p className="aviso aviso-error">
          Faltan <code>VITE_SUPABASE_URL</code> y <code>VITE_SUPABASE_PUBLISHABLE_KEY</code>.
        </p>
      </div>
    )
  }
  // undefined = todavía no sabemos si hay sesión guardada; null = no hay.
  if (sesion === undefined) {
    return (
      <div className="login">
        <p className="aviso">Cargando…</p>
      </div>
    )
  }
  if (!sesion) return <Login />
  return <Panel sesion={sesion} />
}

function Panel({ sesion }) {
  const ruta = useRuta()
  const { datos: yo, cargando, error } = useAsync(perfil, [sesion.user.id])

  const encontrada = resolver(rutas, ruta)
  const Vista = encontrada?.resto[0]

  return (
    <>
      <header className="barra">
        <div className="barra-fila">
          <span className="barra-marca">
            {/* El logo real, no un wordmark en texto: el único rasgo de identidad
                que se permite esta herramienta. */}
            <img className="barra-logo" src="/logo.jpg" alt="" width="26" height="26" />
            AlmaVET
          </span>
          <span className="barra-usuario">
            {yo?.nombre ?? sesion.user.email}
            <button
              className="boton boton-mini boton-suave"
              onClick={() => sb.auth.signOut()}
              type="button"
            >
              <LogOut size={14} aria-hidden="true" /> Salir
            </button>
          </span>
        </div>
        {yo?.activo && (
          <nav className="nav" aria-label="Secciones del panel">
            {menu
              // La lista de precios solo la cambia un admin (policy en 0004);
              // esconder la pestaña es coherencia con eso, no la protección.
              .filter(([patron]) => patron !== '/precios' || yo.rol === 'admin')
              .map(([patron, , etiqueta, Icono]) => {
                const activa = patron === '/' ? ruta === '/' : ruta.startsWith(patron)
                return (
                  <a key={patron} href={`#${patron}`} aria-current={activa ? 'page' : undefined}>
                    <Icono size={15} aria-hidden="true" />
                    {etiqueta}
                  </a>
                )
              })}
          </nav>
        )}
      </header>

      <main className="contenido">
        <Estado cargando={cargando} error={error}>
          {/* Autenticado no es autorizado: sin fila en `staff` la cuenta entra
              pero no ve nada, igual que le responde la base de datos. */}
          {!yo || !yo.activo ? (
            <p className="aviso aviso-error">
              Esta cuenta no tiene acceso al panel. Pídele a un administrador que la registre en el
              equipo.
            </p>
          ) : Vista ? (
            <Vista {...encontrada.params} yo={yo} />
          ) : (
            <p className="aviso">
              Esta página no existe. <a href="#/">Volver al inicio</a>.
            </p>
          )}
        </Estado>
      </main>

      <Avisos />
    </>
  )
}
