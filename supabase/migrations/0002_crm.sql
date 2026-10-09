-- Fase 2: CRM (ficha de paciente + historia clínica).
-- El dinero (procedimientos, cobros) y las vistas del panel van en 0004.

-- Búsqueda por nombre de dueño en el CRM. Sin trigramas, `ilike '%pepe%'` es
-- seq scan; con el índice de abajo no lo es. En `extensions` y no en `public`:
-- el linter de Supabase marca como riesgo toda extensión en el esquema público.
create extension if not exists pg_trgm with schema extensions;

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
  -- Opcional: solo hace falta cuando el cobro necesita identificar al titular.
  documento     text,
  direccion     text,
  notas         text,
  -- Ley 1581/2012. El dueño creado en el mostrador necesita la misma prueba de
  -- autorización que el que llenó el formulario web; `solicitudes.autorizacion_datos`
  -- solo cubre a los segundos.
  autoriza_datos boolean not null default false,
  autorizado_en  timestamptz,
  creado_en     timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create index duenos_nombre_idx on public.duenos using gin (nombre extensions.gin_trgm_ops);

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
-- Lo usa convertir_solicitud() para no crear una segunda "Luna" del mismo dueño.
create index mascotas_nombre_idx on public.mascotas (dueno_id, lower(nombre));

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
  -- La historia clínica tiene que ser atribuible a una persona. `veterinario` es
  -- texto libre (puede decir "Dra. Ana" o quedar vacío); esto es la cuenta real.
  creado_por     uuid references auth.users default auth.uid(),
  actualizado_por uuid references auth.users,
  creada_en      timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

-- El historial siempre se lee por mascota y en orden cronológico inverso.
create index visitas_historial_idx on public.visitas (mascota_id, fecha desc);

-- ---------------------------------------------------------------- preventivos
-- Vacunas, desparasitación y antipulgas comparten esquema y comparten el único
-- motivo por el que existen: la fecha de la próxima dosis. Una tabla, un módulo
-- de recordatorios.
create table public.preventivos (
  id                uuid primary key default gen_random_uuid(),
  mascota_id        uuid not null references public.mascotas on delete cascade,
  visita_id         uuid references public.visitas on delete set null,
  tipo              text not null default 'vacuna' check (
    tipo in ('vacuna', 'desparasitación', 'antipulgas')
  ),
  -- Nombre comercial o del biológico: 'Triple felina', 'Rabia', 'Bravecto'.
  producto          text not null,
  fecha_aplicacion  date not null default current_date,
  proxima_dosis     date,
  lote              text,
  veterinario       text,
  creado_por        uuid references auth.users default auth.uid(),
  creada_en         timestamptz not null default now()
);

create index preventivos_mascota_idx on public.preventivos (mascota_id, fecha_aplicacion desc);
-- Para el recordatorio de refuerzos pendientes.
create index preventivos_proxima_idx on public.preventivos (proxima_dosis) where proxima_dosis is not null;

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

-- La historia clínica además registra QUIÉN la tocó. El cliente no lo manda:
-- así el dato no depende de que la app se acuerde de enviarlo.
create or replace function public.tocar_auditoria()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.actualizado_en = now();
  new.actualizado_por = auth.uid();
  return new;
end;
$$;

create trigger visitas_actualizado before update on public.visitas for each row execute function public.tocar_auditoria();

-- ---------------------------------------------------------------- RLS
-- Ninguna de estas tablas se expone a anon: son datos clínicos de clientes.
alter table public.staff    enable row level security;
alter table public.duenos   enable row level security;
alter table public.mascotas enable row level security;
alter table public.citas    enable row level security;
alter table public.visitas  enable row level security;
alter table public.preventivos enable row level security;

revoke all on table public.staff, public.duenos, public.mascotas,
  public.citas, public.visitas, public.preventivos from anon, authenticated;

grant select on table public.staff to authenticated;
grant select, insert, update, delete on table
  public.duenos, public.mascotas, public.citas, public.visitas, public.preventivos
  to authenticated;

