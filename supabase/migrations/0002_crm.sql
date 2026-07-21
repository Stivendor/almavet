-- Fase 2: CRM (ficha de paciente + historia clínica).
-- NO APLICAR todavía: se aplica cuando arranque la construcción del CRM.
-- Está aquí para que la fase 1 no tome decisiones que después haya que deshacer.

-- ---------------------------------------------------------------- staff
-- Quién puede ver datos de pacientes. Una fila por empleado con cuenta.
create table public.staff (
  user_id    uuid primary key references auth.users on delete cascade,
  nombre     text not null,
  rol        text not null default 'asistente' check (rol in ('admin', 'veterinario', 'estilista', 'asistente')),
  activo     boolean not null default true,
  creado_en  timestamptz not null default now()
);

-- Predicado reusado por todas las policies de abajo.
create or replace function public.es_staff()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1 from public.staff s
    where s.user_id = (select auth.uid()) and s.activo
  );
$$;

-- ---------------------------------------------------------------- dueños
create table public.duenos (
  id            uuid primary key default gen_random_uuid(),
  -- Llave natural: el mismo formato E.164 que guarda `solicitudes`.
  telefono      text not null unique check (telefono ~ '^\+57[0-9]{10}$'),
  nombre        text not null check (length(btrim(nombre)) between 2 and 80),
  email         text,
  direccion     text,
  notas         text,
  creado_en     timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- ---------------------------------------------------------------- mascotas
create table public.mascotas (
  id               uuid primary key default gen_random_uuid(),
  dueno_id         uuid not null references public.duenos on delete cascade,
  nombre           text not null check (length(btrim(nombre)) between 1 and 60),
  especie          text not null check (especie in ('perro', 'gato')),
  raza             text,
  sexo             text check (sexo in ('macho', 'hembra')),
  esterilizado     boolean,
  fecha_nacimiento date,
  tamano           text check (tamano in ('pequeño', 'mediano', 'grande')),
  alergias         text,
  notas            text,
  activo           boolean not null default true,
  creado_en        timestamptz not null default now(),
  actualizado_en   timestamptz not null default now()
);

create index mascotas_dueno_idx on public.mascotas (dueno_id);

-- ---------------------------------------------------------------- citas
create table public.citas (
  id            uuid primary key default gen_random_uuid(),
  mascota_id    uuid not null references public.mascotas on delete cascade,
  -- De dónde salió la cita. Null si la agendaron por teléfono o en el mostrador.
  solicitud_id  uuid references public.solicitudes on delete set null,
  rama          public.rama_servicio not null,
  fecha_hora    timestamptz not null,
  duracion_min  int not null default 30 check (duracion_min > 0),
  estado        text not null default 'agendada' check (
    estado in ('agendada', 'confirmada', 'atendida', 'no_asistio', 'cancelada')
  ),
  motivo        text,
  notas         text,
  creada_en     timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index citas_agenda_idx on public.citas (fecha_hora);
create index citas_mascota_idx on public.citas (mascota_id);

-- ---------------------------------------------------------------- visitas (historia clínica)
create table public.visitas (
  id             uuid primary key default gen_random_uuid(),
  mascota_id     uuid not null references public.mascotas on delete cascade,
  cita_id        uuid references public.citas on delete set null,
  fecha          date not null default current_date,
  tipo           text not null default 'consulta' check (
    tipo in ('consulta', 'vacunación', 'cirugía', 'urgencia', 'control', 'estética')
  ),
  peso_kg        numeric(5, 2) check (peso_kg > 0),
  temperatura_c  numeric(4, 1) check (temperatura_c between 30 and 45),
  anamnesis      text,
  examen_fisico  text,
  diagnostico    text,
  tratamiento    text,
  observaciones  text,
  veterinario    text,
  creada_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- El historial siempre se lee por mascota y en orden cronológico inverso.
create index visitas_historial_idx on public.visitas (mascota_id, fecha desc);

-- ---------------------------------------------------------------- vacunas
create table public.vacunas (
  id                uuid primary key default gen_random_uuid(),
  mascota_id        uuid not null references public.mascotas on delete cascade,
  visita_id         uuid references public.visitas on delete set null,
  vacuna            text not null,
  fecha_aplicacion  date not null default current_date,
  proxima_dosis     date,
  lote              text,
  veterinario       text,
  creada_en         timestamptz not null default now()
);

create index vacunas_mascota_idx on public.vacunas (mascota_id, fecha_aplicacion desc);
-- Para el recordatorio de refuerzos pendientes.
create index vacunas_proxima_idx on public.vacunas (proxima_dosis) where proxima_dosis is not null;

-- ---------------------------------------------------------------- enlazar solicitudes
alter table public.solicitudes
  add column dueno_id   uuid references public.duenos on delete set null,
  add column mascota_id uuid references public.mascotas on delete set null;

-- ---------------------------------------------------------------- actualizado_en
create or replace function public.tocar_actualizado_en()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

create trigger duenos_actualizado   before update on public.duenos   for each row execute function public.tocar_actualizado_en();
create trigger mascotas_actualizado before update on public.mascotas for each row execute function public.tocar_actualizado_en();
create trigger citas_actualizado    before update on public.citas    for each row execute function public.tocar_actualizado_en();
create trigger visitas_actualizado  before update on public.visitas  for each row execute function public.tocar_actualizado_en();

-- ---------------------------------------------------------------- RLS
-- Ninguna de estas tablas se expone a anon: son datos clínicos de clientes.
alter table public.staff    enable row level security;
alter table public.duenos   enable row level security;
alter table public.mascotas enable row level security;
alter table public.citas    enable row level security;
alter table public.visitas  enable row level security;
alter table public.vacunas  enable row level security;

revoke all on table public.staff, public.duenos, public.mascotas,
  public.citas, public.visitas, public.vacunas from anon, authenticated;

grant select on table public.staff to authenticated;
grant select, insert, update, delete on table
  public.duenos, public.mascotas, public.citas, public.visitas, public.vacunas
  to authenticated;

-- Cada empleado lee su propia fila de staff (evita recursión con es_staff()).
create policy "staff lee su ficha" on public.staff
  for select to authenticated using (user_id = (select auth.uid()));

-- `to authenticated` a secas sería autenticación sin autorización: el predicado
-- es_staff() es lo que realmente restringe.
do $$
declare t text;
begin
  foreach t in array array['duenos', 'mascotas', 'citas', 'visitas', 'vacunas'] loop
    execute format(
      'create policy "staff gestiona %1$s" on public.%1$I
         for all to authenticated
         using (public.es_staff()) with check (public.es_staff())', t
    );
  end loop;
end $$;

-- El equipo también trabaja la bandeja de solicitudes desde el CRM.
grant select, update on table public.solicitudes to authenticated;

create policy "staff lee solicitudes" on public.solicitudes
  for select to authenticated using (public.es_staff());

create policy "staff actualiza solicitudes" on public.solicitudes
  for update to authenticated using (public.es_staff()) with check (public.es_staff());
