-- Datos de demostración para ver el panel con contenido.
-- NO es parte del esquema: no lleva número de migración a propósito.
--
-- Todo cuelga de seis dueños con UUID fijo '11111111-...-00000000000N', así que
-- el script es idempotente (se puede correr dos veces) y se borra entero con:
--
--   delete from public.duenos    where id::text like '11111111-1111-1111-1111-%';
--   delete from public.solicitudes where id::text like '11111111-2222-%';
--
-- El borrado del dueño arrastra mascotas, citas, visitas, preventivos y cobros.
--
-- Las fechas son relativas a current_date: la agenda y la caja siempre salen
-- con datos de hoy, se corra el día que se corra.

begin;

delete from public.duenos      where id::text like '11111111-1111-1111-1111-%';
delete from public.solicitudes where id::text like '11111111-2222-%';

-- ------------------------------------------------------------------ precios
-- Los 7 procedimientos se sembraron en $0. Estos son valores de ejemplo para que
-- la caja diga algo; el equipo los ajusta desde /precios.
update public.procedimientos set precio_cop = v.precio
  from (values
    ('Baño', 45000), ('Baño + corte', 70000), ('Consulta general', 60000),
    ('Vacunación', 45000), ('Desparasitación', 25000), ('Urgencia', 90000),
    ('Cirugía', 350000)
  ) as v(nombre, precio)
 where public.procedimientos.nombre = v.nombre
   and public.procedimientos.precio_cop = 0;

-- ------------------------------------------------------------------ dueños
insert into public.duenos (id, telefono, nombre, email, direccion, autoriza_datos, autorizado_en, notas) values
  ('11111111-1111-1111-1111-000000000001', '+573001234501', 'Marcela Restrepo', 'marce.restrepo@gmail.com', 'Cra. 32 #106-20', true, now() - interval '120 days', null),
  ('11111111-1111-1111-1111-000000000002', '+573001234502', 'Julián Córdoba', null, 'Calle 107 #33-14', true, now() - interval '90 days', 'Prefiere que lo llamen por la tarde.'),
  ('11111111-1111-1111-1111-000000000003', '+573001234503', 'Yeimy Vargas', 'yeimy.vargas@hotmail.com', null, true, now() - interval '60 days', null),
  ('11111111-1111-1111-1111-000000000004', '+573001234504', 'Andrés Muñoz', null, 'Cra. 34 #105-58', true, now() - interval '45 days', null),
  -- Sin autorización: el panel lo marca en rojo hasta que la den.
  ('11111111-1111-1111-1111-000000000005', '+573001234505', 'Luz Dary Ospina', null, null, false, null, 'Llegó de mostrador, falta firmar autorización de datos.'),
  ('11111111-1111-1111-1111-000000000006', '+573001234506', 'Kevin Zapata', 'kzapata@gmail.com', 'Calle 109 #32-07', true, now() - interval '15 days', null);

-- ------------------------------------------------------------------ mascotas
insert into public.mascotas (id, dueno_id, nombre, especie, raza, sexo, esterilizado, fecha_nacimiento, tamano, alergias, notas) values
  ('11111111-1111-1111-2222-000000000001', '11111111-1111-1111-1111-000000000001', 'Luna',    'perro', 'Criollo',            'hembra', true,  current_date - interval '4 years',   'mediano', null, null),
  ('11111111-1111-1111-2222-000000000002', '11111111-1111-1111-1111-000000000001', 'Simón',   'gato',  'Mestizo',            'macho',  true,  current_date - interval '2 years',   'pequeño', null, 'Se estresa en la sala de espera, atender de una.'),
  ('11111111-1111-1111-2222-000000000003', '11111111-1111-1111-1111-000000000002', 'Rocky',   'perro', 'Pitbull',            'macho',  false, current_date - interval '6 years',   'grande',  'Penicilina', 'Bozal para el baño.'),
  ('11111111-1111-1111-2222-000000000004', '11111111-1111-1111-1111-000000000003', 'Nube',    'gato',  'Siamés',             'hembra', true,  current_date - interval '7 years',   'pequeño', null, null),
  ('11111111-1111-1111-2222-000000000005', '11111111-1111-1111-1111-000000000004', 'Chispa',  'perro', 'Poodle',             'hembra', true,  current_date - interval '9 years',   'pequeño', 'Pollo',      'Cardiópata, control cada 3 meses.'),
  ('11111111-1111-1111-2222-000000000006', '11111111-1111-1111-1111-000000000004', 'Tomás',   'perro', 'Golden Retriever',   'macho',  false, current_date - interval '8 months',  'grande',  null, 'Cachorro, esquema de vacunas en curso.'),
  ('11111111-1111-1111-2222-000000000007', '11111111-1111-1111-1111-000000000005', 'Michi',   'gato',  'Criollo',            'macho',  false, current_date - interval '1 year',    'pequeño', null, null),
  ('11111111-1111-1111-2222-000000000008', '11111111-1111-1111-1111-000000000006', 'Canela',  'perro', 'Schnauzer',          'hembra', true,  current_date - interval '3 years',   'pequeño', null, null);

