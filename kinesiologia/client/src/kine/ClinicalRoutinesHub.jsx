import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from './api.js'

const c = { ink: '#F2F7FB', muted: '#9BB0C0', sky: '#38C5CB', skyDark: '#8BE9E8' }
const card = { background: '#112433', border: '1px solid rgba(148,184,204,.16)', borderRadius: 22, padding: 16, boxShadow: '0 12px 28px rgba(0,0,0,.20)' }
const btn = { border: 'none', borderRadius: 14, padding: '10px 14px', fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit' }
const input = { width: '100%', borderRadius: 14, border: '1px solid rgba(148,184,204,.20)', background: '#0B1B29', padding: '11px 13px', fontSize: 14, color: c.ink, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }

export default function ClinicalRoutinesHub() {
  const navigate = useNavigate()
  const [pacientes, setPacientes] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getPacientes()
      .then(setPacientes)
      .finally(() => setLoading(false))
  }, [])

  const filtered = pacientes.filter(p => `${p.nombre || ''} ${p.apellido || ''} ${p.email || ''}`.toLowerCase().includes(search.toLowerCase()))

  return (
    <div style={{ display: 'grid', gap: 16, paddingBottom: 40 }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 900, color: c.muted, textTransform: 'uppercase', letterSpacing: '.08em' }}>KinePlus</div>
          <h1 style={{ margin: '4px 0 0', color: c.ink, fontSize: 28 }}>Rutinas clínicas</h1>
          <p style={{ margin: '6px 0 0', color: c.muted, fontSize: 14 }}>Elegí un paciente para crear o editar rutinas con ejercicios, cardio, campo e indicaciones.</p>
        </div>
        <button type="button" onClick={() => navigate('/kine')} style={{ ...btn, background: '#112433', color: c.skyDark, border: '1px solid rgba(148,184,204,.20)' }}>← Volver</button>
      </header>

      <section style={card}>
        <input style={input} value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar paciente..." />
      </section>

      {loading ? <div style={{ color: c.muted }}>Cargando pacientes...</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {filtered.map(p => (
            <button key={p.id} type="button" onClick={() => navigate(`/kine/rutinas-clinicas/${p.id}`)} style={{ ...card, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(86,211,177,.14)', color: '#91E8D0', display: 'grid', placeItems: 'center', fontWeight: 900 }}>{(p.nombre?.[0] || 'P')}{(p.apellido?.[0] || '')}</div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 16, fontWeight: 900, color: c.ink }}>{p.nombre} {p.apellido}</div>
                  <div style={{ fontSize: 12, color: c.muted, marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.email || 'Sin email'}</div>
                </div>
              </div>
              <div style={{ marginTop: 12, fontSize: 13, color: c.skyDark, fontWeight: 900 }}>Abrir rutinas clínicas →</div>
            </button>
          ))}
          {filtered.length === 0 && <div style={{ ...card, color: c.muted, textAlign: 'center' }}>No encontré pacientes.</div>}
        </div>
      )}
    </div>
  )
}
