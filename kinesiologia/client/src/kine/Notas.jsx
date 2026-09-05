import { useEffect, useState } from 'react'
import { api } from './api.js'

const c = {
  bg: '#081521', white: '#112433', sky: '#38C5CB', skyDark: '#8BE9E8',
  skyLight: 'rgba(56,197,203,.14)', skyXlight: '#0D1D2B', aqua: '#56D3B1', aquaDark: '#91E8D0',
  aquaLight: 'rgba(86,211,177,.14)', ink: '#F2F7FB', ink2: '#C5D4DE', muted: '#829AAD',
  border: 'rgba(148,184,204,.16)',
  yellow: 'rgba(243,201,112,.13)', yellowBorder: 'rgba(243,201,112,.30)', yellowText: '#F7D88C', yellowDark: '#F3C970',
  redBg: 'rgba(242,139,130,.12)', redBorder: 'rgba(242,139,130,.32)', redText: '#FFB0A8',
}

export default function Notas() {
  const [notas, setNotas] = useState([])
  const [nuevo, setNuevo] = useState('')
  const [zoomNota, setZoomNota] = useState(null)
  const [editTexto, setEditTexto] = useState('')
  const [editando, setEditando] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getNotas().then(data => { setNotas(data); setLoading(false) }).catch(() => setLoading(false))
  }, [])

  async function agregarNota() {
    if (!nuevo.trim()) return
    const nota = await api.createNota(nuevo.trim())
    setNotas(p => [nota, ...p])
    setNuevo('')
  }

  async function eliminarNota(id) {
    await api.deleteNota(id)
    setNotas(p => p.filter(n => n.id !== id))
    setZoomNota(null)
  }

  async function guardarEdicion() {
    const actualizada = await api.updateNota(zoomNota.id, editTexto)
    setNotas(p => p.map(n => n.id === zoomNota.id ? actualizada : n))
    setZoomNota(actualizada)
    setEditando(false)
  }

  function abrirNota(nota) {
    setZoomNota(nota)
    setEditTexto(nota.texto)
    setEditando(false)
  }

  function formatFecha(dateStr) {
    if (!dateStr) return ''
    const d = new Date(dateStr + 'T12:00')
    const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
    return `${d.getDate()} ${meses[d.getMonth()]}`
  }

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, color: c.muted, letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 3 }}>Panel profesional</div>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: c.ink }}>Notas</div>
      </div>

      <div style={{ background: c.yellow, border: `0.5px solid ${c.yellowBorder}`, borderRadius: 16, padding: '14px 16px', marginBottom: 18 }}>
        <div style={{ fontSize: 10, fontWeight: 600, color: c.yellowText, letterSpacing: '1px', textTransform: 'uppercase', marginBottom: 8 }}>Nueva nota</div>
        <textarea
          value={nuevo}
          onChange={e => setNuevo(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); agregarNota() } }}
          placeholder="Escribí lo que necesitás recordar… (Enter para guardar)"
          style={{ width: '100%', minHeight: 72, padding: '10px 12px', borderRadius: 11, border: `0.5px solid ${c.yellowBorder}`, background: 'rgba(255,255,255,0.7)', fontSize: 13, color: c.ink, fontFamily: "'DM Sans', sans-serif", resize: 'none', lineHeight: 1.55 }}
        />
        <button onClick={agregarNota}
          style={{ marginTop: 8, width: '100%', padding: '10px 0', borderRadius: 11, border: 'none', background: `linear-gradient(135deg,#F0DFA0,${c.yellowBorder})`, color: c.yellowText, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
          Guardar nota
        </button>
      </div>

      {loading && <div style={{ textAlign: 'center', color: c.muted, fontSize: 13, padding: '20px 0' }}>Cargando…</div>}
      {!loading && notas.length === 0 && <div style={{ textAlign: 'center', color: c.muted, fontSize: 13, paddingTop: 20 }}>Sin notas aún</div>}

      {notas.map(nota => (
        <div key={nota.id} onClick={() => abrirNota(nota)}
          style={{ background: c.white, borderRadius: 14, border: `0.5px solid ${c.yellowBorder}`, padding: '13px 16px', marginBottom: 10, cursor: 'pointer', display: 'flex', alignItems: 'flex-start', gap: 11 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: c.yellow, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
            <svg width="13" height="13" viewBox="0 0 16 16" fill="none"><path d="M3 2h7l3 3v9H3V2z" stroke={c.yellowDark} strokeWidth="1.2" strokeLinejoin="round"/><path d="M10 2v3h3" stroke={c.yellowDark} strokeWidth="1.2" strokeLinejoin="round"/><path d="M5 7h6M5 9.5h4" stroke={c.yellowDark} strokeWidth="1.1" strokeLinecap="round"/></svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 13, color: c.ink, lineHeight: 1.5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{nota.texto}</div>
            <div style={{ fontSize: 10, color: c.muted, marginTop: 4 }}>{formatFecha(nota.fecha)}</div>
          </div>
          <svg width="8" height="8" viewBox="0 0 9 9" fill="none" style={{ flexShrink: 0, marginTop: 6 }}><path d="M2 1.5l3.5 3-3.5 3" stroke={c.muted} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
      ))}

      {zoomNota && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 300, background: 'rgba(13,53,64,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px 16px' }}
          onClick={() => { setZoomNota(null); setEditando(false) }}>
          <div onClick={e => e.stopPropagation()}
            style={{ width: '100%', maxWidth: 480, background: c.white, borderRadius: 22, overflow: 'hidden', boxShadow: '0 20px 60px rgba(13,53,64,0.25)' }}>
            <div style={{ background: `linear-gradient(135deg,${c.yellow},#FFF3C0)`, padding: '18px 20px 16px', borderBottom: `0.5px solid ${c.yellowBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 2h7l3 3v9H3V2z" stroke={c.yellowDark} strokeWidth="1.2" strokeLinejoin="round"/><path d="M10 2v3h3" stroke={c.yellowDark} strokeWidth="1.2" strokeLinejoin="round"/><path d="M5 7h6M5 9.5h4" stroke={c.yellowDark} strokeWidth="1.1" strokeLinecap="round"/></svg>
                </div>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: c.yellowText }}>Nota</div>
                  <div style={{ fontSize: 10, color: c.yellowDark }}>{formatFecha(zoomNota.fecha)}</div>
                </div>
              </div>
              <button onClick={() => { setZoomNota(null); setEditando(false) }}
                style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.7)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke={c.yellowText} strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
            <div style={{ padding: '20px 22px 24px' }}>
              {editando ? (
                <textarea value={editTexto} onChange={e => setEditTexto(e.target.value)} autoFocus
                  style={{ width: '100%', minHeight: 120, padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${c.yellowBorder}`, background: c.yellow, fontSize: 14, color: c.ink, fontFamily: "'DM Sans', sans-serif", resize: 'none', lineHeight: 1.6 }} />
              ) : (
                <div style={{ fontSize: 15, color: c.ink, lineHeight: 1.65, minHeight: 60 }}>{zoomNota.texto}</div>
              )}
              <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
                {editando ? (
                  <>
                    <button onClick={guardarEdicion} style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: 'none', background: `linear-gradient(135deg,#F0DFA0,${c.yellowBorder})`, color: c.yellowText, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Guardar</button>
                    <button onClick={() => setEditando(false)} style={{ padding: '11px 16px', borderRadius: 12, border: `0.5px solid ${c.border}`, background: 'transparent', color: c.muted, fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Cancelar</button>
                  </>
                ) : (
                  <>
                    <button onClick={() => setEditando(true)} style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: 'none', background: `linear-gradient(135deg,#F0DFA0,${c.yellowBorder})`, color: c.yellowText, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>✏️ Editar</button>
                    <button onClick={() => eliminarNota(zoomNota.id)} style={{ padding: '11px 16px', borderRadius: 12, border: `0.5px solid ${c.redBorder}`, background: c.redBg, color: c.redText, fontSize: 13, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Eliminar</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
