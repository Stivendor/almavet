-- Fase 2 (continuación): dinero y vistas del panel.
-- Responde a las dos preguntas que el cuaderno no responde: "¿cuánto entró hoy?"
-- y "¿a quién le toca refuerzo?".

-- ---------------------------------------------------------------- procedimientos
-- Lista de precios. Se edita desde el panel; no se toca el código para subir una tarifa.
create table public.procedimientos (
  id          uuid primary key default gen_random_uuid(),
  nombre      text not null unique check (length(btrim(nombre)) between 2 and 80),
  categoria   text not null check (categoria in ('clinica', 'estetica')),
  -- Pesos colombianos enteros. El COP no tiene centavos: `numeric` solo abriría
  -- la puerta a redondeos que en esta moneda no existen.
  precio_cop  int not null default 0 check (precio_cop >= 0),
  duracion_min int check (duracion_min > 0),
  activo      boolean not null default true,
  creado_en   timestamptz not null default now()
);

-- ---------------------------------------------------------------- cobros
create table public.cobros (
  id          uuid primary key default gen_random_uuid(),
  -- ponytail: cascada desde la mascota. Borrar un dueño por habeas data borra
  -- también su historial de cobros. Si algún día hace falta conservar la caja
  -- histórica, esto pasa a `set null` con un snapshot del nombre en el cobro.
  mascota_id  uuid not null references public.mascotas on delete cascade,
  visita_id   uuid references public.visitas on delete set null,
  cita_id     uuid references public.citas on delete set null,
  fecha       date not null default current_date,
  metodo      text not null default 'efectivo' check (
    metodo in ('efectivo', 'transferencia', 'tarjeta', 'otro')
  ),
  estado      text not null default 'pagado' check (
    estado in ('pendiente', 'pagado', 'anulado')
  ),
  notas       text,
  creado_por  uuid references auth.users default auth.uid(),
  creado_en   timestamptz not null default now()
);

create index cobros_caja_idx on public.cobros (fecha desc);
create index cobros_mascota_idx on public.cobros (mascota_id, fecha desc);

create table public.cobro_items (
  id               uuid primary key default gen_random_uuid(),
  cobro_id         uuid not null references public.cobros on delete cascade,
  -- Null si fue un cargo suelto que no está en la lista de precios.
  procedimiento_id uuid references public.procedimientos on delete set null,
  descripcion      text not null check (length(btrim(descripcion)) between 2 and 120),
  cantidad         int not null default 1 check (cantidad > 0),
  precio_unit_cop  int not null check (precio_unit_cop >= 0),
  -- Generada: el subtotal no puede quedar desalineado del detalle que lo produce.
  subtotal_cop     int generated always as (cantidad * precio_unit_cop) stored
);

create index cobro_items_cobro_idx on public.cobro_items (cobro_id);

-- ---------------------------------------------------------------- vistas
-- El total del cobro tampoco se guarda: sumarlo aquí evita el clásico total que
-- deja de cuadrar con sus items en cuanto alguien edita uno.
create view public.v_cobros
with (security_invoker = true) as
  select c.*,
         coalesce(sum(i.subtotal_cop), 0)::int as total_cop,
         count(i.id) as items
    from public.cobros c
    left join public.cobro_items i on i.cobro_id = c.id
   group by c.id;

create view public.v_caja_dia
with (security_invoker = true) as
  select fecha, metodo, count(*) as cobros, sum(total_cop)::int as total_cop
    from public.v_cobros
   where estado = 'pagado'
   group by fecha, metodo;

-- Refuerzos vencidos o por vencer en 30 días. El `not exists` es lo que hace que
-- el recordatorio desaparezca al aplicar la dosis siguiente en vez de repetirse
-- para siempre.
create view public.v_recordatorios
with (security_invoker = true) as
  select p.id,
         p.mascota_id,
         p.tipo,
         p.producto,
         p.proxima_dosis,
         (p.proxima_dosis - current_date) as dias_restantes,
         m.nombre   as mascota,
         m.especie,
         d.id       as dueno_id,
         d.nombre   as dueno,
         d.telefono
    from public.preventivos p
    join public.mascotas m on m.id = p.mascota_id
    join public.duenos   d on d.id = m.dueno_id
   where p.proxima_dosis is not null
     and p.proxima_dosis <= current_date + 30
     and m.activo
     and not exists (
       select 1 from public.preventivos siguiente
        where siguiente.mascota_id = p.mascota_id
          and siguiente.tipo = p.tipo
          and lower(siguiente.producto) = lower(p.producto)
          and siguiente.fecha_aplicacion > p.fecha_aplicacion
     );

