import { useEffect, useState } from 'react'
import { api } from './api.js'

const c = {
  bg: '#081521', white: '#112433',
  sky: '#38C5CB', skyDark: '#8BE9E8',
  skyLight: 'rgba(56,197,203,.14)', skyXlight: '#0D1D2B',
  aqua: '#56D3B1', aquaDark: '#91E8D0', aquaLight: 'rgba(86,211,177,.14)',
  ink: '#F2F7FB', ink2: '#C5D4DE', muted: '#829AAD',
  border: 'rgba(148,184,204,.16)',
  redBg: 'rgba(242,139,130,.12)', redBorder: 'rgba(242,139,130,.32)', redText: '#FFB0A8', redSub: '#F28B82',
  yellow: 'rgba(243,201,112,.13)', yellowBorder: 'rgba(243,201,112,.30)', yellowText: '#F7D88C', yellowDark: '#F3C970',
}

const ALIAS    = 'augustociuro.s'
const ADMIN_WA = '5491144054833'

const INITIAL_HISTORY = [
  { date:'2026-04-10', manana:3, noche:2, descripcion:'Dolor al bajar escaleras, leve al caminar.' },
  { date:'2026-04-09', manana:5, noche:4, descripcion:'Molestia al caminar distancias largas.' },
  { date:'2026-04-08', manana:4, noche:3, descripcion:'Puntada al rotar el pie hacia adentro.' },
]

const globalStyle = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=DM+Serif+Display&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; }
  body { font-family: 'DM Sans', sans-serif; background: ${c.bg}; -webkit-font-smoothing: antialiased; }
  textarea, input { outline: none; }

  .pac-shell { min-height: 100vh; background: ${c.bg}; display: flex; flex-direction: column; color: ${c.ink}; font-size: 16px; line-height: 1.45; }
  .pac-content { flex: 1; padding: 16px 18px 120px; max-width: 480px; margin: 0 auto; width: 100%; }
  .pac-hero { background: linear-gradient(135deg, #102A43 0%, #0B5876 100%); border-radius: 28px; padding: 18px; margin-bottom: 22px; box-shadow: 0 18px 34px rgba(16,42,67,.20); border: 1px solid rgba(255,255,255,.12); }

  .bottom-nav {
    position: fixed; bottom: 12px; left: 12px; right: 12px;
    background: ${c.white}; border: 0.5px solid ${c.border};
    border-radius: 22px; display: flex; justify-content: space-around;
    padding: 10px 4px env(safe-area-inset-bottom,10px);
    z-index: 100; box-shadow: 0 4px 24px rgba(13,53,64,0.08);
  }
  .nav-btn { display: flex; flex-direction: column; align-items: center; gap: 3px; flex: 1; background: none; border: none; cursor: pointer; padding: 4px 2px; }
  .nav-label { font-size: 11px; font-family: 'DM Sans', sans-serif; white-space: nowrap; font-weight: 700; }
  .nav-dot { width: 4px; height: 4px; border-radius: 50%; background: ${c.skyDark}; margin: 1px auto 0; }

  .pp-card { background: ${c.white}; border-radius: 18px; border: 1px solid ${c.border}; padding: 17px; margin-bottom: 16px; box-shadow: 0 8px 22px rgba(16,42,67,.06); }
  .pp-mini-card { background: ${c.white}; border-radius: 16px; padding: 15px; display: flex; flex-direction: column; gap: 8px; border: 1px solid ${c.border}; }
  .pp-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }

  @media (min-width: 768px) {
    .pac-content { max-width: 860px; padding: 32px 40px 120px; }
    .bottom-nav { max-width: 480px; left: 50%; transform: translateX(-50%); right: auto; width: calc(100% - 40px); }
    .pp-two-col { display: grid !important; grid-template-columns: 1.1fr 0.9fr; gap: 24px; align-items: start; }
  }

  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: ${c.border}; border-radius: 2px; }
`

function LogoSVG() {
  return (
    <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
      <ellipse cx="13" cy="13" rx="7.5" ry="10.5" fill="#25B6D6" transform="rotate(-20 13 13)"/>
      <ellipse cx="13" cy="13" rx="5.5" ry="8.5" fill="#37C4BC" opacity="0.78" transform="rotate(30 13 13)"/>
      <line x1="13" y1="4" x2="13" y2="22" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  )
}

function formatDateLong() {
  const now = new Date()
  const days = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado']
  const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']
  return `${days[now.getDay()]} ${now.getDate()} de ${months[now.getMonth()]}`
}

function colorEscala(v) {
  if (!v) return c.muted
  if (v <= 3) return '#43A047'
  if (v <= 6) return '#F59E0B'
  return '#D0446A'
}

/* ── VideoEmbed ─────────────────────────────────────────── */
function VideoEmbed({ url }) {
  if (!url) return null
  let embedUrl = null
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/)
  if (yt) embedUrl = `https://www.youtube.com/embed/${yt[1]}`
  const sh = url.match(/youtube\.com\/shorts\/([^?&\s]+)/)
  if (sh) embedUrl = `https://www.youtube.com/embed/${sh[1]}`
  const vi = url.match(/vimeo\.com\/(\d+)/)
  if (vi) embedUrl = `https://player.vimeo.com/video/${vi[1]}`
  if (embedUrl) return (
    <div style={{ position:'relative', paddingBottom:'56.25%', margin:'1rem 0', borderRadius:14, overflow:'hidden' }}>
      <iframe src={embedUrl} style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%' }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="Ejercicio" />
    </div>
  )
  return <a href={url} target="_blank" rel="noreferrer" style={{ color:c.skyDark }}>Ver video del ejercicio</a>
}