-- Cada empleado lee su propia fila de staff (evita recursión con es_staff()).
create policy "staff lee su ficha" on public.staff
  for select to authenticated using (user_id = (select auth.uid()));

-- `to authenticated` a secas sería autenticación sin autorización: el predicado
-- es_staff() es lo que realmente restringe.
do $$
declare t text;
begin
  foreach t in array array['duenos', 'mascotas', 'citas', 'visitas', 'preventivos'] loop
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

-- ---------------------------------------------------------------- convertir solicitud
-- Flujo central del CRM: una solicitud de la web se vuelve dueño + mascota + cita.
-- Va en la base y no en el navegador porque son cuatro escrituras que tienen que
-- pasar todas o ninguna; encadenadas desde el cliente, un fallo en la tercera deja
-- un dueño huérfano y una solicitud que ya no se puede volver a procesar.
create or replace function public.convertir_solicitud(
  p_solicitud  uuid,
  p_fecha_hora timestamptz default null,
  p_duracion   int default 30,
  -- La rama clínica no pide especie en el formulario público. Cuando falta, la
  -- pone quien convierte; inventar 'perro' por defecto sería ensuciar la ficha.
  p_especie    text default null
)
-- Devuelve los tres ids para que el panel pueda saltar directo a la ficha.
returns jsonb
language plpgsql
security invoker
set search_path = ''
as $$
declare
  s         public.solicitudes;
  v_dueno   uuid;
  v_mascota uuid;
  v_cita    uuid;
  v_cuando  timestamptz;
  v_especie text;
begin
  select * into s from public.solicitudes where id = p_solicitud;
  if not found then
    raise exception 'La solicitud % no existe o no es visible', p_solicitud;
  end if;
  if s.mascota_id is not null then
    raise exception 'La solicitud % ya fue convertida', p_solicitud;
  end if;

  -- Por defecto, el día que pidió el cliente a las 9:00 de Bogotá. Colombia no
  -- tiene horario de verano, así que el offset es fijo.
  v_cuando := coalesce(
    p_fecha_hora,
    (coalesce(s.fecha_preferida, s.fecha_consulta, current_date) + time '09:00')
      at time zone 'America/Bogota'
  );

  insert into public.duenos (telefono, nombre, autoriza_datos, autorizado_en)
  values (
    s.telefono, s.nombre_dueno, s.autorizacion_datos,
    case when s.autorizacion_datos then s.creada_en end
  )
  -- `do nothing` no devolvería la fila existente; el update no-op sí, y además
  -- no pisa un nombre que el equipo ya haya corregido a mano.
  on conflict (telefono) do update set telefono = excluded.telefono
  returning id into v_dueno;

  select id into v_mascota
    from public.mascotas
   where dueno_id = v_dueno and lower(nombre) = lower(btrim(s.nombre_mascota))
   limit 1;

  if v_mascota is null then
    v_especie := coalesce(s.tipo_mascota, p_especie);
    if v_especie is null then
      raise exception 'Falta la especie de %: pásala en p_especie', s.nombre_mascota;
    end if;
    insert into public.mascotas (dueno_id, nombre, especie, tamano)
    values (v_dueno, btrim(s.nombre_mascota), v_especie, s.tamano)
    returning id into v_mascota;
  end if;

  insert into public.citas (mascota_id, solicitud_id, rama, fecha_hora, duracion_min, motivo)
  values (v_mascota, s.id, s.rama, v_cuando, p_duracion, coalesce(s.motivo, s.servicio))
  returning id into v_cita;

  update public.solicitudes
     set dueno_id = v_dueno, mascota_id = v_mascota, estado = 'agendada'
   where id = s.id;

  return jsonb_build_object('cita_id', v_cita, 'mascota_id', v_mascota, 'dueno_id', v_dueno);
end;
$$;

grant execute on function public.convertir_solicitud(uuid, timestamptz, int, text) to authenticated;
