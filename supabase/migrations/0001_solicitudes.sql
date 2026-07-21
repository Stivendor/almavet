-- Fase 1: capturar las solicitudes que hoy solo existen como mensaje de WhatsApp.
-- Tabla autocontenida, sin FKs: el CRM (0002) la enlaza después con dueños y mascotas.

create type public.rama_servicio as enum ('estilista', 'clinica');
create type public.estado_solicitud as enum (
  'nueva',
  'contactada',
  'agendada',
  'atendida',
  'descartada'
);

create table public.solicitudes (
  id             uuid primary key default gen_random_uuid(),
  creada_en      timestamptz not null default now(),
  rama           public.rama_servicio not null,
  estado         public.estado_solicitud not null default 'nueva',

  nombre_dueno   text not null check (length(btrim(nombre_dueno)) between 2 and 80),
  -- E.164. Es la llave con la que 0002 deduplica dueños.
  telefono       text not null check (telefono ~ '^\+57[0-9]{10}$'),
  nombre_mascota text not null check (length(btrim(nombre_mascota)) between 1 and 60),
  tipo_mascota   text check (tipo_mascota in ('perro', 'gato')),
  tamano         text check (tamano in ('pequeño', 'mediano', 'grande')),

  -- rama estilista
  servicio        text check (servicio in ('baño', 'baño + corte', 'otro')),
  fecha_preferida date,
  comentarios     text check (length(comentarios) <= 1000),

  -- rama clínica
  motivo         text check (
    motivo in ('chequeo general', 'vacunación', 'enfermedad o síntomas', 'cirugía', 'urgencia')
  ),
  sintomas       text check (length(sintomas) <= 1000),
  fecha_consulta date,
  franja         text check (franja in ('mañana', 'tarde')),
  urgente        boolean not null default false,

  notas_internas text,

  -- La BD exige lo mismo que valida el formulario: una rama incompleta no entra.
  constraint campos_por_rama check (
    (rama = 'estilista' and servicio is not null and fecha_preferida is not null)
    or
    (rama = 'clinica' and motivo is not null and fecha_consulta is not null)
  )
);

comment on table public.solicitudes is
  'Solicitudes de cita enviadas desde el formulario web. Se guardan aunque el cliente no llegue a enviar el mensaje de WhatsApp.';

-- Bandeja de entrada del equipo: pendientes primero, más recientes arriba.
create index solicitudes_bandeja_idx on public.solicitudes (estado, creada_en desc);
create index solicitudes_telefono_idx on public.solicitudes (telefono);

alter table public.solicitudes enable row level security;

-- Desde 2026-04-28 las tablas nuevas no se exponen solas al Data API:
-- el grant explícito es obligatorio, aparte de RLS.
revoke all on table public.solicitudes from anon, authenticated;
grant insert on table public.solicitudes to anon;

-- Solo insert. Sin policy de select, nadie lee datos de clientes desde el navegador;
-- el equipo los consulta por el dashboard.
create policy "la web puede crear solicitudes"
  on public.solicitudes
  for insert
  to anon
  with check (true);