/* ── EjercicioDetalle ───────────────────────────────────── */
function EjercicioDetalle({ ej, onVolver }) {
  const nombre = ej.nombre.replace(/ — (CC|OA)$/, '')
  return (
    <div style={{ background: c.bg, minHeight:'100vh', paddingBottom:'2rem' }}>
      <button onClick={onVolver} style={{ background:'none', border:'none', color:c.skyDark, fontSize:15, fontWeight:600, cursor:'pointer', padding:'1.5rem 1rem 0.5rem', display:'flex', alignItems:'center', gap:6 }}>
        ← Volver a la rutina
      </button>
      <div style={{ padding:'0 1rem' }}>
        <span style={{ background:c.skyLight, color:c.skyDark, borderRadius:20, padding:'2px 12px', fontSize:12, fontWeight:600 }}>
          {ej.categoria || 'General'}
        </span>
        <h2 style={{ color:c.ink, fontSize:22, fontWeight:700, margin:'0.75rem 0 1rem', fontFamily:"'DM Serif Display', serif" }}>{nombre}</h2>
        {(ej.series || ej.repeticiones || ej.segundos) && (
          <div className="pp-card" style={{ marginBottom:'1rem' }}>
            <div style={{ fontSize:11, color:c.muted, fontWeight:600, marginBottom:'0.75rem', textTransform:'uppercase', letterSpacing:1 }}>Tu prescripción</div>
            <div style={{ display:'flex', gap:16 }}>
              {ej.series       && <div style={{ textAlign:'center' }}><div style={{ fontSize:28, fontWeight:700, color:c.skyDark }}>{ej.series}</div><div style={{ fontSize:11, color:c.muted }}>Series</div></div>}
              {ej.repeticiones && <div style={{ textAlign:'center' }}><div style={{ fontSize:28, fontWeight:700, color:c.skyDark }}>{ej.repeticiones}</div><div style={{ fontSize:11, color:c.muted }}>Reps</div></div>}
              {ej.segundos     && <div style={{ textAlign:'center' }}><div style={{ fontSize:28, fontWeight:700, color:c.skyDark }}>{ej.segundos}"</div><div style={{ fontSize:11, color:c.muted }}>Seg</div></div>}
            </div>
          </div>
        )}
        <VideoEmbed url={ej.video_url} />
        {ej.descripcion && <p style={{ color:c.muted, fontSize:14, lineHeight:1.6 }}>{ej.descripcion}</p>}
      </div>
    </div>
  )
}

/* ── ModalDolor ─────────────────────────────────────────── */
function ModalDolor({ onClose, historia, onGuardar }) {
  const [tab, setTab]           = useState('registrar')
  const [manana, setManana]     = useState(null)
  const [noche, setNoche]       = useState(null)
  const [descripcion, setDesc]  = useState('')
  const [guardado, setGuardado] = useState(false)
  const hoy = new Date().toISOString().split('T')[0]

  function handleGuardar() {
    if (!manana && !noche) return
    onGuardar({ date:hoy, manana:manana||0, noche:noche||0, descripcion })
    setGuardado(true); setTimeout(() => setGuardado(false), 2500)
    setManana(null); setNoche(null); setDesc('')
  }

  function Escala({ value, onChange }) {
    return (
      <div style={{ display:'flex', gap:5, flexWrap:'wrap', margin:'0.5rem 0' }}>
        {[1,2,3,4,5,6,7,8,9,10].map(n => (
          <button key={n} onClick={() => onChange(n)} style={{
            width:32, height:32, borderRadius:9, border:'none', cursor:'pointer', fontWeight:700, fontSize:13,
            background: value===n ? colorEscala(n) : 'rgba(13,53,64,0.07)',
            color: value===n ? '#fff' : c.ink2,
            fontFamily:"'DM Sans', sans-serif",
          }}>{n}</button>
        ))}
      </div>
    )
  }

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(13,53,64,0.45)', zIndex:200, display:'flex', alignItems:'flex-end', justifyContent:'center' }} onClick={onClose}>
      <div style={{ background:c.white, borderRadius:'22px 22px 0 0', width:'100%', maxWidth:520, maxHeight:'92vh', overflow:'auto', padding:'1.5rem', margin:'0 auto' }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex', justifyContent:'center', marginBottom:12 }}>
          <div style={{ width:36, height:4, borderRadius:2, background:c.border }} />
        </div>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'1rem' }}>
          <div style={{ fontSize:17, fontWeight:500, color:c.ink }}>Registro de dolor</div>
          <button onClick={onClose} style={{ background:'rgba(13,53,64,0.06)', border:'none', borderRadius:'50%', width:30, height:30, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke={c.muted} strokeWidth="1.5" strokeLinecap="round"/></svg>
          </button>
        </div>
        <div style={{ display:'flex', gap:4, marginBottom:'1.5rem', background:'rgba(13,53,64,0.06)', borderRadius:10, padding:3 }}>
          {['registrar','historial'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{
              flex:1, padding:'8px 0', borderRadius:8, border:'none', cursor:'pointer', fontWeight: tab===t ? 500 : 400, fontSize:12,
              background: tab===t ? c.white : 'transparent',
              color: tab===t ? c.skyDark : c.muted,
              boxShadow: tab===t ? '0 1px 4px rgba(13,53,64,0.1)' : 'none',
              fontFamily:"'DM Sans', sans-serif", transition:'all 0.15s',
            }}>{t==='registrar' ? 'Registrar hoy' : 'Historial'}</button>
          ))}
        </div>
        {tab === 'registrar' && (
          <div style={{ display:'flex', flexDirection:'column', gap:18 }}>
            <div>
              <div style={{ fontSize:13, fontWeight:500, color:c.ink, marginBottom:'0.4rem' }}>🌅 Al despertar</div>
              <Escala value={manana} onChange={setManana} />
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:500, color:c.ink, marginBottom:'0.4rem' }}>✍️ Descripción</div>
              <textarea value={descripcion} onChange={e=>setDesc(e.target.value)} placeholder="Describí cómo te sentiste..." rows={3}
                style={{ width:'100%', border:`1px solid ${c.border}`, borderRadius:12, padding:'10px 12px', fontSize:13, color:c.ink, resize:'none', fontFamily:"'DM Sans', sans-serif", background:c.skyXlight }} />
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:500, color:c.ink, marginBottom:'0.4rem' }}>🌙 Al acostarse</div>
              <Escala value={noche} onChange={setNoche} />
            </div>
            {guardado
              ? <div style={{ textAlign:'center', color:c.aquaDark, fontWeight:600, padding:'12px', background:c.aquaLight, borderRadius:12 }}>✓ Guardado</div>
              : <button onClick={handleGuardar} style={{ width:'100%', padding:'14px', background:`linear-gradient(135deg,${c.sky},${c.skyDark})`, color:'#fff', border:'none', borderRadius:14, fontWeight:500, fontSize:14, cursor:'pointer', fontFamily:"'DM Sans', sans-serif" }}>
                  Guardar registro
                </button>
            }
          </div>
        )}
        {tab === 'historial' && (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {historia.length === 0
              ? <div style={{ color:c.muted, textAlign:'center', padding:'2rem' }}>Sin registros aún</div>
              : historia.map((h,i) => {
                  const d = new Date(h.date+'T12:00')
                  const label = d.toLocaleDateString('es-AR', { weekday:'short', day:'numeric', month:'short' })
                  return (
                    <div key={i} style={{ background:c.skyXlight, borderRadius:14, padding:'1rem', border:`0.5px solid ${c.border}` }}>
                      <div style={{ fontSize:12, color:c.muted, fontWeight:500, marginBottom:'0.5rem', textTransform:'capitalize' }}>{label}</div>
                      <div style={{ display:'flex', gap:8, marginBottom:'0.5rem' }}>
                        <div key="m" style={{ flex:1, background:colorEscala(h.manana), borderRadius:10, padding:'8px', textAlign:'center' }}>
                          <div style={{ fontSize:22, fontWeight:800, color:'#fff' }}>{h.manana}</div>
                          <div style={{ fontSize:10, color:'#fff', opacity:0.9 }}>Mañana</div>
                        </div>
                        <div key="n" style={{ flex:1, background:colorEscala(h.noche), borderRadius:10, padding:'8px', textAlign:'center' }}>
                          <div style={{ fontSize:22, fontWeight:800, color:'#fff' }}>{h.noche}</div>
                          <div style={{ fontSize:10, color:'#fff', opacity:0.9 }}>Noche</div>
                        </div>
                      </div>
                      {h.descripcion && <p style={{ fontSize:13, color:c.ink2, fontStyle:'italic', margin:0, lineHeight:1.5 }}>{h.descripcion}</p>}
                    </div>
                  )
                })
            }
          </div>
        )}
      </div>
    </div>
  )
}

