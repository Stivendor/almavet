# AlmaVET

Dos aplicaciones en un repo, un solo build de Vite:

| Entrada | Ruta | Qué es |
|---|---|---|
| `index.html` | `/` | Landing pública. Captura solicitudes de cita y abre WhatsApp. |
| `admin.html` | `/admin` | CRM del equipo: solicitudes, fichas, historia clínica, agenda, cobros. |

La landing **no carga nada del panel** (ni `supabase-js`): escribe en el Data API con un
`fetch` de 0 kB desde `src/supabase.js`. El panel es el único que necesita sesión.

## Desarrollo

```bash
npm install
cp .env.example .env.local   # y rellenar las dos variables
npm run dev                  # landing en /, panel en /admin.html
npm test                     # funciones puras (node --test)
npm run lint
npm run build
```

## Base de datos

Migraciones en `supabase/migrations/`, en orden:

| Archivo | Contenido |
|---|---|
| `0001_solicitudes.sql` | Tabla `solicitudes` que llena el formulario web |
| `0002_crm.sql` | `staff`, `duenos`, `mascotas`, `citas`, `visitas`, `preventivos`, RLS y la RPC `convertir_solicitud` |
| `0003_autorizacion_datos.sql` | Prueba de autorización (Ley 1581/2012) |
| `0004_cobros.sql` | `procedimientos`, `cobros`, `cobro_items`, vistas de caja y recordatorios, RPC `crear_cobro` |

Aplicarlas con `supabase db push` (o pegando cada archivo en el SQL Editor, en orden).

### Dar acceso a alguien del equipo

1. Dashboard > Authentication > Users > **Add user** (correo y contraseña).
2. Ejecutar `supabase/seed_staff.sql` con el UUID de ese usuario.

Sin fila en `staff` la cuenta entra al panel pero no ve ni un dato: quien autoriza es
`public.es_staff()` dentro de las policies, no el login. El rol `admin` es además el único
que puede cambiar la lista de precios.

## Seguridad

La llave publishable viaja en los dos bundles: es pública por diseño. Lo que protege las
historias clínicas es RLS. Ninguna tabla del CRM tiene policy para `anon`, y `0002` les
hace `revoke all ... from anon` de forma explícita.

## Estructura

```
src/
  App.jsx, AppointmentForm.jsx, supabase.js   landing
  whatsapp.js, config.js, tokens.css          compartido por las dos apps
  admin/
    cliente.js   createClient de supabase-js (solo aquí)
    db.js        todas las consultas del panel
    router.js    enrutado por hash
    formato.js   dinero, fechas, edad, agrupaciones
    vistas/      una pantalla por archivo
```

Para clonar el sitio a otro negocio se editan `src/config.js` (datos) y `src/tokens.css`
(paleta).
