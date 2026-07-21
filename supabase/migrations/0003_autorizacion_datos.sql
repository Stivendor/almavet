-- Ley 1581 de 2012: el responsable debe poder probar que el titular autorizó
-- el tratamiento. La casilla del formulario es la autorización; esta columna
-- (junto con creada_en) es la prueba. Sin ella no se acepta la solicitud.

alter table public.solicitudes
  add column autorizacion_datos boolean not null default false;

-- Las filas anteriores a esta migración se crearon sin casilla: quedan en false
-- a propósito, para no afirmar una autorización que nunca se dio.
alter table public.solicitudes
  add constraint autorizacion_datos_obligatoria
  check (autorizacion_datos) not valid;

comment on column public.solicitudes.autorizacion_datos is
  'Prueba de la autorización de tratamiento de datos (Ley 1581/2012). La fecha de la autorización es creada_en.';