/* ── DeudaOverlay ───────────────────────────────────────── */
function DeudaOverlay({ saldo }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(13,53,64,0.75)', zIndex:900, display:'flex', alignItems:'center', justifyContent:'center', padding:'1rem' }}>
      <div style={{ background:c.white, borderRadius:20, border:`0.5px solid ${c.border}`, padding:'2rem', maxWidth:360, width:'100%', textAlign:'center' }}>
        <div style={{ fontSize:40, marginBottom:'0.75rem' }}>🔒</div>
        <h2 style={{ color:c.ink, fontSize:20, fontWeight:600, margin:'0 0 0.5rem', fontFamily:"'DM Serif Display', serif" }}>Acceso suspendido</h2>
        <p style={{ color:c.muted, fontSize:14, marginBottom:'1rem' }}>Tenés un saldo pendiente de <strong style={{ color:c.ink }}>${saldo}</strong>.</p>
        <div style={{ background:c.redBg, border:`0.5px solid ${c.redBorder}`, borderRadius:14, padding:'0.75rem' }}>
          <div style={{ fontSize:11, color:c.redText, marginBottom:4 }}>Transferí al alias</div>
          <div style={{ fontSize:18, fontWeight:700, color:c.redText }}>{ALIAS}</div>
        </div>
      </div>
    </div>
  )
}

