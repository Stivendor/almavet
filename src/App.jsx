import { useEffect, useState } from 'react'
import {
  Bath,
  Scissors,
  Stethoscope,
  Syringe,
  HeartPulse,
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  Menu,
  X,
  ArrowRight,
} from 'lucide-react'
import AppointmentForm from './AppointmentForm'
import { clinica, consultaMapa } from './config'
import { enlaceWhatsApp } from './whatsapp'

const enlaces = [
  ['#servicios', 'Servicios'],
  ['#nosotros', 'Nosotros'],
  ['#ubicacion', 'Ubicación'],
  ['#agendar', 'Agendar'],
]

const gruposServicios = [
  {
    rama: 'estilista',
    titulo: 'Estilista',
    tagline: 'Para que se vea bien',
    servicios: [
      {
        icono: Bath,
        titulo: 'Baño',
        texto: 'Baño con productos según el tipo de pelo y piel, secado y cepillado.',
      },
      {
        icono: Scissors,
        titulo: 'Baño + corte',
        texto:
          'Corte de raza o el estilo que prefieras, siempre con baño incluido. No hacemos corte por separado.',
      },
    ],
  },
  {
    rama: 'clinica',
    titulo: 'Clínica',
    tagline: 'Para que esté bien',
    servicios: [
      {
        icono: Stethoscope,
        titulo: 'Consulta general',
        texto: 'Revisión completa para saber cómo está tu mascota y prevenir a tiempo.',
      },
      {
        icono: Syringe,
        titulo: 'Vacunación',
        texto: 'Esquema de vacunas y desparasitación al día, con carné y recordatorios.',
      },
      {
        icono: HeartPulse,
        titulo: 'Urgencias y cirugía',
        texto: 'Atención de síntomas, valoración prequirúrgica y seguimiento posoperatorio.',
      },
    ],
  },
]

const mensajeGenerico = `Hola, escribo desde la página web de ${clinica.nombre}. Quisiera más información.`

function Header() {
  const [scroll, setScroll] = useState(false)
  const [abierto, setAbierto] = useState(false)

  useEffect(() => {
    const alScroll = () => setScroll(window.scrollY > 8)
    window.addEventListener('scroll', alScroll, { passive: true })
    return () => window.removeEventListener('scroll', alScroll)
  }, [])

  return (
    <header className={`header${scroll ? ' con-scroll' : ''}`}>
      <div className="contenedor">
        <div className="header-fila">
          <a className="logo" href="#inicio">
            {/* El logo es un JPG cuadrado con texto; aquí se recorta solo la marca. */}
            <span className="logo-marca" role="img" aria-label={`Logo de ${clinica.nombre}`} />
            <span>
              <span className="marca-alma">ALMA</span>
              <span className="marca-vet">VET</span>
            </span>
          </a>

          <nav className="nav" aria-label="Principal">
            {enlaces.map(([href, texto]) => (
              <a key={href} href={href}>
                {texto}
              </a>
            ))}
          </nav>

          <a className="boton boton-primario nav-cta" href="#agendar">
            Agendar cita
          </a>

          <button
            className="menu-boton"
            aria-expanded={abierto}
            aria-controls="menu-movil"
            aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
            onClick={() => setAbierto(!abierto)}
          >
            {abierto ? <X size={22} aria-hidden="true" /> : <Menu size={22} aria-hidden="true" />}
          </button>
        </div>

        {abierto && (
          <nav className="menu-movil" id="menu-movil" aria-label="Principal">
            {enlaces.map(([href, texto]) => (
              <a key={href} href={href} onClick={() => setAbierto(false)}>
                {texto}
              </a>
            ))}
          </nav>
        )}
      </div>
    </header>
  )
}

