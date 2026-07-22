// node src/admin/formato.test.mjs
import assert from 'node:assert/strict'
import { agruparPorHora, edad, fechaLarga, lunes, rango, totalCobro } from './formato.js'

// Fechas sin hora: el bug clásico es pasarlas por new Date() y ver el día anterior.
assert.equal(fechaLarga('2026-03-04'), '4 de marzo de 2026')
assert.equal(fechaLarga('2026-12-31'), '31 de diciembre de 2026')
assert.equal(fechaLarga(''), '')

// Edad: siempre contra una fecha fija, si no el test caduca mañana.
assert.equal(edad('2020-05-17', '2026-01-17'), '5 años 8 meses')
assert.equal(edad('2026-01-01', '2026-06-15'), '5 meses')
assert.equal(edad('2026-01-01', '2027-01-01'), '1 año')
assert.equal(edad('2026-06-01', '2026-06-20'), 'menos de 1 mes')
// El día del mes cuenta: el 30 de junio todavía no cumplió el mes.
assert.equal(edad('2026-06-15', '2026-07-14'), 'menos de 1 mes')
assert.equal(edad('2026-06-15', '2026-07-15'), '1 mes')
assert.equal(edad(null), '')
assert.equal(edad('2027-01-01', '2026-01-01'), '', 'fecha futura no da edad negativa')

// El total del cobro se suma, nunca se guarda.
assert.equal(
  totalCobro({
    cobro_items: [
      { cantidad: 2, precio_unit_cop: 25000 },
      { cantidad: 1, precio_unit_cop: 8000 },
    ],
  }),
  58000,
)
assert.equal(totalCobro({ cobro_items: [] }), 0)
assert.equal(totalCobro(null), 0)

// Agrupar por hora: mismo horario junto y en orden ascendente, aunque lleguen al revés.
const citas = [
  { id: 'c', fecha_hora: '2026-03-04T15:00:00Z' },
  { id: 'a', fecha_hora: '2026-03-04T14:00:00Z' },
  { id: 'b', fecha_hora: '2026-03-04T14:00:00Z' },
]
const grupos = agruparPorHora(citas)
assert.equal(grupos.length, 2)
assert.deepEqual(
  grupos[0][1].map((c) => c.id),
  ['a', 'b'],
)
assert.deepEqual(
  grupos[1][1].map((c) => c.id),
  ['c'],
)
assert.deepEqual(citas.map((c) => c.id), ['c', 'a', 'b'], 'no reordena el array que recibe')

// Lunes de la semana. El 4 de marzo de 2026 es miércoles.
assert.equal(lunes('2026-03-04'), '2026-03-02')
assert.equal(lunes('2026-03-02'), '2026-03-02', 'un lunes es su propio lunes')
assert.equal(lunes('2026-03-08'), '2026-03-02', 'el domingo cierra la semana, no la abre')

// El rango cubre exactamente los días pedidos, sin importar la zona horaria.
const [desde, hasta] = rango('2026-03-04', 7)
assert.equal((new Date(hasta) - new Date(desde)) / 86400000, 7)

console.log('formato: ok')
