import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from './api.js'
import Modal from './Modal.jsx'

const EMPTY = { nombre: '', apellido: '', edad: '', email: '', celular: '', dni: '', tipo: '' }

const inputStyle = {
  width: '100%', marginTop: 4, padding: '11px 12px',
  borderRadius: 12, border: '1px solid rgba(148,184,204,.20)',
  fontSize: 14, color: '#F2F7FB', outline: 'none',
  fontFamily: 'inherit', background: '#0B1B29',
  boxSizing: 'border-box',
}

function Field({ label, required, children }) {
  const child = children
  const cloned = child.type === 'input' || child.type === 'select'
    ? { ...child, props: { ...child.props, style: { ...inputStyle, ...child.props.style } } }
    : child
  return (
    <div>
      <label style={{ fontSize: 14, color: '#C5D4DE' }}>
        {label}{required && ' *'}
      </label>
      {cloned}
    </div>
  )
}

export default function Pacientes() {
  const [pacientes, setPacientes] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState(EMPTY)
  const [editId, setEditId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [accesoCreado, setAccesoCreado] = useState(null)
  const navigate = useNavigate()

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setLoading(true)
    try { setPacientes(await api.getPacientes()) } finally { setLoading(false) }
  }

  function abrirNuevo() { setForm(EMPTY); setEditId(null); setAccesoCreado(null); setModal(true) }

  function abrirEditar(p, e) {
    e.stopPropagation()
    setForm({ nombre: p.nombre, apellido: p.apellido, edad: p.edad || '', email: p.email || '', celular: p.celular || '', dni: p.dni || '', tipo: p.tipo || '' })
    setEditId(p.id)
    setAccesoCreado(null)
    setModal(true)
  }

  async function guardar(e) {
    e.preventDefault()
    if (editId) {
      await api.updatePaciente(editId, form)
      setModal(false)
    } else {
      const res = await api.createPaciente(form)
      if (res.acceso) {
        setAccesoCreado(res.acceso)
      } else {
        setModal(false)
      }
    }
    cargar()
  }

  async function eliminar(id, e) {
    e.stopPropagation()
    if (!confirm('¿Eliminar paciente y todos sus datos?')) return
    await api.deletePaciente(id)
    cargar()
  }

  const filtrados = pacientes.filter(p =>
    `${p.nombre} ${p.apellido} ${p.email || ''} ${p.dni || ''}`.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div className="kine-page">
      <div className="kine-page-header">
        <h1 className="kine-page-title">Pacientes <span className="kine-page-count">{pacientes.length}</span></h1>
        <div className="kine-page-actions">
          <input className="kine-search" placeholder="Buscar..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
          <button className="kine-btn-primary" onClick={abrirNuevo}>+ Nuevo paciente</button>
        </div>
      </div>

      {loading
        ? <div className="kine-loading">Cargando...</div>
        : filtrados.length === 0
          ? <div className="kine-empty">No hay pacientes aún</div>
          : (
            <div className="pacientes-grid">
              {filtrados.map(p => (
                <div key={p.id} className="paciente-card" onClick={() => navigate(`/kine/paciente/${p.id}`)}>
                  <div className="paciente-card-avatar">{p.nombre[0]}{p.apellido[0]}</div>
                  <div className="paciente-card-info">
                    <div className="paciente-card-nombre">{p.nombre} {p.apellido}</div>
                    {p.edad && <div className="paciente-card-os">{p.edad} años</div>}
                    {p.celular && <div className="paciente-card-os">{p.celular}</div>}
                    {p.email && <div className="paciente-card-os">{p.email}</div>}
                    {p.usuario_id && <div className="paciente-card-os" style={{ color: 'var(--kine-ok)' }}>✓ Acceso activo</div>}
                  </div>
                  <div className="paciente-card-btns">
                    <button className="kine-btn-icon" onClick={e => abrirEditar(p, e)} title="Editar">✎</button>
                    <button className="kine-btn-icon danger" onClick={e => eliminar(p.id, e)} title="Eliminar">✕</button>
                  </div>
                </div>
              ))}
            </div>
          )
      }

      <Modal
        open={modal}
        onClose={() => setModal(false)}
        titulo={editId ? 'Editar paciente' : 'Nuevo paciente'}
        subtitulo="Completá los datos básicos"
      >
        {accesoCreado ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ background: 'rgba(86,211,177,.14)', color: '#91E8D0', borderRadius: 12, padding: '12px 16px', fontWeight: 600, fontSize: 14 }}>
              ✅ Paciente creado con acceso al portal
            </div>
            <p style={{ fontSize: 13, color: '#B7C8D7' }}>
              Compartí estos datos con el paciente para que pueda ver su ficha:
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[['URL', '/kine'], ['Email', accesoCreado.email], ['Contraseña', accesoCreado.password]].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', background: '#0B1B29', borderRadius: 12, padding: '10px 14px', fontSize: 14 }}>
                  <span style={{ color: '#B7C8D7' }}>{label}</span>
                  <strong style={{ color: '#F2F7FB' }}>{val}</strong>
                </div>
              ))}
            </div>
            <button onClick={() => setModal(false)}
              style={{ marginTop: 8, width: '100%', background: 'linear-gradient(135deg,#1BAAB5,#16728C)', color: '#fff', border: 'none', borderRadius: 14, padding: '13px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>
              Listo
            </button>
          </div>
        ) : (
          <form onSubmit={guardar} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Nombre + Apellido */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="Nombre" required>
                <input required placeholder="Ej: Emilia" value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
              </Field>
              <Field label="Apellido" required>
                <input required placeholder="Ej: Santaliz" value={form.apellido} onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))} />
              </Field>
            </div>

            {/* DNI + Edad */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Field label="DNI">
                <input placeholder="Se usa como contraseña" value={form.dni} onChange={e => setForm(f => ({ ...f, dni: e.target.value }))} />
              </Field>
              <Field label="Edad">
                <input type="number" min="0" max="120" placeholder="Ej: 35" value={form.edad} onChange={e => setForm(f => ({ ...f, edad: e.target.value }))} />
              </Field>
            </div>

            {/* Email */}
            <Field label="Email">
              <input type="email" placeholder="email@gmail.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </Field>

            {/* Tipo */}
            <Field label="Tipo de paciente">
              <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
                <option value="">Seleccionar</option>
                <option value="Particular">Particular</option>
                <option value="Clic">Clic</option>
                <option value="Friend">Friend</option>
              </select>
            </Field>

            {!editId && form.email && (
              <div style={{ background: 'rgba(56,197,203,.12)', border: '1px solid rgba(56,197,203,.24)', borderRadius: 12, padding: '10px 14px', fontSize: 13, color: '#A0E9E7' }}>
                Se creará acceso con email <strong>{form.email}</strong> y contraseña <strong>{form.dni || '123456'}</strong>
              </div>
            )}

            {/* Botones */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
              <button type="button" onClick={() => setModal(false)}
                style={{ padding: '10px 18px', borderRadius: 12, border: '1px solid rgba(148,184,204,.20)', color: '#C5D4DE', background: 'none', cursor: 'pointer', fontSize: 14, fontFamily: 'inherit' }}>
                Cancelar
              </button>
              <button type="submit"
                style={{ padding: '10px 22px', borderRadius: 12, background: 'linear-gradient(135deg,#1BAAB5,#16728C)', color: '#fff', border: 'none', fontWeight: 600, fontSize: 14, cursor: 'pointer', boxShadow: '0 1px 3px rgba(4,116,139,.3)', fontFamily: 'inherit' }}>
                {editId ? 'Guardar cambios' : 'Crear paciente'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  )
}