export default function App() {
  const [rama, setRama] = useState(null)

  const agendarCon = (nuevaRama) => {
    setRama(nuevaRama)
    document.getElementById('agendar')?.scrollIntoView({ behavior: 'smooth' })
  }

  return (
    <>
      <Header />

      <main id="inicio">
        <section className="hero">
          {clinica.fotoHero && (
            <>
              <img
                className="hero-foto"
                src={clinica.fotoHero}
                alt={`Fachada de ${clinica.nombre}`}
                width="1344"
                height="799"
              />
              <div className="hero-velo" />
            </>
          )}
          <div className="contenedor">
            <div className="hero-grid">
              <div>
                <h1>
                  Cuidamos a tu mascota como en <span className="marca-alma">ALMA</span>VET
                </h1>
                <p>
                  Consulta clínica, vacunación, baño y corte de pelo para perros y gatos. Agenda tu
                  cita en un minuto y te confirmamos por WhatsApp.
                </p>
                <a className="boton boton-hero" href="#agendar">
                  Agendar cita
                </a>
                <div className="hero-confianza">
                  {clinica.horarioResumen && (
                    <span>
                      <Clock size={16} aria-hidden="true" />
                      {clinica.horarioResumen}
                    </span>
                  )}
                  {clinica.barrio && (
                    <span>
                      <MapPin size={16} aria-hidden="true" />
                      {clinica.barrio}
                    </span>
                  )}
                  <span>
                    <MessageCircle size={16} aria-hidden="true" />
                    Respuesta por WhatsApp
                  </span>
                </div>
              </div>
              {/* Con foto de fondo, el letrero de la fachada ya es el logo: no se duplica. */}
              {!clinica.fotoHero && (
                <img
                  className="hero-logo"
                  src="/logo.jpg"
                  alt=""
                  width="260"
                  height="260"
                  aria-hidden="true"
                />
              )}
            </div>
          </div>
        </section>

        <section id="servicios" className="seccion-blanca">
          <div className="contenedor">
            <h2>Nuestros servicios</h2>
            <p className="subtitulo">Dos áreas bajo el mismo techo.</p>
            {gruposServicios.map(({ rama: r, titulo: tituloGrupo, tagline, servicios }) => (
              <div className="grupo-servicios" key={r}>
                <div className="grupo-cabecera">
                  <h3>{tituloGrupo}</h3>
                  <span className="grupo-tagline">{tagline}</span>
                </div>
                <div className="grid-servicios">
                  {servicios.map(({ icono: Icono, titulo, texto }) => (
                    <article className="tarjeta" key={titulo}>
                      <Icono className="tarjeta-icono" size={28} aria-hidden="true" />
                      <h4>{titulo}</h4>
                      <p>{texto}</p>
                      <button
                        className="tarjeta-enlace"
                        type="button"
                        onClick={() => agendarCon(r)}
                      >
                        Agendar este servicio <ArrowRight size={16} aria-hidden="true" />
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="nosotros">
          <div className="contenedor dos-columnas">
            <div>
              <h2>Sobre nosotros</h2>
              <p className="subtitulo">{clinica.sobreNosotros}</p>
            </div>
            <div className="foto-marco">
              {clinica.fotoEquipo ? (
                <img
                  src={clinica.fotoEquipo}
                  alt={`Equipo de ${clinica.nombre}`}
                  width="800"
                  height="600"
                  loading="lazy"
                />
              ) : (
                <img
                  className="placeholder-logo"
                  src="/logo.jpg"
                  alt=""
                  width="240"
                  height="240"
                  loading="lazy"
                />
              )}
            </div>
          </div>
        </section>

        <section id="ubicacion" className="seccion-blanca">
          <div className="contenedor dos-columnas">
            <div>
              <h2>Dónde estamos</h2>
              <ul className="datos-lista">
                {clinica.direccion && (
                  <li>
                    <MapPin size={20} aria-hidden="true" />
                    <span>
                      {clinica.direccion}
                      {clinica.ciudad && `, ${clinica.ciudad}`}
                    </span>
                  </li>
                )}
                {clinica.horario && (
                  <li>
                    <Clock size={20} aria-hidden="true" />
                    <span>{clinica.horario}</span>
                  </li>
                )}
                <li>
                  <Phone size={20} aria-hidden="true" />
                  <a href={enlaceWhatsApp(mensajeGenerico)} target="_blank" rel="noopener">
                    {clinica.whatsappVisible}
                  </a>
                </li>
              </ul>
              <a
                className="boton boton-secundario"
                href={`https://www.google.com/maps/search/?api=1&query=${consultaMapa}`}
                target="_blank"
                rel="noopener"
              >
                <MapPin size={18} aria-hidden="true" />
                Cómo llegar
              </a>
            </div>
            {clinica.direccion && (
              <iframe
                className="mapa"
                title={`Mapa de ubicación de ${clinica.nombre}`}
                src={`https://www.google.com/maps?q=${consultaMapa}&output=embed`}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            )}
          </div>
        </section>

        <section id="agendar">
          <div className="contenedor">
            <h2>Agenda tu cita</h2>
            <p className="subtitulo">
              Cuéntanos qué necesita tu mascota. Al enviar se abre WhatsApp con tu solicitud ya
              redactada, así atendemos más rápido y sin confusiones.
            </p>
            <AppointmentForm rama={rama} setRama={setRama} />
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="contenedor">
          <div className="footer-grid">
            <div>
              <h3>{clinica.nombre}</h3>
              <p>Clínica veterinaria y estilista para perros y gatos.</p>
            </div>
            <div>
              <h3>Contacto</h3>
              <p>
                <a href={enlaceWhatsApp(mensajeGenerico)} target="_blank" rel="noopener">
                  WhatsApp {clinica.whatsappVisible}
                </a>
              </p>
              {clinica.direccion && (
                <p>
                  {clinica.direccion}
                  {clinica.ciudad && `, ${clinica.ciudad}`}
                </p>
              )}
              {clinica.horario && <p>{clinica.horario}</p>}
            </div>
            <div>
              <h3>Síguenos</h3>
              {clinica.instagram && (
                <p>
                  <a href={clinica.instagram} target="_blank" rel="noopener">
                    Instagram
                  </a>
                </p>
              )}
              {clinica.facebook && (
                <p>
                  <a href={clinica.facebook} target="_blank" rel="noopener">
                    Facebook
                  </a>
                </p>
              )}
              {!clinica.instagram && !clinica.facebook && <p>Próximamente en redes sociales.</p>}
            </div>
          </div>
          <p className="footer-legal">
            © {new Date().getFullYear()} {clinica.nombre}. Todos los derechos reservados.
          </p>
        </div>
      </footer>

      <a
        className="flotante"
        href={enlaceWhatsApp(mensajeGenerico)}
        target="_blank"
        rel="noopener"
        aria-label="Escribir por WhatsApp"
      >
        <MessageCircle size={24} aria-hidden="true" />
        <span>WhatsApp</span>
      </a>
    </>
  )
}