-- ------------------------------------------------------------------ citas
-- Hoy: cuatro, para que la agenda y el tablero tengan contenido.
insert into public.citas (id, mascota_id, rama, fecha_hora, duracion_min, estado, motivo) values
  ('11111111-1111-1111-3333-000000000001', '11111111-1111-1111-2222-000000000008', 'estilista', (current_date + time '09:00') at time zone 'America/Bogota', 90, 'atendida',   'baño + corte'),
  ('11111111-1111-1111-3333-000000000002', '11111111-1111-1111-2222-000000000005', 'clinica',   (current_date + time '10:00') at time zone 'America/Bogota', 30, 'atendida',   'control cardíaco'),
  ('11111111-1111-1111-3333-000000000003', '11111111-1111-1111-2222-000000000006', 'clinica',   (current_date + time '11:00') at time zone 'America/Bogota', 20, 'confirmada', 'vacunación'),
  ('11111111-1111-1111-3333-000000000004', '11111111-1111-1111-2222-000000000001', 'estilista', (current_date + time '15:00') at time zone 'America/Bogota', 60, 'agendada',   'baño'),
  -- Resto de la semana
  ('11111111-1111-1111-3333-000000000005', '11111111-1111-1111-2222-000000000003', 'estilista', (current_date + 1 + time '09:30') at time zone 'America/Bogota', 90, 'agendada',   'baño'),
  ('11111111-1111-1111-3333-000000000006', '11111111-1111-1111-2222-000000000004', 'clinica',   (current_date + 2 + time '14:00') at time zone 'America/Bogota', 30, 'agendada',   'chequeo general'),
  ('11111111-1111-1111-3333-000000000007', '11111111-1111-1111-2222-000000000002', 'clinica',   (current_date + 3 + time '16:00') at time zone 'America/Bogota', 30, 'agendada',   'enfermedad o síntomas'),
  -- Pasadas, para que la ficha tenga historial de citas
  ('11111111-1111-1111-3333-000000000008', '11111111-1111-1111-2222-000000000001', 'clinica',   (current_date - 40 + time '10:00') at time zone 'America/Bogota', 30, 'atendida',   'chequeo general'),
  ('11111111-1111-1111-3333-000000000009', '11111111-1111-1111-2222-000000000005', 'clinica',   (current_date - 95 + time '11:00') at time zone 'America/Bogota', 30, 'atendida',   'control cardíaco'),
  ('11111111-1111-1111-3333-000000000010', '11111111-1111-1111-2222-000000000007', 'clinica',   (current_date - 10 + time '17:00') at time zone 'America/Bogota', 30, 'no_asistio', 'vacunación');

