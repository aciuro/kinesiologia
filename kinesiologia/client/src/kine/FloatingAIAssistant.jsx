import { useState } from 'react'
import { api } from './api.js'

const c = {
  ink: '#F2F7FB', ink2: '#C5D4DE', muted: '#91A9B9', border: 'rgba(148,184,204,.18)',
  sky: '#38C5CB', skyDark: '#16728C', white: '#112433', soft: '#0B1B29', red: '#FFAEA7'
}

export default function FloatingAIAssistant() {
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [messages, setMessages] = useState([
    { role: 'assistant', text: 'Hola Augusto. Pedime cambios o ideas para rutinas, ejercicios, agentes físicos, series, repeticiones o frecuencia.' }
  ])

  async function send() {
    const text = prompt.trim()
    if (!text || loading) return
    setPrompt('')
    setMessages(prev => [...prev, { role: 'user', text }])
    setLoading(true)
    try {
      const res = await api.iaRutina({
        prompt: text,
        rutina: {},
        contexto: { ubicacion: window.location.pathname, modo: 'asistente_global' },
      })
      const answer = res?.resumen || 'Te dejo una propuesta para aplicar.'
      setMessages(prev => [...prev, { role: 'assistant', text: answer, actions: res?.actions || [] }])
    } catch (e) {
      setMessages(prev => [...prev, { role: 'assistant', text: e?.message || 'No pude conectar con la IA.', error: true }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {open && (
        <div
          style={{
            position: 'fixed', right: 14, bottom: 98, width: 'min(420px, calc(100vw - 28px))',
            maxHeight: 'min(620px, calc(100dvh - 132px))', background: c.white, border: `1px solid ${c.border}`,
            borderRadius: 26, boxShadow: '0 28px 80px rgba(13,53,64,.24)', zIndex: 300,
            display: 'grid', gridTemplateRows: 'auto 1fr auto', overflow: 'hidden'
          }}
        >
            <div style={{ padding: 15, background: 'linear-gradient(135deg,#112433 0%,#102B3B 100%)', borderBottom: `1px solid ${c.border}`, display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', fontWeight: 950, color: c.muted }}>Asistente IA</div>
              <div style={{ fontSize: 18, fontWeight: 950, color: c.ink, marginTop: 2 }}>Copiloto clínico</div>
            </div>
            <button type="button" onClick={() => setOpen(false)} style={{ border: `1px solid ${c.border}`, background: c.white, color: c.ink2, borderRadius: 14, padding: '8px 10px', fontWeight: 900 }}>Cerrar</button>
          </div>

          <div style={{ padding: 12, overflowY: 'auto', display: 'grid', gap: 10, background: c.soft }}>
            {messages.map((m, i) => (
              <div key={i} style={{ justifySelf: m.role === 'user' ? 'end' : 'start', maxWidth: '92%' }}>
                <div style={{
                  borderRadius: m.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                  background: m.role === 'user' ? `linear-gradient(135deg, ${c.sky}, ${c.skyDark})` : c.white,
                  color: m.role === 'user' ? '#fff' : (m.error ? c.red : c.ink2),
                  border: m.role === 'user' ? 'none' : `1px solid ${c.border}`,
                  padding: '10px 12px', fontSize: 13, lineHeight: 1.35, fontWeight: 750
                }}>
                  {m.text}
                </div>
                {Array.isArray(m.actions) && m.actions.length > 0 && (
                  <div style={{ marginTop: 6, display: 'grid', gap: 5 }}>
                    {m.actions.slice(0, 5).map((a, idx) => (
                      <div key={idx} style={{ background: '#112433', border: `1px solid ${c.border}`, borderRadius: 12, padding: '7px 9px', color: c.ink2, fontSize: 11 }}>
                        <b>{a.type}</b>{a.nombre ? ` · ${a.nombre}` : ''}{a.query ? ` · ${a.query}` : ''}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && <div style={{ color: c.muted, fontSize: 12, fontWeight: 900 }}>Pensando...</div>}
          </div>

          <div style={{ padding: 12, background: '#112433', borderTop: `1px solid ${c.border}` }}>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
              placeholder="Ej: agregá hielo 15 min, armame una progresión de rodilla, bajá reps..."
              style={{
                width: '100%', minHeight: 74, resize: 'none', border: `1px solid ${c.border}`, borderRadius: 18,
                padding: 12, background: '#0B1B29', color: c.ink, WebkitTextFillColor: c.ink, caretColor: c.skyDark,
                fontFamily: 'inherit', fontSize: 14, outline: 'none', boxSizing: 'border-box'
              }}
            />
            <button type="button" onClick={send} disabled={loading || !prompt.trim()} style={{
              marginTop: 8, width: '100%', border: 0, borderRadius: 16, padding: '11px 14px',
              background: `linear-gradient(135deg, ${c.sky}, ${c.skyDark})`, color: '#fff', fontWeight: 950,
              opacity: loading || !prompt.trim() ? .55 : 1, fontFamily: 'inherit'
            }}>
              Enviar
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-label="Abrir asistente IA"
        style={{
          position: 'fixed', right: 18, bottom: 102, zIndex: 280, width: 58, height: 58, borderRadius: 22,
          border: '1px solid rgba(255,255,255,.55)', background: `linear-gradient(135deg, ${c.sky}, ${c.skyDark})`,
          color: '#fff', boxShadow: '0 18px 42px rgba(23,111,130,.34)', fontSize: 23, fontWeight: 950,
          display: 'grid', placeItems: 'center'
        }}
      >
        IA
      </button>
    </>
  )
}
