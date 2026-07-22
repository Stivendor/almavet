-- Alta de un empleado en el CRM. No hay pantalla para esto a propósito: el equipo
-- son 3-6 personas que casi no rotan, y construir invitaciones desde el panel
-- obliga a una Edge Function con service_role.
--
-- 1. Supabase Dashboard > Authentication > Users > Add user (email + contraseña).
-- 2. Copiar el UUID del usuario recién creado.
-- 3. Ejecutar esto en el SQL Editor cambiando el UUID, el nombre y el rol.
--
-- Sin fila en `staff` la cuenta entra al panel pero no ve ni un dato: es
-- `public.es_staff()` quien autoriza, no el login.

insert into public.staff (user_id, nombre, rol)
values ('00000000-0000-0000-0000-000000000000', 'Nombre Apellido', 'admin')
on conflict (user_id) do update
  set nombre = excluded.nombre,
      rol    = excluded.rol,
      activo = true;

-- Dar de baja a alguien (no se borra: sus visitas quedan atribuidas a su cuenta).
-- update public.staff set activo = false where user_id = '...';