-- ------------------------------------------------------------------ visitas
insert into public.visitas (id, mascota_id, cita_id, fecha, tipo, peso_kg, temperatura_c, anamnesis, examen_fisico, diagnostico, tratamiento, veterinario) values
  ('11111111-1111-1111-4444-000000000001', '11111111-1111-1111-2222-000000000001', '11111111-1111-1111-3333-000000000008', current_date - 40, 'consulta', 14.20, 38.5,
   'Chequeo anual. La dueña no reporta molestias.', 'Mucosas rosadas, hidratación normal, auscultación sin hallazgos.', 'Paciente sano', 'Refuerzo de vacunas al día. Control en un año.', 'Dra. Ana Ruiz'),
  ('11111111-1111-1111-4444-000000000002', '11111111-1111-1111-2222-000000000001', null, current_date - 200, 'consulta', 13.60, 38.2,
   'Rascado frecuente en el lomo.', 'Eritema leve en zona lumbar, sin pulgas visibles.', 'Dermatitis leve', 'Baño medicado semanal por 3 semanas.', 'Dra. Ana Ruiz'),
  ('11111111-1111-1111-4444-000000000003', '11111111-1111-1111-2222-000000000005', '11111111-1111-1111-3333-000000000002', current_date, 'control', 6.80, 38.4,
   'Control trimestral por soplo cardíaco grado II.', 'Soplo estable, sin tos ni intolerancia al ejercicio.', 'Cardiopatía estable', 'Continúa con la misma dosis. Control en 3 meses.', 'Dr. Camilo Herrera'),
  ('11111111-1111-1111-4444-000000000004', '11111111-1111-1111-2222-000000000005', '11111111-1111-1111-3333-000000000009', current_date - 95, 'control', 7.10, 38.6,
   'Control trimestral.', 'Soplo grado II sin cambios.', 'Cardiopatía estable', 'Se mantiene tratamiento.', 'Dr. Camilo Herrera'),
  -- Cachorro: el peso sube visita a visita, que es lo que muestra la pestaña Peso.
  ('11111111-1111-1111-4444-000000000005', '11111111-1111-1111-2222-000000000006', null, current_date - 120, 'vacunación', 8.40, 38.7, 'Primera dosis del esquema.', 'Cachorro activo, sin hallazgos.', null, 'Vacuna múltiple, primera dosis.', 'Dra. Ana Ruiz'),
  ('11111111-1111-1111-4444-000000000006', '11111111-1111-1111-2222-000000000006', null, current_date - 90,  'vacunación', 12.10, 38.5, 'Segunda dosis.', 'Sin hallazgos.', null, 'Vacuna múltiple, segunda dosis.', 'Dra. Ana Ruiz'),
  ('11111111-1111-1111-4444-000000000007', '11111111-1111-1111-2222-000000000006', null, current_date - 60,  'vacunación', 17.50, 38.6, 'Tercera dosis y rabia.', 'Sin hallazgos.', null, 'Vacuna múltiple + rabia.', 'Dra. Ana Ruiz'),
  ('11111111-1111-1111-4444-000000000008', '11111111-1111-1111-2222-000000000003', null, current_date - 25, 'urgencia', 32.40, 39.4,
   'Cojera aguda de miembro posterior derecho tras salir al parque.', 'Dolor a la palpación de rodilla, sin fractura evidente.', 'Esguince', 'Reposo 10 días y antiinflamatorio. NO usar penicilina (alérgico).', 'Dr. Camilo Herrera'),
  ('11111111-1111-1111-4444-000000000009', '11111111-1111-1111-2222-000000000008', '11111111-1111-1111-3333-000000000001', current_date, 'estética', 7.90, null,
   'Baño y corte de raza.', null, null, 'Sin novedad. Se recomienda corte cada 8 semanas.', 'Sara Gil'),
  ('11111111-1111-1111-4444-000000000010', '11111111-1111-1111-2222-000000000004', null, current_date - 150, 'consulta', 4.10, 38.3,
   'Vomita después de comer.', 'Abdomen sin dolor, buena condición corporal.', 'Gastritis leve', 'Dieta blanda 5 días y cambio a alimento gástrico.', 'Dra. Ana Ruiz');

-- ------------------------------------------------------------------ preventivos
insert into public.preventivos (mascota_id, tipo, producto, fecha_aplicacion, proxima_dosis, lote, veterinario) values
  -- Vencidos: salen en Recordatorios.
  ('11111111-1111-1111-2222-000000000004', 'vacuna',          'Triple felina', current_date - 380, current_date - 15, 'TF-2291', 'Dra. Ana Ruiz'),
  ('11111111-1111-1111-2222-000000000003', 'desparasitación', 'Drontal',       current_date - 100, current_date - 8,  null,      'Dra. Ana Ruiz'),
  -- Por vencer dentro de 30 días: también salen.
  ('11111111-1111-1111-2222-000000000001', 'antipulgas',      'Bravecto',      current_date - 78,  current_date + 6,  'BR-8812', 'Sara Gil'),
  ('11111111-1111-1111-2222-000000000008', 'desparasitación', 'Drontal',       current_date - 85,  current_date + 12, null,      'Dra. Ana Ruiz'),
  -- Al día: NO deben salir en Recordatorios.
  ('11111111-1111-1111-2222-000000000001', 'vacuna',          'Rabia',         current_date - 40,  current_date + 325, 'RB-4410', 'Dra. Ana Ruiz'),
  ('11111111-1111-1111-2222-000000000006', 'vacuna',          'Múltiple',      current_date - 60,  current_date + 305, 'MU-7731', 'Dra. Ana Ruiz'),
  ('11111111-1111-1111-2222-000000000006', 'vacuna',          'Rabia',         current_date - 60,  current_date + 305, 'RB-4411', 'Dra. Ana Ruiz'),
  -- Par vencido + refuerzo posterior: prueba que el aviso desaparece al aplicarlo.
  ('11111111-1111-1111-2222-000000000005', 'vacuna',          'Rabia',         current_date - 400, current_date - 35, 'RB-3300', 'Dra. Ana Ruiz'),
  ('11111111-1111-1111-2222-000000000005', 'vacuna',          'Rabia',         current_date - 30,  current_date + 335, 'RB-4409', 'Dra. Ana Ruiz');

