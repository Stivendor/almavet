// Datos del negocio. Al clonar el sitio para otro cliente, solo se edita este archivo
// (y las variables de color en index.css).
export const clinica = {
  nombre: 'Centro Veterinario AlmaVet',
  whatsapp: '573204387439',
  whatsappVisible: '+57 320 438 7439',

  direccion: 'Cra. 33 #107a-47, Santo Domingo Savio I',
  ciudad: 'Medellín, Antioquia',
  horario: 'Lun a Vie 10:00 am - 7:00 pm · Sáb 10:00 am - 8:00 pm · Dom 10:00 am - 4:00 pm',
  // Versiones cortas para el hero: el horario completo ahí satura la línea de confianza.
  horarioResumen: 'Abierto todos los días desde las 10:00 am',
  barrio: 'Santo Domingo Savio, Medellín',
  instagram: 'https://www.instagram.com/cvalmavet',
  facebook: 'https://www.facebook.com/cvalmavet',

  // Fotos reales (poner los .webp en /public y dejar aquí la ruta).
  // Si quedan vacías se usa el logo, nunca una foto de stock.
  fotoHero: '/sede.jpg', // fachada real de la sede
  fotoEquipo: '', // ej. '/equipo.webp'

  sobreNosotros:
    'Somos un equipo de médicos veterinarios y estilistas apasionados por los animales. ' +
    'Atendemos cada mascota como si fuera nuestra: con calma, con tiempo y sin apuros. ' +
    'Estamos empezando esta nueva etapa, pero llevamos años cuidando a las mascotas del barrio.',
}

export const consultaMapa = encodeURIComponent(`${clinica.direccion}, ${clinica.ciudad}`)