-- ---------------------------------------------------------------- RLS
alter table public.procedimientos enable row level security;
alter table public.cobros         enable row level security;
alter table public.cobro_items    enable row level security;

revoke all on table public.procedimientos, public.cobros, public.cobro_items
  from anon, authenticated;
revoke all on table public.v_cobros, public.v_caja_dia, public.v_recordatorios
  from anon, authenticated;

grant select, insert, update, delete on table
  public.procedimientos, public.cobros, public.cobro_items to authenticated;
grant select on table public.v_cobros, public.v_caja_dia, public.v_recordatorios
  to authenticated;

-- La lista de precios la lee todo el equipo, pero solo la cambia un admin. Esto
-- va en la policy y no solo en la interfaz: esconder el botón no es autorización.
create or replace function public.es_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select exists (
    select 1 from public.staff s
    where s.user_id = (select auth.uid()) and s.activo and s.rol = 'admin'
  );
$$;

create policy "staff lee precios" on public.procedimientos
  for select to authenticated using (public.es_staff());

create policy "admin cambia precios" on public.procedimientos
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- Mismo patrón que 0002: `to authenticated` autentica, es_staff() autoriza.
do $$
declare t text;
begin
  foreach t in array array['cobros', 'cobro_items'] loop
    execute format(
      'create policy "staff gestiona %1$s" on public.%1$I
         for all to authenticated
         using (public.es_staff()) with check (public.es_staff())', t
    );
  end loop;
end $$;

-- ---------------------------------------------------------------- crear cobro
-- El encabezado y sus líneas entran en la misma transacción. Encadenados desde
-- el navegador, un fallo al insertar los items deja un cobro de cero pesos que
-- descuadra la caja del día y que nadie sabe que existe.
create or replace function public.crear_cobro(p_cobro jsonb, p_items jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_cobro uuid;
begin
  if p_items is null or jsonb_array_length(p_items) = 0 then
    raise exception 'Un cobro necesita al menos un ítem';
  end if;

  insert into public.cobros (mascota_id, visita_id, cita_id, fecha, metodo, estado, notas)
  select (p_cobro ->> 'mascota_id')::uuid,
         nullif(p_cobro ->> 'visita_id', '')::uuid,
         nullif(p_cobro ->> 'cita_id', '')::uuid,
         coalesce((p_cobro ->> 'fecha')::date, current_date),
         coalesce(p_cobro ->> 'metodo', 'efectivo'),
         coalesce(p_cobro ->> 'estado', 'pagado'),
         nullif(p_cobro ->> 'notas', '')
  returning id into v_cobro;

  insert into public.cobro_items (cobro_id, procedimiento_id, descripcion, cantidad, precio_unit_cop)
  select v_cobro,
         nullif(i ->> 'procedimiento_id', '')::uuid,
         i ->> 'descripcion',
         coalesce((i ->> 'cantidad')::int, 1),
         (i ->> 'precio_unit_cop')::int
    from jsonb_array_elements(p_items) i;

  return v_cobro;
end;
$$;

grant execute on function public.crear_cobro(jsonb, jsonb) to authenticated;

-- ---------------------------------------------------------------- semilla
-- Los mismos servicios que anuncia la landing, en 0 pesos: el precio real lo
-- pone el equipo desde el panel, no una migración.
insert into public.procedimientos (nombre, categoria, duracion_min) values
  ('Baño',                'estetica', 60),
  ('Baño + corte',        'estetica', 90),
  ('Consulta general',    'clinica',  30),
  ('Vacunación',          'clinica',  20),
  ('Desparasitación',     'clinica',  15),
  ('Urgencia',            'clinica',  45),
  ('Cirugía',             'clinica', 120);
