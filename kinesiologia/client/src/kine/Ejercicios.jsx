import { useEffect, useMemo, useState } from 'react'
import { api } from './api.js'
import Modal from './Modal.jsx'

const ARTICULACIONES_BASE = ['Hombro', 'Escápula', 'Codo', 'Antebrazo', 'Muñeca', 'Columna cervical', 'Columna torácica', 'Columna lumbar', 'Columna', 'Cadera', 'Rodilla', 'Tobillo', 'Miembro superior', 'Miembro inferior', 'Multiartricular']
const MOVIMIENTOS_BASE = ['Flexión', 'Extensión', 'Abducción', 'Aducción', 'Rotación interna', 'Rotación externa', 'Abducción horizontal', 'Aducción horizontal', 'Dorsiflexión', 'Flexión plantar', 'Inversión', 'Eversión', 'Pronación', 'Supinación', 'Retracción', 'Protracción', 'Elevación', 'Estabilización', 'Movilidad', 'Multiplanar', 'Multiartricular', 'Empuje', 'Circuito / rutina', 'General']
const EMPTY = { nombre: '', descripcion: '', categoria: '', articulacion: '', movimiento: '', video_url: '', imagen_url: '' }

function datosCategoria(ejercicio = {}) {
  const [articulacion = '', movimiento = ''] = (ejercicio.categoria || '').split(' · ')
  return { ...ejercicio, articulacion: ejercicio.articulacion || articulacion, movimiento: ejercicio.movimiento || movimiento }
}

function ordered(values, reference) {
  return [...new Set(values.filter(Boolean))].sort((a, b) => {
    const ai = reference.indexOf(a), bi = reference.indexOf(b)
    if (ai === -1 && bi === -1) return a.localeCompare(b, 'es')
    if (ai === -1) return 1
    if (bi === -1) return -1
    return ai - bi
  })
}

export default function Ejercicios() {
  const [ejercicios, setEjercicios] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [articulacionFiltro, setArticulacionFiltro] = useState('')
  const [movimientoFiltro, setMovimientoFiltro] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)

  useEffect(() => { cargar() }, [])
  async function cargar() { setEjercicios((await api.getEjercicios()).map(datosCategoria)) }

  const articulaciones = useMemo(() => ordered([...ARTICULACIONES_BASE, ...ejercicios.map(e => e.articulacion)], ARTICULACIONES_BASE), [ejercicios])
  const movimientos = useMemo(() => ordered([...MOVIMIENTOS_BASE, ...ejercicios.map(e => e.movimiento)], MOVIMIENTOS_BASE), [ejercicios])
  const movimientosFiltrados = movimientoFiltro || !articulacionFiltro
    ? movimientos
    : ordered(ejercicios.filter(e => e.articulacion === articulacionFiltro).map(e => e.movimiento), MOVIMIENTOS_BASE)

  function abrirNuevo() { setForm(EMPTY); setEditId(null); setModal(true) }
  function abrirEditar(ejercicio) { setForm(datosCategoria(ejercicio)); setEditId(ejercicio.id); setModal(true) }

  async function guardar(event) {
    event.preventDefault()
    const payload = { ...form, categoria: form.articulacion && form.movimiento ? `${form.articulacion} · ${form.movimiento}` : '' }
    if (editId) await api.updateEjercicio(editId, payload)
    else await api.createEjercicio(payload)
    setModal(false)
    cargar()
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar ejercicio?')) return
    await api.deleteEjercicio(id)
    cargar()
  }

  const filtrados = ejercicios.filter(ejercicio => {
    const matchBusqueda = `${ejercicio.nombre} ${ejercicio.descripcion}`.toLowerCase().includes(busqueda.toLowerCase())
    return matchBusqueda && (!articulacionFiltro || ejercicio.articulacion === articulacionFiltro) && (!movimientoFiltro || ejercicio.movimiento === movimientoFiltro)
  })

  return (
    <div className="kine-page">
      <div className="kine-page-header">
        <h1 className="kine-page-title">Biblioteca de ejercicios</h1>
        <div className="kine-page-actions">
          <input className="kine-search" placeholder="Buscar ejercicio..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          <select className="kine-select" value={articulacionFiltro} onChange={e => { setArticulacionFiltro(e.target.value); setMovimientoFiltro('') }}>
            <option value="">Todas las articulaciones</option>
            {articulaciones.map(articulacion => <option key={articulacion} value={articulacion}>{articulacion}</option>)}
          </select>
          <select className="kine-select" value={movimientoFiltro} onChange={e => setMovimientoFiltro(e.target.value)}>
            <option value="">Todos los movimientos</option>
            {movimientosFiltrados.map(movimiento => <option key={movimiento} value={movimiento}>{movimiento}</option>)}
          </select>
          <button className="kine-btn-primary" onClick={abrirNuevo}>+ Nuevo ejercicio</button>
        </div>
      </div>

      {filtrados.length === 0
        ? <div className="kine-empty">No hay ejercicios que coincidan con los filtros.</div>
        : <div className="kine-ej-grid">{filtrados.map(ejercicio => (
          <div key={ejercicio.id} className="kine-ej-card">
            <div className="kine-ej-header">
              <span className="kine-ej-cat">{ejercicio.articulacion || 'General'} · {ejercicio.movimiento || 'Sin clasificar'}</span>
              <div>
                <button className="kine-btn-icon-sm" onClick={() => abrirEditar(ejercicio)}>✎</button>
                <button className="kine-btn-icon-sm danger" onClick={() => eliminar(ejercicio.id)}>✕</button>
              </div>
            </div>
            <div className="kine-ej-nombre">{ejercicio.nombre}</div>
            {ejercicio.descripcion && <div className="kine-ej-desc">{ejercicio.descripcion}</div>}
            {ejercicio.video_url && <a href={ejercicio.video_url} target="_blank" rel="noreferrer" className="kine-ej-video">▶ Ver video</a>}
          </div>
        ))}</div>}

      <Modal open={modal} onClose={() => setModal(false)} titulo={editId ? 'Editar ejercicio' : 'Nuevo ejercicio'}>
        <form className="kine-form" onSubmit={guardar}>
          <label>Nombre *<input required value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Ej: Sentadilla con apoyo" /></label>
          <label>Articulación
            <select value={form.articulacion} onChange={e => setForm(f => ({ ...f, articulacion: e.target.value }))}>
              <option value="">Sin clasificar</option>
              {articulaciones.map(articulacion => <option key={articulacion} value={articulacion}>{articulacion}</option>)}
            </select>
          </label>
          <label>Movimiento
            <select value={form.movimiento} onChange={e => setForm(f => ({ ...f, movimiento: e.target.value }))}>
              <option value="">Sin clasificar</option>
              {movimientos.map(movimiento => <option key={movimiento} value={movimiento}>{movimiento}</option>)}
            </select>
          </label>
          <label>Descripción<textarea rows={3} value={form.descripcion || ''} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Cómo realizarlo, músculos involucrados..." /></label>
          <label>Link de video<input type="url" value={form.video_url || ''} onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))} placeholder="https://..." /></label>
          <div className="kine-form-footer">
            <button type="button" className="kine-btn-secondary" onClick={() => setModal(false)}>Cancelar</button>
            <button type="submit" className="kine-btn-primary">{editId ? 'Guardar' : 'Crear ejercicio'}</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
