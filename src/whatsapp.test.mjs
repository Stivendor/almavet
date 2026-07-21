// node src/whatsapp.test.mjs
import assert from 'node:assert/strict'
import {
  construirMensaje,
  enlaceWhatsApp,
  formatoFecha,
  normalizarTelefono,
} from './whatsapp.js'

assert.equal(formatoFecha('2026-07-21'), '21/07/2026')

// Teléfono: se acepta como lo escriba la gente, se guarda en E.164.
assert.equal(normalizarTelefono('3204387439'), '+573204387439')
assert.equal(normalizarTelefono('320 438 7439'), '+573204387439')
assert.equal(normalizarTelefono('+57 320 438 7439'), '+573204387439')
assert.equal(normalizarTelefono('(320) 438-7439'), '+573204387439')
assert.equal(normalizarTelefono('6041234567'), null, 'fijo no es celular')
assert.equal(normalizarTelefono('32043874'), null, 'muy corto')
assert.equal(normalizarTelefono('no soy un teléfono'), null)
assert.equal(normalizarTelefono(''), null)
assert.equal(normalizarTelefono(undefined), null)

const estilista = construirMensaje({
  rama: 'estilista',
  nombreDueno: 'Ana',
  nombreMascota: 'Luna',
  telefono: '320 438 7439',
  tipoMascota: 'perro',
  tamano: 'mediano',
  servicio: 'baño + corte',
  fecha: '2026-07-25',
  comentarios: '',
})
assert.equal(
  estilista,
  'Hola, soy Ana. Quiero agendar un servicio de *Estilista* para mi mascota Luna (perro, tamaño mediano).\n' +
    'Servicio: baño + corte\n' +
    'Fecha preferida: 25/07/2026\n' +
    'Teléfono: 320 438 7439'
)
assert.ok(!estilista.includes('Comentarios'), 'campo opcional vacío no debe aparecer')

const clinica = construirMensaje({
  rama: 'clinica',
  nombreDueno: 'Ana',
  nombreMascota: 'Luna',
  telefono: '3204387439',
  motivo: 'urgencia',
  sintomas: 'vomita desde ayer',
  urgente: true,
  fechaConsulta: '2026-07-22',
  franja: '',
})
assert.equal(
  clinica,
  'Hola, soy Ana. Quiero agendar una *consulta clínica* para mi mascota Luna.\n' +
    'Motivo: urgencia\n' +
    'Síntomas: vomita desde ayer\n' +
    '¿Urgente?: sí\n' +
    'Fecha deseada para la consulta: 22/07/2026\n' +
    'Teléfono: 320 438 7439'
)

// Teléfono a medio escribir: no ensucia la vista previa.
const parcial = construirMensaje({
  rama: 'clinica',
  nombreDueno: '[tu nombre]',
  nombreMascota: '[tu mascota]',
  telefono: '320 43',
  motivo: 'chequeo general',
})
assert.ok(!parcial.includes('Teléfono'), 'teléfono inválido no debe aparecer')

// los saltos de línea deben viajar codificados, no crudos
assert.ok(enlaceWhatsApp('a\nb').endsWith('a%0Ab'))

console.log('ok')