-- ------------------------------------------------------------------ cobros
insert into public.cobros (id, mascota_id, visita_id, fecha, metodo, estado, notas) values
  ('11111111-1111-1111-5555-000000000001', '11111111-1111-1111-2222-000000000008', '11111111-1111-1111-4444-000000000009', current_date,      'efectivo',      'pagado', null),
  ('11111111-1111-1111-5555-000000000002', '11111111-1111-1111-2222-000000000005', '11111111-1111-1111-4444-000000000003', current_date,      'transferencia', 'pagado', null),
  ('11111111-1111-1111-5555-000000000003', '11111111-1111-1111-2222-000000000001', null,                                   current_date,      'tarjeta',       'pagado', 'Incluye desparasitación del mes.'),
  ('11111111-1111-1111-5555-000000000004', '11111111-1111-1111-2222-000000000003', '11111111-1111-1111-4444-000000000008', current_date - 25, 'efectivo',      'pagado', null),
  ('11111111-1111-1111-5555-000000000005', '11111111-1111-1111-2222-000000000006', '11111111-1111-1111-4444-000000000007', current_date - 60, 'efectivo',      'pagado', null),
  ('11111111-1111-1111-5555-000000000006', '11111111-1111-1111-2222-000000000004', null,                                   current_date - 3,  'efectivo',      'pendiente', 'Queda debiendo, pasa el viernes.');

insert into public.cobro_items (cobro_id, descripcion, cantidad, precio_unit_cop) values
  ('11111111-1111-1111-5555-000000000001', 'Baño + corte',     1, 70000),
  ('11111111-1111-1111-5555-000000000002', 'Consulta general', 1, 60000),
  ('11111111-1111-1111-5555-000000000003', 'Baño',             1, 45000),
  ('11111111-1111-1111-5555-000000000003', 'Desparasitación',  1, 25000),
  ('11111111-1111-1111-5555-000000000004', 'Urgencia',         1, 90000),
  ('11111111-1111-1111-5555-000000000005', 'Vacunación',       2, 45000),
  ('11111111-1111-1111-5555-000000000006', 'Consulta general', 1, 60000);

-- ------------------------------------------------------------------ solicitudes
-- Bandeja de entrada sin convertir, para poder probar el botón "Agendar".
insert into public.solicitudes
  (id, creada_en, rama, estado, nombre_dueno, telefono, nombre_mascota, tipo_mascota, tamano,
   servicio, fecha_preferida, comentarios, motivo, sintomas, fecha_consulta, franja, urgente, autorizacion_datos)
values
  ('11111111-2222-0000-0000-000000000001', now() - interval '2 hours', 'estilista', 'nueva',
   'Paola Jiménez', '+573001234507', 'Manchas', 'perro', 'mediano',
   'baño + corte', current_date + 2, 'Es la primera vez que la traigo, es un poco nerviosa.',
   null, null, null, null, false, true),
  ('11111111-2222-0000-0000-000000000002', now() - interval '5 hours', 'clinica', 'nueva',
   'Duván Arango', '+573001234508', 'Zeus', null, null,
   null, null, null, 'enfermedad o síntomas', 'Lleva dos días sin comer y está decaído.',
   current_date, 'mañana', true, true),
  ('11111111-2222-0000-0000-000000000003', now() - interval '1 day', 'clinica', 'contactada',
   'Marcela Restrepo', '+573001234501', 'Simón', 'gato', 'pequeño',
   null, null, null, 'chequeo general', null, current_date + 4, 'tarde', false, true);

commit;