/* ── SeccionInicio ──────────────────────────────────────── */
function SeccionInicio({ paciente, rutinas, turnos, saldo, onAbrirDolor, historialDolor, onTabChange }) {
  const hoy = new Date(); hoy.setHours(0,0,0,0)
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  const proximoTurno = turnos
    .filter(t => { const d=new Date(t.fecha+'T'+(t.hora||'00:00')); return d>=hoy && t.estado!=='cancelado' })
    .sort((a,b) => new Date(a.fecha+'T'+a.hora)-new Date(b.fecha+'T'+b.hora))[0]
  const dolorHoy = historialDolor[0]

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:0 }}>
      {/* Próximo turno */}
      <div style={{ fontSize:10, letterSpacing:'1.5px', textTransform:'uppercase', color:c.muted, marginBottom:10, fontWeight:500 }}>Próximo turno</div>
      <div className="pp-card">
        {proximoTurno ? (() => {
          const d = new Date(proximoTurno.fecha+'T12:00')
          return (
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ borderRadius:11, width:46, height:46, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', flexShrink:0, background:c.sky }}>
                <span style={{ fontSize:18, fontWeight:500, lineHeight:1, color:'#fff' }}>{d.getDate()}</span>
                <span style={{ fontSize:8, letterSpacing:1, textTransform:'uppercase', color:'rgba(255,255,255,0.75)' }}>{meses[d.getMonth()]}</span>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:14, fontWeight:500, color:c.ink }}>Kinesiología</div>
                <div style={{ fontSize:12, color:c.muted, marginTop:2 }}>Lic. Augusto Ciuro · {proximoTurno.hora?.slice(0,5)} hs</div>
              </div>
              <div style={{ width:22, height:22, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(91,184,204,0.15)' }}>
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M2 1.5l3.5 3-3.5 3" stroke={c.skyDark} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
          )
        })() : (
          <div style={{ textAlign:'center', padding:'8px 0' }}>
            <div style={{ fontSize:14, fontWeight:500, color:c.ink }}>Sin turnos próximos</div>
            <div style={{ fontSize:12, color:c.muted, marginTop:4 }}>Cuando reserves una sesión, la verás acá</div>
          </div>
        )}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:12, paddingTop:10, borderTop:`0.5px solid ${c.border}` }}>
          <span style={{ fontSize:11, background:c.aquaLight, color:c.aquaDark, padding:'3px 10px', borderRadius:20 }}>
            {proximoTurno ? 'Confirmado' : 'Sin turnos'}
          </span>
          <button onClick={() => onTabChange('turnos')} style={{ fontSize:11, color:c.skyDark, fontWeight:500, background:'none', border:'none', cursor:'pointer', fontFamily:"'DM Sans', sans-serif" }}>
            {proximoTurno ? 'Ver todos' : 'Reservar'}
          </button>
        </div>
      </div>

      {/* Rutina */}
      <div style={{ fontSize:10, letterSpacing:'1.5px', textTransform:'uppercase', color:c.muted, marginBottom:10, fontWeight:500 }}>Rutina de hoy</div>
      {rutinas.filter(r => r.estado === 'Activa').length === 0 ? (
        <div className="pp-card">
          <div style={{ textAlign:'center', fontSize:13, color:c.muted, padding:'8px 0' }}>Tu kinesiólogo aún no asignó rutinas</div>
        </div>
      ) : (
        rutinas.filter(r => r.estado === 'Activa').slice(0,2).map(r => (
          <div key={r.id} className="pp-card" style={{ cursor:'pointer' }} onClick={() => onTabChange('rutinas')}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ borderRadius:11, width:46, height:46, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0, background:`linear-gradient(135deg,${c.aqua},${c.aquaDark})` }}>
                <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M5 11c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" strokeLinecap="round"/><path d="M8 15l3-8 3 8" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M9 13h4" stroke="rgba(255,255,255,0.9)" strokeWidth="1.5" strokeLinecap="round"/></svg>
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontSize:11, color:c.muted, marginBottom:2 }}>{r.motivo_sintoma || 'Rutina domiciliaria'}</div>
                <div style={{ fontSize:14, fontWeight:500, color:c.ink }}>{r.nombre}</div>
              </div>
              <div style={{ width:22, height:22, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(126,200,184,0.2)' }}>
                <svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M2 1.5l3.5 3-3.5 3" stroke={c.aquaDark} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
            </div>
          </div>
        ))
      )}

      {/* Seguimiento */}
      <div style={{ fontSize:10, letterSpacing:'1.5px', textTransform:'uppercase', color:c.muted, marginBottom:10, fontWeight:500 }}>Seguimiento</div>
      <div className="pp-grid-2">
        {/* Dolor */}
        <div className="pp-mini-card" onClick={onAbrirDolor} style={{ background:'#FFF5F8', border:'0.5px solid #F5B8C8', cursor:'pointer' }}>
          <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <div style={{ width:32, height:32, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', background:'#FFE8EF' }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2C5.2 2 3 4.2 3 7c0 3.5 5 8 5 8s5-4.5 5-8c0-2.8-2.2-5-5-5z" stroke="#D0446A" strokeWidth="1.2"/><circle cx="8" cy="7" r="1.5" fill="#D0446A"/></svg>
            </div>
            {dolorHoy && <span style={{ fontSize:9, background:c.aquaLight, color:c.aquaDark, padding:'2px 7px', borderRadius:10 }}>✓ Hoy</span>}
          </div>
          <div style={{ fontSize:13, fontWeight:500, color:'#A02050' }}>Dolor</div>
          {dolorHoy ? (
            <>
              <div style={{ display:'flex', gap:6 }}>
                <div style={{ flex:1, background:'#FFE8EF', borderRadius:8, padding:'5px 0', textAlign:'center' }}>
                  <div style={{ fontSize:9, color:'#C06080' }}>mañana</div>
                  <div style={{ fontSize:16, fontWeight:600, color:'#D0446A' }}>{dolorHoy.manana}</div>
                </div>
                <div style={{ flex:1, background:'#FFE8EF', borderRadius:8, padding:'5px 0', textAlign:'center' }}>
                  <div style={{ fontSize:9, color:'#C06080' }}>noche</div>
                  <div style={{ fontSize:16, fontWeight:600, color:'#D0446A' }}>{dolorHoy.noche}</div>
                </div>
              </div>
              <div style={{ paddingTop:6, borderTop:'0.5px solid #F5B8C8' }}>
                <span style={{ fontSize:10, color:'#D0446A' }}>Ver historial →</span>
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize:11, color:'#C06080', lineHeight:1.45 }}>Registrá cómo te sentiste hoy</div>
              <div style={{ paddingTop:6, borderTop:'0.5px solid #F5B8C8' }}>
                <span style={{ fontSize:10, color:'#D0446A', fontWeight:500 }}>+ Registrar →</span>
              </div>
            </>
          )}
        </div>

        {/* Saldo */}
        {saldo > 0 ? (
          <div className="pp-mini-card" style={{ border:`0.5px solid ${c.redBorder}` }}>
            <div style={{ width:32, height:32, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', background:c.redBg }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke={c.redText} strokeWidth="1.3"/><path d="M8 5.5v3" stroke={c.redText} strokeWidth="1.3" strokeLinecap="round"/><circle cx="8" cy="11" r="0.7" fill={c.redText}/></svg>
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:500, color:c.redText }}>${saldo}</div>
              <div style={{ fontSize:11, color:c.redSub }}>Saldo pendiente</div>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:8, borderTop:`0.5px solid #FAD0C4` }}>
              <span style={{ fontSize:10, padding:'2px 8px', borderRadius:10, background:c.redBg, color:c.redText }}>Pendiente</span>
              <button style={{ fontSize:11, color:c.redSub, fontWeight:500, background:'none', border:'none', cursor:'pointer', fontFamily:"'DM Sans', sans-serif" }}>Pagar</button>
            </div>
          </div>
        ) : (
          <div className="pp-mini-card">
            <div style={{ width:32, height:32, borderRadius:9, display:'flex', alignItems:'center', justifyContent:'center', background:c.aquaLight }}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8l4 4 6-6" stroke={c.aquaDark} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:500, color:c.aquaDark }}>Sin deuda</div>
              <div style={{ fontSize:11, color:c.muted }}>Al día</div>
            </div>
            <div style={{ paddingTop:8, borderTop:`0.5px solid ${c.border}` }}>
              <span style={{ fontSize:10, color:c.aquaDark }}>✓ Todo en orden</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/* ── SeccionTurnos ──────────────────────────────────────── */
function SeccionTurnos({ turnos, paciente }) {
  const [form, setForm]         = useState({ fecha:'', hora:'', notas:'' })
  const [enviando, setEnviando] = useState(false)
  const [exito, setExito]       = useState(false)
  const [error, setError]       = useState('')
  const hoyStr = new Date().toISOString().split('T')[0]
  const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
  const diasSemana = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb']
  const hoy = new Date(); hoy.setHours(0,0,0,0)
  const proximos = turnos.filter(t => { const d=new Date(t.fecha+'T12:00'); return d>=hoy && t.estado!=='cancelado' }).sort((a,b)=>new Date(a.fecha)-new Date(b.fecha))

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.fecha || !form.hora) { setError('Completá fecha y hora'); return }
    setEnviando(true)
    try {
      await api.createTurno({ paciente_id:paciente.id, fecha:form.fecha, hora:form.hora, duracion:45, motivo:form.notas||'Sesión kinesiología', estado:'pendiente', notas:form.notas })
      setExito(true); setForm({ fecha:'', hora:'', notas:'' }); setTimeout(() => setExito(false), 4000)
    } catch { setError('No se pudo enviar. Intentá de nuevo.') }
    finally { setEnviando(false) }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <h1 style={{ fontSize:22, fontFamily:"'DM Serif Display', serif", color:c.ink }}>Turnos</h1>
      {proximos.map(t => {
        const d = new Date(t.fecha+'T12:00')
        return (
          <div key={t.id} className="pp-card" style={{ display:'flex', gap:12, alignItems:'center' }}>
            <div style={{ background:c.sky, borderRadius:11, minWidth:46, height:50, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', color:'#fff', flexShrink:0 }}>
              <div style={{ fontSize:18, fontWeight:500, lineHeight:1 }}>{d.getDate()}</div>
              <div style={{ fontSize:8, letterSpacing:1 }}>{meses[d.getMonth()].toUpperCase()}</div>
            </div>
            <div style={{ flex:1, minWidth:0 }}>
              <div style={{ fontSize:14, fontWeight:500, color:c.ink }}>{diasSemana[d.getDay()]} · {t.hora?.slice(0,5)}</div>
              <div style={{ fontSize:12, color:c.muted, marginTop:2 }}>{t.motivo||'Sesión de kinesiología'}</div>
            </div>
            <span style={{ fontSize:11, background:c.aquaLight, color:c.aquaDark, padding:'3px 10px', borderRadius:20, whiteSpace:'nowrap' }}>Confirmado</span>
          </div>
        )
      })}
      <div className="pp-card">
        <h2 style={{ fontSize:15, fontWeight:500, color:c.ink, marginBottom:16 }}>Solicitar turno</h2>
        {exito ? (
          <div style={{ background:c.aquaLight, color:c.aquaDark, borderRadius:12, padding:'1rem', textAlign:'center', fontWeight:500 }}>✓ Solicitud enviada.</div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, marginBottom:10 }}>
              <div>
                <label style={{ fontSize:11, color:c.muted, display:'block', marginBottom:4 }}>Fecha</label>
                <input type="date" min={hoyStr} value={form.fecha} onChange={e=>setForm(f=>({...f,fecha:e.target.value}))}
                  style={{ width:'100%', border:`0.5px solid ${c.border}`, borderRadius:10, padding:'10px 11px', fontSize:13, color:c.ink, background:c.skyXlight, fontFamily:"'DM Sans', sans-serif" }} />
              </div>
              <div>
                <label style={{ fontSize:11, color:c.muted, display:'block', marginBottom:4 }}>Hora</label>
                <input type="time" value={form.hora} onChange={e=>setForm(f=>({...f,hora:e.target.value}))}
                  style={{ width:'100%', border:`0.5px solid ${c.border}`, borderRadius:10, padding:'10px 11px', fontSize:13, color:c.ink, background:c.skyXlight, fontFamily:"'DM Sans', sans-serif" }} />
              </div>
            </div>
            <textarea value={form.notas} onChange={e=>setForm(f=>({...f,notas:e.target.value}))} placeholder="Motivo (opcional)" rows={2}
              style={{ width:'100%', border:`0.5px solid ${c.border}`, borderRadius:10, padding:'10px 11px', fontSize:13, color:c.ink, resize:'none', fontFamily:"'DM Sans', sans-serif", background:c.skyXlight, marginBottom:10 }} />
            {error && <div style={{ color:c.redText, fontSize:12, marginBottom:8 }}>{error}</div>}
            <button type="submit" disabled={enviando}
              style={{ width:'100%', background:`linear-gradient(135deg,${c.sky},${c.skyDark})`, color:'#fff', border:'none', borderRadius:12, padding:'13px', fontWeight:500, fontSize:14, cursor:'pointer', fontFamily:"'DM Sans', sans-serif" }}>
              {enviando ? 'Enviando...' : 'Solicitar turno'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

/* ── RutinaCard ─────────────────────────────────────────── */
function RutinaCard({ rutina }) {
  const [done, setDone] = useState({})
  const [ejOpen, setEjOpen] = useState({})
  const [libresHecho, setLibresHecho] = useState(false)
  const [expanded, setExpanded] = useState(true)
  const [vecesCompletadas, setVecesCompletadas] = useState(0)

  const ejs = rutina.ejercicios || []
  const tieneLibres = !!rutina.ejercicios_libres
  const totalVeces = rutina.veces || 1
  const completados = ejs.filter((_, i) => done[i]).length
  const ejsCompletos = ejs.length === 0 || completados === ejs.length
  const todoHecho = ejsCompletos && (!tieneLibres || libresHecho)
  const rutinaFinalizada = vecesCompletadas >= totalVeces

  function marcarVuelta() {
    setVecesCompletadas(v => v + 1)
    setDone({})
    setLibresHecho(false)
  }

  return (
    <div className="pp-card" style={{ padding:0, overflow:'hidden' }}>
      {/* Header */}
      <div style={{ background:`linear-gradient(135deg,${c.skyXlight},${c.white})`, padding:'16px 18px', borderBottom:`0.5px solid ${c.border}` }}>
        <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', gap:12 }}>
          <div style={{ flex:1 }}>
            <p style={{ fontSize:10, fontWeight:500, color:c.aquaDark, textTransform:'uppercase', letterSpacing:'0.07em', margin:0 }}>
              {rutina.motivo_sintoma || 'Rutina domiciliaria'}
            </p>
            <h2 style={{ fontSize:17, fontWeight:500, color:c.ink, margin:'5px 0 0', lineHeight:1.2, fontFamily:"'DM Serif Display', serif" }}>{rutina.nombre}</h2>
            {rutina.notas && <p style={{ fontSize:12, color:c.muted, marginTop:5, marginBottom:0, lineHeight:1.5 }}>{rutina.notas}</p>}
          </div>
          <button onClick={() => setExpanded(v => !v)}
            style={{ background:'none', border:'none', cursor:'pointer', color:c.muted, fontSize:18, padding:'2px', flexShrink:0 }}>
            {expanded ? '▴' : '▾'}
          </button>
        </div>

        {totalVeces > 1 && (
          <div style={{ marginTop:12 }}>
            <p style={{ fontSize:10, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.07em', color: rutinaFinalizada ? c.aquaDark : c.muted, margin:'0 0 8px' }}>
              {rutinaFinalizada ? '¡Completaste todas las vueltas! 🎉' : `Vueltas — ${vecesCompletadas}/${totalVeces}`}
            </p>
            <div style={{ display:'flex', gap:7, flexWrap:'wrap' }}>
              {Array.from({ length: totalVeces }).map((_, i) => (
                <div key={i} style={{
                  width:34, height:34, borderRadius:'50%',
                  background: i < vecesCompletadas ? c.aquaDark : c.white,
                  border: `1.5px solid ${i < vecesCompletadas ? c.aquaDark : c.border}`,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:13, color:'#fff', fontWeight:600,
                  transition:'all 0.2s',
                }}>
                  {i < vecesCompletadas ? '✓' : <span style={{ color:c.muted, fontSize:12, fontWeight:500 }}>{i+1}</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {(ejs.length > 0 || tieneLibres) && (
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8, marginTop:12 }}>
            {[
              ['Total', ejs.length + (tieneLibres ? 1 : 0)],
              ['Hechos', completados + (libresHecho ? 1 : 0)],
              ['Pendientes', (ejs.length - completados) + (!libresHecho && tieneLibres ? 1 : 0)],
            ].map(([label, val]) => (
              <div key={label} style={{ borderRadius:11, background:c.white, padding:'9px', textAlign:'center', border:`0.5px solid ${c.border}` }}>
                <p style={{ fontSize:9, textTransform:'uppercase', letterSpacing:'0.06em', color:c.muted, margin:0 }}>{label}</p>
                <p style={{ fontSize:17, fontWeight:600, color:c.ink, margin:'3px 0 0' }}>{val}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Ejercicios */}
      {expanded && (
        <div style={{ padding:'12px 14px', display:'flex', flexDirection:'column', gap:8 }}>
          {ejs.map((ej, i) => {
            const hecho = !!done[i]
            const abierto = !!ejOpen[i]
            const pills = [
              ej.series && ['Series', ej.series],
              ej.reps && ej.reps !== 'No aplica' && ['Reps', ej.reps],
              ej.seconds && ej.seconds !== 'No aplica' && ['Seg.', ej.seconds],
              ej.peso && ['Peso', ej.peso],
            ].filter(Boolean)
            return (
              <div key={i} style={{ borderRadius:14, border:`0.5px solid ${hecho ? c.aquaDark : c.border}`, background: hecho ? c.aquaLight : c.white, overflow:'hidden', transition:'border-color 0.2s' }}>
                {/* Fila principal */}
                <div style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 13px', cursor:'pointer' }}
                  onClick={() => setEjOpen(prev => ({ ...prev, [i]: !prev[i] }))}>
                  <button
                    onClick={e => { e.stopPropagation(); setDone(prev => ({ ...prev, [i]: !prev[i] })) }}
                    style={{
                      width:24, height:24, borderRadius:'50%', flexShrink:0,
                      border:`1.5px solid ${hecho ? c.aquaDark : c.border}`,
                      background: hecho ? c.aquaDark : c.white, color:'#fff',
                      fontSize:12, fontWeight:700, cursor:'pointer',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontFamily:"'DM Sans', sans-serif",
                    }}>
                    {hecho ? '✓' : ''}
                  </button>
                  <div style={{ flex:1, minWidth:0 }}>
                    <p style={{ fontWeight:500, fontSize:13, color: hecho ? c.aquaDark : c.ink, margin:0, textDecoration: hecho ? 'line-through' : 'none', lineHeight:1.3 }}>{ej.exerciseId}</p>
                    {pills.length > 0 && (
                      <div style={{ display:'flex', gap:5, marginTop:5, flexWrap:'wrap' }}>
                        {pills.map(([label, val]) => (
                          <span key={label} style={{ fontSize:10, background:c.skyXlight, border:`0.5px solid ${c.border}`, borderRadius:7, padding:'2px 7px', color:c.ink2 }}>
                            <span style={{ color:c.muted }}>{label} </span>{val}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ flexShrink:0, transform: abierto ? 'rotate(180deg)' : 'none', transition:'transform 0.2s', opacity:0.4 }}>
                    <path d="M2 4.5l5 5 5-5" stroke={c.ink} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>

                {/* Detalle expandido: fotos */}
                {abierto && ej.images && ej.images[0] && (
                  <div style={{ padding:'0 13px 13px', borderTop:`0.5px solid ${hecho ? c.aquaDark : c.border}` }}>
                    <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginTop:10 }}>
                      <img src={ej.images[0]} alt={ej.exerciseId + ' A'} style={{ width:'100%', aspectRatio:'1/1', objectFit:'contain', borderRadius:11, border:`0.5px solid ${c.border}`, background:c.skyXlight, padding:4 }} loading="lazy" />
                      {ej.images[1] && <img src={ej.images[1]} alt={ej.exerciseId + ' B'} style={{ width:'100%', aspectRatio:'1/1', objectFit:'contain', borderRadius:11, border:`0.5px solid ${c.border}`, background:c.skyXlight, padding:4 }} loading="lazy" />}
                    </div>
                  </div>
                )}
                {abierto && !(ej.images && ej.images[0]) && (
                  <div style={{ padding:'8px 13px 12px', borderTop:`0.5px solid ${c.border}`, fontSize:12, color:c.muted, fontStyle:'italic' }}>Sin imagen disponible</div>
                )}
              </div>
            )
          })}

          {/* Ejercicios adicionales escritos (Claude) */}
          {tieneLibres && (
            <div onClick={() => !rutinaFinalizada && setLibresHecho(v => !v)}
              style={{ borderRadius:14, background: libresHecho ? c.aquaLight : c.white, border: `0.5px solid ${libresHecho ? c.aquaDark : c.border}`, padding:14, cursor: rutinaFinalizada ? 'default' : 'pointer', transition:'all 0.2s' }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                <div style={{
                  width:24, height:24, borderRadius:'50%', flexShrink:0,
                  border:`1.5px solid ${libresHecho ? c.aquaDark : c.border}`,
                  background: libresHecho ? c.aquaDark : c.white,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:12, fontWeight:700, color:'#fff',
                }}>
                  {libresHecho ? '✓' : ''}
                </div>
                <p style={{ fontSize:10, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.06em', color: libresHecho ? c.aquaDark : c.muted, margin:0 }}>Ejercicios adicionales</p>
              </div>
              <p style={{ fontSize:13, color: libresHecho ? c.aquaDark : c.ink2, margin:0, lineHeight:1.7, whiteSpace:'pre-wrap', textDecoration: libresHecho ? 'line-through' : 'none', opacity: libresHecho ? 0.7 : 1 }}>{rutina.ejercicios_libres}</p>
            </div>
          )}

          {/* Agentes físicos */}
          {(rutina.hielo || rutina.calor || rutina.contraste) && (
            <div style={{ borderRadius:13, background:c.skyXlight, border:`0.5px solid ${c.border}`, padding:13 }}>
              <p style={{ fontSize:10, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.06em', color:c.muted, margin:'0 0 9px' }}>Agentes físicos</p>
              <div style={{ display:'flex', flexWrap:'wrap', gap:7 }}>
                {rutina.hielo && <span style={{ borderRadius:100, background:c.skyLight, color:c.skyDark, fontSize:12, fontWeight:500, padding:'5px 12px' }}>Hielo {rutina.hielo.min} min · {rutina.hielo.vecesAlDia}x/día</span>}
                {rutina.calor && <span style={{ borderRadius:100, background:'#FFF8D6', color:'#7A5C00', fontSize:12, fontWeight:500, padding:'5px 12px' }}>Calor {rutina.calor.min} min · {rutina.calor.vecesAlDia}x/día</span>}
                {rutina.contraste && <span style={{ borderRadius:100, background:c.skyXlight, color:c.ink2, fontSize:12, fontWeight:500, padding:'5px 12px' }}>Contraste · {rutina.contraste.vecesAlDia}x/día</span>}
              </div>
            </div>
          )}

          {todoHecho && !rutinaFinalizada && (
            <div style={{ background:c.aquaLight, border:`0.5px solid ${c.aquaDark}`, borderRadius:14, padding:'15px', textAlign:'center' }}>
              <p style={{ color:c.aquaDark, fontWeight:500, fontSize:14, margin:'0 0 10px' }}>
                ¡Excelente! Completaste todos los ejercicios 💪
              </p>
              <button onClick={marcarVuelta} style={{
                background:c.aquaDark, color:'#fff', border:'none', borderRadius:11,
                padding:'10px 24px', fontWeight:500, fontSize:13, cursor:'pointer',
                fontFamily:"'DM Sans', sans-serif",
              }}>
                Marcar vuelta {vecesCompletadas + 1} de {totalVeces}
              </button>
            </div>
          )}
          {rutinaFinalizada && (
            <div style={{ background:c.aquaLight, border:`0.5px solid ${c.aquaDark}`, borderRadius:14, padding:'15px', textAlign:'center' }}>
              <p style={{ fontSize:22, margin:'0 0 4px' }}>🎉</p>
              <p style={{ color:c.aquaDark, fontWeight:500, fontSize:14, margin:0 }}>
                ¡Completaste todas las {totalVeces} vueltas!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/* ── SeccionRutinas ─────────────────────────────────────── */
function SeccionRutinas({ rutinas }) {
  const activas   = rutinas.filter(r => r.estado === 'Activa')
  const inactivas = rutinas.filter(r => r.estado !== 'Activa')

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <h1 style={{ fontSize:22, fontFamily:"'DM Serif Display', serif", color:c.ink }}>Mis rutinas</h1>

      {rutinas.length === 0 ? (
        <div className="pp-card" style={{ textAlign:'center', color:c.muted, fontSize:13, padding:'2.5rem' }}>
          Tu kinesiólogo aún no asignó rutinas
        </div>
      ) : (
        <>
          {activas.length > 0 && (
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ width:7, height:7, borderRadius:'50%', background:c.aquaDark, display:'inline-block' }} />
                <span style={{ fontSize:10, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.07em', color:c.aquaDark }}>Activas ({activas.length})</span>
              </div>
              {activas.map(r => <RutinaCard key={r.id} rutina={r} />)}
            </div>
          )}

          {inactivas.length > 0 && (
            <div style={{ display:'flex', flexDirection:'column', gap:12, marginTop:8 }}>
              <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                <span style={{ width:7, height:7, borderRadius:'50%', background:c.muted, display:'inline-block' }} />
                <span style={{ fontSize:10, fontWeight:500, textTransform:'uppercase', letterSpacing:'0.07em', color:c.muted }}>Anteriores ({inactivas.length})</span>
              </div>
              {inactivas.map(r => (
                <div key={r.id} className="pp-card" style={{ opacity:0.7 }}>
                  <p style={{ fontWeight:500, fontSize:13, color:c.ink2, margin:0 }}>{r.nombre}</p>
                  {r.resumen && <p style={{ fontSize:12, color:c.muted, marginTop:4, marginBottom:0 }}>{r.resumen}</p>}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}

/* ── SeccionPerfil ──────────────────────────────────────── */
function SeccionPerfil({ paciente, usuario, onLogout }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
      <h1 style={{ fontSize:22, fontFamily:"'DM Serif Display', serif", color:c.ink }}>Perfil</h1>
      <div className="pp-card" style={{ textAlign:'center', padding:'1.5rem' }}>
        <div style={{ width:64, height:64, borderRadius:'50%', background:`linear-gradient(135deg,${c.sky},${c.skyDark})`, color:'#fff', fontSize:20, fontWeight:500, display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 12px', fontFamily:"'DM Serif Display', serif" }}>
          {paciente.nombre[0]}{paciente.apellido[0]}
        </div>
        <div style={{ fontSize:18, fontWeight:500, color:c.ink, fontFamily:"'DM Serif Display', serif" }}>{paciente.nombre} {paciente.apellido}</div>
        <div style={{ fontSize:12, color:c.muted, marginTop:4 }}>{usuario?.email}</div>
      </div>
      {paciente.celular && (
        <div className="pp-card">
          <div style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'1px', color:c.muted, marginBottom:6 }}>Celular</div>
          <div style={{ fontSize:15, color:c.ink }}>{paciente.celular}</div>
        </div>
      )}
      <div className="pp-card">
        <div style={{ fontSize:10, textTransform:'uppercase', letterSpacing:'1px', color:c.muted, marginBottom:12 }}>Accesos rápidos</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          {['Estudios','Recetas','Pagos','Ayuda'].map(item => (
            <button key={item} style={{ borderRadius:11, border:`0.5px solid ${c.border}`, padding:'13px', textAlign:'left', fontSize:13, fontWeight:400, color:c.ink2, background:c.skyXlight, cursor:'pointer', fontFamily:"'DM Sans', sans-serif" }}>
              {item}
            </button>
          ))}
        </div>
      </div>
      <button onClick={onLogout} style={{ width:'100%', background:'none', border:`0.5px solid ${c.border}`, borderRadius:13, padding:'13px', color:c.muted, fontWeight:400, fontSize:13, cursor:'pointer', fontFamily:"'DM Sans', sans-serif" }}>
        Cerrar sesión
      </button>
    </div>
  )
}

/* ── Portal principal ────────────────────────────────────── */
export default function PortalPaciente({ paciente, usuario, onLogout }) {
  const [tab,            setTab]            = useState('inicio')
  const [ejercicios,     setEjercicios]     = useState([])
  const [rutinas,        setRutinas]        = useState([])
  const [turnos,         setTurnos]         = useState([])
  const [motivos,        setMotivos]        = useState([])
  const [saldo,          setSaldo]          = useState(0)
  const [loading,        setLoading]        = useState(true)
  const [seleccionado,   setSeleccionado]   = useState(null)
  const [modalDolor,     setModalDolor]     = useState(false)
  const [historialDolor, setHistorialDolor] = useState(INITIAL_HISTORY)

  useEffect(() => {
    if (!paciente) return
    setLoading(true)
    Promise.all([
      api.getEjerciciosGimnasio(paciente.id).then(d => setEjercicios(d?.ejercicios||[])).catch(()=>{}),
      api.getSaldo(paciente.id).then(s => setSaldo(s.saldo_pendiente||0)).catch(()=>{}),
      api.getTurnos().then(ts => setTurnos(ts||[])).catch(()=>{}),
      api.getMotivos(paciente.id).then(setMotivos).catch(()=>{}),
      api.getRutinasPaciente(paciente.id).then(setRutinas).catch(()=>{}),
    ]).finally(() => setLoading(false))
  }, [paciente?.id])

  if (!paciente) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', minHeight:'100vh', background:c.bg, gap:12, padding:'2rem' }}>
      <div style={{ fontSize:40 }}>🏥</div>
      <p style={{ color:c.muted, textAlign:'center', fontFamily:"'DM Sans', sans-serif" }}>Tu cuenta aún no está vinculada a un paciente.<br />Consultá con tu kinesiólogo.</p>
    </div>
  )

  if (seleccionado) {
    const ej = ejercicios.find(e => e.id === seleccionado)
    if (ej) return (
      <div style={{ background:c.bg, minHeight:'100vh' }}>
        <style>{globalStyle}</style>
        <EjercicioDetalle ej={ej} onVolver={() => setSeleccionado(null)} />
      </div>
    )
  }

  const tieneDeuda = saldo > 0

  const navItems = [
    { id:'inicio',  label:'Inicio',
      icon: (a) => <svg width="20" height="20" viewBox="0 0 22 22" fill="none"><path d="M3 11L11 4l8 7" stroke={a ? c.skyDark : 'rgba(13,53,64,0.35)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 9v9h4v-4h2v4h4V9" stroke={a ? c.skyDark : 'rgba(13,53,64,0.35)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
    { id:'turnos',  label:'Turnos',
      icon: (a) => <svg width="20" height="20" viewBox="0 0 22 22" fill="none"><rect x="3" y="5" width="16" height="14" rx="2" stroke={a ? c.skyDark : 'rgba(13,53,64,0.35)'} strokeWidth="1.5"/><path d="M7 5V3M15 5V3M3 9h16" stroke={a ? c.skyDark : 'rgba(13,53,64,0.35)'} strokeWidth="1.5" strokeLinecap="round"/></svg> },
    { id:'rutinas', label:'Rutinas',
      icon: (a) => <svg width="20" height="20" viewBox="0 0 22 22" fill="none"><path d="M4 6h14M4 11h9M4 16h7" stroke={a ? c.skyDark : 'rgba(13,53,64,0.35)'} strokeWidth="1.5" strokeLinecap="round"/></svg> },
    { id:'perfil',  label:'Perfil',
      icon: (a) => <svg width="20" height="20" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="7" r="4" stroke={a ? c.skyDark : 'rgba(13,53,64,0.35)'} strokeWidth="1.5"/><path d="M4 19c0-3.9 3.1-7 7-7s7 3.1 7 7" stroke={a ? c.skyDark : 'rgba(13,53,64,0.35)'} strokeWidth="1.5" strokeLinecap="round"/></svg> },
  ]

  return (
    <div className="pac-shell">
      <style>{globalStyle}</style>
      {tieneDeuda && !loading && <DeudaOverlay saldo={saldo} />}
      {modalDolor && <ModalDolor onClose={() => setModalDolor(false)} historia={historialDolor} onGuardar={r => setHistorialDolor(prev => [r,...prev])} />}

      <div className="pac-content">
        {/* Topbar */}
        <header className="pac-hero">
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
          <div style={{ display:'flex', alignItems:'center', gap:9 }}>
            <LogoSVG />
            <span style={{ color:'#FFFFFF', fontSize:21, fontWeight:900, letterSpacing:'-.04em' }}>KinePlus</span>
          </div>
          <button aria-label="Notificaciones" style={{ width:40, height:40, borderRadius:'50%', background:'rgba(255,255,255,.12)', border:'1px solid rgba(255,255,255,.28)', display:'flex', alignItems:'center', justifyContent:'center', cursor:'pointer' }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2a5 5 0 0 1 5 5v3l1.5 2.5H2.5L4 10V7A5 5 0 0 1 9 2z" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round"/><path d="M7 14.5a2 2 0 0 0 4 0" stroke="#FFFFFF" strokeWidth="1.4" strokeLinecap="round"/></svg>
          </button>
          </div>

          {/* Greeting */}
          <div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,.75)', letterSpacing:'1.2px', textTransform:'uppercase', marginBottom:5, fontWeight:700 }}>{formatDateLong()}</div>
            <div style={{ fontFamily:"'DM Sans', sans-serif", fontWeight:900, fontSize:30, color:'#FFFFFF', lineHeight:1.12 }}>Hola, {paciente.nombre}</div>
            <div style={{ marginTop:6, color:'rgba(255,255,255,.78)', fontSize:16 }}>Tu recuperación, paso a paso.</div>
          </div>
        </header>

        {loading ? (
          <div style={{ textAlign:'center', color:c.muted, padding:'3rem', fontFamily:"'DM Sans', sans-serif" }}>Cargando…</div>
        ) : (
          <>
            {tab==='inicio'  && <SeccionInicio paciente={paciente} rutinas={rutinas} turnos={turnos} saldo={saldo} onAbrirDolor={() => setModalDolor(true)} historialDolor={historialDolor} onTabChange={setTab} />}
            {tab==='turnos'  && <SeccionTurnos turnos={turnos} paciente={paciente} />}
            {tab==='rutinas' && <SeccionRutinas rutinas={rutinas} />}
            {tab==='perfil'  && <SeccionPerfil paciente={paciente} usuario={usuario} onLogout={onLogout} />}
          </>
        )}
      </div>

      {/* Bottom nav flotante */}
      <nav className="bottom-nav">
        {navItems.map(item => {
          const active = tab === item.id
          return (
            <button key={item.id} className="nav-btn" onClick={() => setTab(item.id)}>
              {item.icon(active)}
              <span className="nav-label" style={{ color: active ? c.skyDark : 'rgba(13,53,64,0.45)' }}>{item.label}</span>
              {active && <div className="nav-dot" />}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
