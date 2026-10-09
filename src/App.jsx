import { useEffect, useState } from 'react'
import {
  Bath,
  Scissors,
  Stethoscope,
  Syringe,
  HeartPulse,
  MapPin,
  Clock,
  CalendarCheck,
  CheckCircle2,
  MessageCircle,
  Menu,
  X,
  ArrowRight,
  PawPrint,
  ShieldCheck,
  Sparkles,
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

const puntosConfianza = [
  {
    icono: ShieldCheck,
    titulo: 'Atención con criterio clínico',
    texto: 'Valoramos cada caso con calma antes de recomendar vacunas, tratamientos o procedimientos.',
  },
  {
    icono: Sparkles,
    titulo: 'Estilismo sin carreras',
    texto: 'Baño y corte pensados para que tu mascota esté limpia, cómoda y tranquila.',
  },
  {
    icono: MessageCircle,
    titulo: 'Confirmación por WhatsApp',
    texto: 'Llegas con la información clara y nosotros preparamos mejor la cita.',
  },
]

const pasosAgenda = [
  {
    icono: PawPrint,
    titulo: 'Elige el servicio',
    texto: 'Clínica o estilista, según lo que necesite tu mascota.',
  },
  {
    icono: CalendarCheck,
    titulo: 'Cuéntanos fecha y detalles',
    texto: 'Envíanos síntomas, preferencias o comentarios importantes.',
  },
  {
    icono: CheckCircle2,
    titulo: 'Confirmamos por chat',
    texto: 'Te respondemos por WhatsApp para cerrar la hora disponible.',
  },
]

function useScrollReveal() {
  useEffect(() => {
    const elementos = document.querySelectorAll('[data-reveal]')
    if (!elementos.length) return undefined

    if (!('IntersectionObserver' in window)) {
      elementos.forEach((el) => el.classList.add('revelado'))
      return undefined
    }

    const observador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((entrada) => {
          if (!entrada.isIntersecting) return
          entrada.target.classList.add('revelado')
          observador.unobserve(entrada.target)
        })
      },
      { threshold: 0.16 }
    )

    elementos.forEach((el) => observador.observe(el))
    return () => observador.disconnect()
  }, [])
}

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
  useScrollReveal()

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
                alt={`Fachada de ${clinica.nombre} en ${clinica.barrio}`}
                width="1344"
                height="799"
                fetchPriority="high"
              />
              <div className="hero-velo" />
            </>
          )}
          <div className="contenedor">
            <div className="hero-grid">
              <div className="hero-copy" data-reveal>
                {/* El letrero de la fachada ya dice la marca: el h1 dice qué somos y dónde. */}
                <span className="hero-etiqueta">
                  <PawPrint size={16} aria-hidden="true" />
                  Clínica veterinaria y estilista
                </span>
                <h1>Tu veterinaria de barrio en Santo Domingo Savio</h1>
                <p>
                  Consulta clínica, vacunación, baño y corte de pelo para perros y gatos. Agenda tu
                  cita en un minuto y te confirmamos por WhatsApp.
                </p>
                <div className="hero-acciones">
                  <a className="boton boton-hero" href="#agendar">
                    Agendar cita
                    <ArrowRight size={18} aria-hidden="true" />
                  </a>
                  <a
                    className="boton boton-hero-secundario"
                    href={enlaceWhatsApp(mensajeGenerico)}
                    target="_blank"
                    rel="noopener"
                  >
                    <MessageCircle size={18} aria-hidden="true" />
                    Escribir ahora
                  </a>
                </div>
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

        <section className="banda-confianza" aria-label="Razones para elegir AlmaVet">
          <div className="contenedor">
            <div className="confianza-grid">
              {puntosConfianza.map(({ icono: Icono, titulo, texto }) => (
                <article className="confianza-item" key={titulo} data-reveal>
                  <span className="confianza-icono">
                    <Icono size={22} aria-hidden="true" />
                  </span>
                  <div>
                    <h2>{titulo}</h2>
                    <p>{texto}</p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="servicios" className="seccion-blanca">
          <div className="contenedor">
            <div className="seccion-encabezado" data-reveal>
              <span className="etiqueta-seccion">Servicios</span>
              <h2>Veterinaria y estilismo para perros y gatos</h2>
              <p className="subtitulo">Dos áreas bajo el mismo techo, con una atención cercana y fácil de agendar.</p>
            </div>
            {gruposServicios.map(({ rama: r, titulo: tituloGrupo, tagline, servicios }) => (
              <div className="grupo-servicios" key={r} data-reveal>
                <div className="grupo-cabecera">
                  <h3>{tituloGrupo}</h3>
                  <span className="grupo-tagline">{tagline}</span>
                </div>
                <div className="grid-servicios">
                  {servicios.map(({ icono: Icono, titulo, texto }, indice) => (
                    <article className="tarjeta" key={titulo} style={{ '--delay': `${indice * 80}ms` }}>
                      <Icono className="tarjeta-icono" size={28} aria-hidden="true" />
                      <h4>{titulo}</h4>
                      <p>{texto}</p>
                      {/* Cada botón nombra su servicio: cinco "Agendar este servicio"
                          seguidos son indistinguibles en una lista de lector de pantalla. */}
                      <button
                        className="tarjeta-enlace"
                        type="button"
                        onClick={() => agendarCon(r)}
                      >
                        Agendar {titulo.toLowerCase()} <ArrowRight size={16} aria-hidden="true" />
                      </button>
                    </article>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section id="nosotros">
          {/* Sin foto del equipo no se rellena con el logo: una sección sobre personas
              que muestra un logotipo se contradice sola. El texto corre a ancho de lectura. */}
          <div className={`contenedor${clinica.fotoEquipo ? ' dos-columnas' : ''}`} data-reveal>
            <div className={clinica.fotoEquipo ? undefined : 'bloque-solo'}>
              <span className="etiqueta-seccion">Nosotros</span>
              <h2>Sobre nosotros</h2>
              <p className="subtitulo">{clinica.sobreNosotros}</p>
            </div>
            {clinica.fotoEquipo && (
              <div className="foto-marco">
                <img
                  src={clinica.fotoEquipo}
                  alt={`Equipo de ${clinica.nombre}`}
                  width="800"
                  height="600"
                  loading="lazy"
                />
              </div>
            )}
          </div>
        </section>

        <section id="ubicacion" className="seccion-blanca">
          <div className="contenedor dos-columnas" data-reveal>
            <div>
              <span className="etiqueta-seccion">Ubicación</span>
              <h2>Dónde estamos: Santo Domingo Savio, Medellín</h2>
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
                  {/* El enlace abre un chat, no una llamada: el icono debe decir lo mismo. */}
                  <MessageCircle size={20} aria-hidden="true" />
                  <a href={enlaceWhatsApp(mensajeGenerico)} target="_blank" rel="noopener">
                    WhatsApp {clinica.whatsappVisible}
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

        <section className="seccion-proceso">
          <div className="contenedor">
            <div className="seccion-encabezado" data-reveal>
              <span className="etiqueta-seccion">Agenda fácil</span>
              <h2>De la web al WhatsApp, sin vueltas</h2>
              <p className="subtitulo">
                El formulario arma el mensaje por ti para que la clínica reciba los datos importantes desde el primer contacto.
              </p>
            </div>
            <div className="proceso-grid">
              {pasosAgenda.map(({ icono: Icono, titulo, texto }, indice) => (
                <article className="paso" key={titulo} data-reveal style={{ '--delay': `${indice * 90}ms` }}>
                  <span className="paso-numero">{indice + 1}</span>
                  <Icono size={26} aria-hidden="true" />
                  <h3>{titulo}</h3>
                  <p>{texto}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="agendar">
          <div className="contenedor" data-reveal>
            <div className="seccion-encabezado">
              <span className="etiqueta-seccion">Citas</span>
              <h2>Agenda tu cita veterinaria</h2>
              <p className="subtitulo">
                Cuéntanos qué necesita tu mascota. Al enviar se abre WhatsApp con tu solicitud ya
                redactada, así atendemos más rápido y sin confusiones.
              </p>
            </div>
            <AppointmentForm rama={rama} setRama={setRama} />
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="contenedor">
          <div className="footer-cta">
            <div>
              <span className="footer-etiqueta">AlmaVet</span>
              <h2>¿Tu mascota necesita atención?</h2>
              <p>Escríbenos y te ayudamos a elegir entre consulta, vacunación, baño o corte.</p>
            </div>
            <a className="boton boton-footer" href={enlaceWhatsApp(mensajeGenerico)} target="_blank" rel="noopener">
              <MessageCircle size={18} aria-hidden="true" />
              Hablar por WhatsApp
            </a>
          </div>

          <div className="footer-grid">
            <div className="footer-marca">
              <a className="footer-logo" href="#inicio">
                <span className="logo-marca" role="img" aria-label={`Logo de ${clinica.nombre}`} />
                <span>
                  <span className="marca-alma">ALMA</span>
                  <span className="marca-vet">VET</span>
                </span>
              </a>
              <p>Clínica veterinaria y estilista para perros y gatos en Santo Domingo Savio.</p>
              <span className="footer-barrio">
                <MapPin size={16} aria-hidden="true" />
                {clinica.barrio}
              </span>
            </div>

            <nav className="footer-columna" aria-label="Enlaces del sitio">
              <h3>Explora</h3>
              {enlaces.map(([href, texto]) => (
                <a key={href} href={href}>
                  {texto}
                </a>
              ))}
            </nav>

            <div className="footer-columna">
              <h3>Contacto</h3>
              <a href={enlaceWhatsApp(mensajeGenerico)} target="_blank" rel="noopener">
                <MessageCircle size={16} aria-hidden="true" />
                WhatsApp {clinica.whatsappVisible}
              </a>
              {clinica.direccion && (
                <span>
                  <MapPin size={16} aria-hidden="true" />
                  {clinica.direccion}
                  {clinica.ciudad && `, ${clinica.ciudad}`}
                </span>
              )}
              {clinica.horario && (
                <span>
                  <Clock size={16} aria-hidden="true" />
                  {clinica.horario}
                </span>
              )}
            </div>

            <div className="footer-columna">
              <h3>Síguenos</h3>
              <div className="footer-redes">
                {clinica.instagram && (
                  <a href={clinica.instagram} target="_blank" rel="noopener">
                    Instagram
                  </a>
                )}
                {clinica.facebook && (
                  <a href={clinica.facebook} target="_blank" rel="noopener">
                    Facebook
                  </a>
                )}
              </div>
              {!clinica.instagram && !clinica.facebook && <span>Próximamente en redes sociales.</span>}
            </div>
          </div>

          <p className="footer-legal">
            © {new Date().getFullYear()} {clinica.nombre}. Todos los derechos reservados. ·{' '}
            <a href="/legal.html#terminos">Términos y condiciones</a> ·{' '}
            <a href="/legal.html#privacidad">Política de datos</a>
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
