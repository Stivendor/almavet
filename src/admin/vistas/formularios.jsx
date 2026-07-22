import { useState } from 'react'
import { Campo, ErrorLinea } from '../ui.jsx'
import { useGuardado } from '../useGuardado.js'
import { hoyISO, normalizarTelefono } from '../../whatsapp.js'

// Los formularios de dueño y mascota se usan dos veces cada uno (crear desde una
// lista, editar desde la ficha). Viven aquí para que "añadir un campo" sea un
// cambio en un sitio y no dos formularios que se van separando con el tiempo.

export function FormDueno({ inicial = {}, alGuardar, onCancelar }) {
  const [f, setF] = useState({
    nombre: inicial.nombre ?? '',
    telefono: inicial.telefono ?? '',
    email: inicial.email ?? '',
    documento: inicial.documento ?? '',
    direccion: inicial.direccion ?? '',
    notas: inicial.notas ?? '',
    autoriza_datos: inicial.autoriza_datos ?? false,
  })
  const set = (k) => (e) =>
    setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  const { enviar, guardando, error } = useGuardado(async () => {
    const telefono = normalizarTelefono(f.telefono)
    // El teléfono es la llave natural con la que la base deduplica clientes:
    // guardarlo sin normalizar crea un segundo dueño para la misma persona.
    if (!telefono) throw new Error('El celular debe tener 10 dígitos y empezar por 3')
    await alGuardar({
      ...f,
      telefono,
      email: f.email || null,
      documento: f.documento || null,
      direccion: f.direccion || null,
      notas: f.notas || null,
      // La fecha de la autorización es la prueba; sin ella la casilla no vale.
      autorizado_en: f.autoriza_datos ? (inicial.autorizado_en ?? new Date().toISOString()) : null,
    })
  })

  return (
    <form onSubmit={enviar}>
      <div className="fila">
        <Campo id="d-nombre" etiqueta="Nombre">
          <input id="d-nombre" required value={f.nombre} onChange={set('nombre')} />
        </Campo>
        <Campo id="d-telefono" etiqueta="Celular">
          <input
            id="d-telefono"
            inputMode="tel"
            required
            placeholder="320 438 7439"
            value={f.telefono}
            onChange={set('telefono')}
          />
        </Campo>
      </div>
      <div className="fila">
        <Campo id="d-email" etiqueta="Correo (opcional)">
          <input id="d-email" type="email" value={f.email} onChange={set('email')} />
        </Campo>
        <Campo id="d-documento" etiqueta="Documento (opcional)">
          <input id="d-documento" value={f.documento} onChange={set('documento')} />
        </Campo>
      </div>
      <Campo id="d-direccion" etiqueta="Dirección (opcional)">
        <input id="d-direccion" value={f.direccion} onChange={set('direccion')} />
      </Campo>
      <Campo id="d-notas" etiqueta="Notas">
        <textarea id="d-notas" value={f.notas} onChange={set('notas')} />
      </Campo>

      <div className="campo checkbox">
        <input
          id="d-autoriza"
          type="checkbox"
          checked={f.autoriza_datos}
          onChange={set('autoriza_datos')}
        />
        <label htmlFor="d-autoriza">
          Autorizó el tratamiento de sus datos (Ley 1581 de 2012)
        </label>
      </div>

      <ErrorLinea error={error} />
      <div className="acciones">
        <button className="boton" disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>
        {onCancelar && (
          <button className="boton boton-suave" type="button" onClick={onCancelar}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}

export function FormMascota({ inicial = {}, alGuardar, onCancelar }) {
  const [f, setF] = useState({
    nombre: inicial.nombre ?? '',
    especie: inicial.especie ?? 'perro',
    raza: inicial.raza ?? '',
    sexo: inicial.sexo ?? '',
    tamano: inicial.tamano ?? '',
    fecha_nacimiento: inicial.fecha_nacimiento ?? '',
    esterilizado: inicial.esterilizado ?? false,
    alergias: inicial.alergias ?? '',
    notas: inicial.notas ?? '',
  })
  const set = (k) => (e) =>
    setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value })

  const { enviar, guardando, error } = useGuardado(() =>
    // Los CHECK de la base rechazan '' porque no está en ninguna lista de valores.
    alGuardar({
      ...f,
      raza: f.raza || null,
      sexo: f.sexo || null,
      tamano: f.tamano || null,
      fecha_nacimiento: f.fecha_nacimiento || null,
      alergias: f.alergias || null,
      notas: f.notas || null,
    }),
  )

  return (
    <form onSubmit={enviar}>
      <div className="fila">
        <Campo id="m-nombre" etiqueta="Nombre">
          <input id="m-nombre" required value={f.nombre} onChange={set('nombre')} />
        </Campo>
        <Campo id="m-especie" etiqueta="Especie">
          <select id="m-especie" required value={f.especie} onChange={set('especie')}>
            <option value="perro">perro</option>
            <option value="gato">gato</option>
          </select>
        </Campo>
        <Campo id="m-raza" etiqueta="Raza">
          <input id="m-raza" value={f.raza} onChange={set('raza')} />
        </Campo>
      </div>
      <div className="fila">
        <Campo id="m-sexo" etiqueta="Sexo">
          <select id="m-sexo" value={f.sexo} onChange={set('sexo')}>
            <option value="">—</option>
            <option value="macho">macho</option>
            <option value="hembra">hembra</option>
          </select>
        </Campo>
        <Campo id="m-tamano" etiqueta="Tamaño">
          <select id="m-tamano" value={f.tamano} onChange={set('tamano')}>
            <option value="">—</option>
            <option value="pequeño">pequeño</option>
            <option value="mediano">mediano</option>
            <option value="grande">grande</option>
          </select>
        </Campo>
        <Campo id="m-nacimiento" etiqueta="Fecha de nacimiento">
          <input
            id="m-nacimiento"
            type="date"
            max={hoyISO()}
            value={f.fecha_nacimiento}
            onChange={set('fecha_nacimiento')}
          />
        </Campo>
      </div>

      <div className="campo checkbox">
        <input
          id="m-esterilizado"
          type="checkbox"
          checked={f.esterilizado}
          onChange={set('esterilizado')}
        />
        <label htmlFor="m-esterilizado">Esterilizado</label>
      </div>

      {/* Arriba del todo en la ficha: es el dato que puede matar a un paciente. */}
      <Campo id="m-alergias" etiqueta="Alergias">
        <input id="m-alergias" value={f.alergias} onChange={set('alergias')} />
      </Campo>
      <Campo id="m-notas" etiqueta="Notas">
        <textarea id="m-notas" value={f.notas} onChange={set('notas')} />
      </Campo>

      <ErrorLinea error={error} />
      <div className="acciones">
        <button className="boton" disabled={guardando}>
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>
        {onCancelar && (
          <button className="boton boton-suave" type="button" onClick={onCancelar}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  )
}
