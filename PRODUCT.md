# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

**Dueños de mascotas.** Vecinos de Santo Domingo Savio y alrededores en Medellín. Llegan
por Instagram, Facebook, Google o el voz a voz del barrio, casi siempre desde el celular
y con datos móviles. Su trabajo: conseguir cita para su perro o gato sin llamar ni
esperar. Unos llegan con la mascota enferma o con afán; otros solo quieren baño.

El formulario existe para que no tengan que redactar nada: lo llenan y se abre WhatsApp
con el mensaje ya armado.

El equipo de la clínica **no** es usuario de este producto: su herramienta es OkVet.

## Product Purpose

Una sola página pública que convierte una visita en una solicitud de cita. Escribe en la
tabla `solicitudes` con un `fetch` directo al Data API de Supabase (sin `supabase-js`,
0 kB de cliente) y abre WhatsApp con el mensaje armado.

Éxito: la solicitud entra completa y el WhatsApp se abre. Nada más se le pide al sitio.

## Positioning

**Trato sin apuros: tiempo real por mascota.** Se atiende con calma, con tiempo y sin
línea de montaje. Es la promesa que el negocio ya hace en su propio "sobre nosotros" y la
que el sitio tiene que sostener desde el primer viewport.

## Operating Context

**Todo lo interno vive en OkVet.** Historia clínica, agenda, fichas, cobros y
recordatorios los lleva OkVet, no este repo. Hubo un panel `/admin` en este proyecto y se
retiró en julio de 2026 por duplicar lo que OkVet ya resuelve. Ninguna función nueva debe
volver a meter operación interna aquí.

**Canal de conversación:** WhatsApp, vía links `wa.me` con el texto ya escrito. Sin
WhatsApp Business API, sin backend, sin costo por conversación.

**Nadie lee `solicitudes`, y es a propósito.** El canal real es el WhatsApp que se abre en
el celular del cliente; la fila en la tabla es respaldo, no bandeja de entrada. Lo que se
acepta a cambio: si el cliente llena el formulario y no llega a enviar el mensaje, esa
solicitud no la ve nadie. Decisión tomada en julio de 2026 con el negocio, sabiendo el
costo. Se revisa solo cuando alguien diga "se nos perdió un cliente por ahí"; el arreglo
en ese caso es un aviso por correo al insertar (trigger con `pg_net` + un proveedor de
email), no volver a construir un panel.

**Horario:** Lun a Vie 10:00–19:00 · Sáb 10:00–20:00 · Dom 10:00–16:00. Abierto los siete
días.

**Sede única:** Cra. 33 #107a-47, Santo Domingo Savio I, Medellín, Antioquia.

**Dos ramas de servicio,** y esa división atraviesa la página y el formulario:

- *Estilista* — Baño; Baño + corte (el corte nunca va solo).
- *Clínica* — Consulta general; Vacunación y desparasitación; Urgencias y cirugía.
  Motivos de consulta del formulario: chequeo general, vacunación, enfermedad o síntomas,
  cirugía, urgencia.

Especies atendidas: perros y gatos.

## Capabilities and Constraints

**Lo que hace el sitio:** presenta el negocio y sus servicios, y captura una solicitud de
cita (rama, servicio o motivo, mascota, dueño, teléfono, fecha deseada, urgencia,
autorización de datos) que termina en `solicitudes` y en un chat de WhatsApp abierto.

**Lo que no hace y no debe hacer:** cuentas de usuario, login, agenda visible, pagos,
historia clínica, panel interno de cualquier clase.

**Stack:** React 19 + Vite 8, `lucide-react`, una sola entrada HTML. Supabase solo como
Data API. Despliegue en Vercel, sin `vercel.json`.

**Sin las variables de entorno** el sitio funciona igual: deja de guardar la solicitud y
solo abre WhatsApp. Ese es el comportamiento correcto, no un fallo.

**Base de datos:** la llave publishable es pública por diseño; lo que protege los datos es
RLS. `anon` solo puede insertar en `solicitudes`. Las tablas del CRM retirado siguen
existiendo en la base, sin uso y con el acceso de `anon` revocado.

**Legal:** autorización de tratamiento de datos (Ley 1581/2012 de Colombia) registrada por
solicitud. `public/legal.html` es contenido factual: no se reescribe como copy de
marketing.

**Migraciones:** se aplican a mano en el SQL Editor, no por CLI.

**Portabilidad:** el sitio está hecho para clonarse a otro negocio editando solo
`src/config.js` (datos) y `src/tokens.css` (paleta). Los datos del negocio no se escriben
duros en los componentes.

## Brand Commitments

- Nombre: **Centro Veterinario AlmaVet**. Instagram y Facebook: `@cvalmavet`.
- Logo real en `public/logo.jpg`.
- Paleta derivada del logo en `src/tokens.css`: azul `#1e3a72`, rojo `#d32027`.
- Voz: cercana, de barrio, sin jerga clínica y sin promesas grandilocuentes.
- **Nunca stock:** si falta una foto real se usa el logo, jamás una imagen de banco. Regla
  ya escrita en `src/config.js`.

## Evidence on Hand

- `public/logo.jpg` — logo real.
- `public/sede.jpg` — fachada real de la sede, usada en el hero.
- `public/legal.html` — política de datos.
- `src/config.js` → `sobreNosotros`: texto real del negocio. Dice explícitamente que están
  empezando esta etapa y que llevan años cuidando mascotas del barrio.

**Lo que NO existe y no se puede inventar:** fotos del equipo o del interior (el campo
`fotoEquipo` está vacío a propósito), testimonios, reseñas citables, número de clientes,
años exactos de operación, certificaciones, premios, precios públicos. Ninguna pieza puede
fabricar prueba social.

## Product Principles

1. **El sitio es la puerta, no la clínica.** Si una función pertenece a la operación
   diaria, pertenece a OkVet.
2. **Cero fricción hasta WhatsApp.** Cada campo del formulario se gana su sitio o se cae.
3. **Solo material real.** Sin fotos de stock, sin testimonios inventados, sin cifras que
   nadie pueda respaldar.
4. **Barato de operar.** Sin backend propio mientras un link resuelva.
5. **Que cargue en un celular con datos malos.** El peso es una decisión de producto.

## Accessibility & Inclusion

Público de barrio, en celular, con datos móviles y a veces con la mascota enferma en
brazos. Sin requisito normativo declarado, pero el producto asume: peso bajo, objetivos
táctiles grandes, contraste alto para pantallas al sol, y todo el contenido en español de
Colombia.
