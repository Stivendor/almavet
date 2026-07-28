# AlmaVET

Landing pública del Centro Veterinario AlmaVet. Captura solicitudes de cita y abre
WhatsApp con el mensaje ya escrito.

No hay panel: la operación interna (historia clínica, agenda, cobros) la lleva OkVet.
Este repo es el sitio y nada más.

La landing no carga `supabase-js`: escribe en el Data API con un `fetch` de 0 kB desde
`src/supabase.js`.

## Desarrollo

```bash
npm install
cp .env.example .env.local   # y rellenar las dos variables
npm run dev
npm test                     # funciones puras (node --test)
npm run lint
npm run build
```

Sin las variables de entorno el sitio funciona igual: deja de guardar la solicitud en
la base y solo abre WhatsApp.

## Base de datos

La única tabla que usa el sitio es `solicitudes`. Migraciones en `supabase/migrations/`,
en orden:

| Archivo | Contenido |
|---|---|
| `0001_solicitudes.sql` | Tabla `solicitudes` que llena el formulario web |
| `0002_crm.sql` | Esquema del CRM que ya no se usa desde aquí — se conserva porque sigue aplicado en la base |
| `0003_autorizacion_datos.sql` | Prueba de autorización (Ley 1581/2012) |
| `0004_cobros.sql` | Cobros del CRM retirado, misma razón que `0002` |

Se aplican a mano en el SQL Editor, en orden. `anon` solo puede insertar en
`solicitudes`; el resto de tablas le tiene el acceso revocado explícitamente.

## Estructura

```
index.html                                    entrada única
src/
  App.jsx, AppointmentForm.jsx                la página
  supabase.js                                 el POST a solicitudes
  whatsapp.js, config.js                      mensaje y datos del negocio
  tokens.css, index.css                       paleta y layout
public/
  logo.jpg, sede.jpg, legal.html              material real
```

Para clonar el sitio a otro negocio se editan `src/config.js` (datos) y `src/tokens.css`
(paleta).
