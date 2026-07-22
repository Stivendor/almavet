// node src/admin/router.test.mjs
import assert from 'node:assert/strict'
import { emparejar, resolver, rutaDe } from './router.js'

assert.equal(rutaDe('#/agenda'), '/agenda')
assert.equal(rutaDe(''), '/', 'sin hash, la raíz')
assert.equal(rutaDe('#'), '/')

assert.deepEqual(emparejar('/agenda', '/agenda'), {})
assert.deepEqual(emparejar('/mascotas/:id', '/mascotas/abc-123'), { id: 'abc-123' })
assert.equal(emparejar('/mascotas/:id', '/mascotas'), null, 'falta el parámetro')
assert.equal(emparejar('/mascotas/:id', '/duenos/abc'), null, 'otro recurso')
assert.equal(emparejar('/mascotas/:id', '/mascotas/abc/visitas'), null, 'sobra un segmento')
// Los ids vienen de la URL: si alguna vez llevan caracteres escapados, se decodifican.
assert.deepEqual(emparejar('/duenos/:id', '/duenos/a%20b'), { id: 'a b' })

// '/duenos' y '/duenos/:id' conviven porque tienen distinto número de segmentos.
const rutas = [
  ['/', 'inicio'],
  ['/duenos', 'lista'],
  ['/duenos/:id', 'ficha'],
]
assert.equal(resolver(rutas, '/').resto[0], 'inicio')
assert.equal(resolver(rutas, '/duenos').resto[0], 'lista')
assert.equal(resolver(rutas, '/duenos/xyz').resto[0], 'ficha')
assert.deepEqual(resolver(rutas, '/duenos/xyz').params, { id: 'xyz' })
assert.equal(resolver(rutas, '/no-existe'), null)

console.log('router: ok')
