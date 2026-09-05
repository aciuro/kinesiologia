import { useEffect, useState } from 'react'
import { api } from './api.js'

const c = {
  bg: '#081521', white: '#112433', sky: '#38C5CB', skyDark: '#8BE9E8',
  skyLight: 'rgba(56,197,203,.14)', skyXlight: '#0D1D2B', aqua: '#56D3B1', aquaDark: '#91E8D0',
  aquaLight: 'rgba(86,211,177,.14)', ink: '#F2F7FB', ink2: '#C5D4DE', muted: '#829AAD',
  border: 'rgba(148,184,204,.16)',
  redBg: 'rgba(242,139,130,.12)', redBorder: 'rgba(242,139,130,.32)', redText: '#FFB0A8', redSub: '#F28B82',
}

const CAT = {
  Friend:     { bg: 'linear-gradient(135deg,#E8F5E9,#C8E6C9)', color: '#2E7D32', border: '#A5D6A7', dot: '#43A047' },
  Clic:       { bg: 'linear-gradient(135deg,#E3F2FD,#BBDEFB)', color: '#1565C0', border: '#90CAF9', dot: '#1E88E5' },
  Particular: { bg: 'linear-gradient(135deg,#F3E5F5,#E1BEE7)', color: '#6A1B9A', border: '#CE93D8', dot: '#8E24AA' },
}

function CatBadge({ cat }) {
  const cfg = CAT[cat] || CAT.Particular
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px 2px 6px', borderRadius: 20, border: `0.5px solid ${cfg.border}`, background: cfg.bg, fontSize: 10, fontWeight: 500, color: cfg.color, fontFamily: "'DM Sans', sans-serif", whiteSpace: 'nowrap' }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.dot }} />{cat}
    </span>
  )
}

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function formatFecha(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr + 'T12:00')
  const meses = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic']
  return `${d.getDate()} ${meses[d.getMonth()]}`
}

export default function Cuenta() {
  const [tab, setTab]             = useState('saldos')
  const [saldos, setSaldos]       = useState([])
  const [ingresos, setIngresos]   = useState([])
  const [egresos, setEgresos]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [showAddIngreso, setShowAddIngreso] = useState(false)
  const [showAddEgreso,  setShowAddEgreso]  = useState(false)
  const [newDesc,  setNewDesc]    = useState('')
  const [newMonto, setNewMonto]   = useState('')
  const [newFecha, setNewFecha]   = useState(todayISO)

  useEffect(() => {
    Promise.all([
      api.getSaldosTodos(),
      api.getMovimientos('ingreso'),
      api.getMovimientos('egreso'),
    ]).then(([s, ing, egr]) => {
      setSaldos(s)
      setIngresos(ing)
      setEgresos(egr)
    }).finally(() => setLoading(false))
  }, [])

  const totalIngresos = ingresos.reduce((a, i) => a + i.monto, 0)
  const totalEgresos  = egresos.reduce((a, e) => a + e.monto, 0)
  const balance       = totalIngresos - totalEgresos
  const totalDeuda    = saldos.reduce((a, s) => a + s.saldo_pendiente, 0)

  async function cobrar(pacienteId) {
    await api.pagarSaldoPaciente(pacienteId)
    const nuevos = await api.getSaldosTodos()
    setSaldos(nuevos)
    const nuevosIng = await api.getMovimientos('ingreso')
    setIngresos(nuevosIng)
  }

  async function addMovimiento(tipo) {
    if (!newDesc.trim() || !newMonto) return
    const mov = await api.createMovimiento({
      tipo,
      descripcion: newDesc.trim(),
      monto: parseFloat(newMonto),
      fecha: newFecha,
    })
    if (tipo === 'ingreso') { setIngresos(p => [mov, ...p]); setShowAddIngreso(false) }
    else                    { setEgresos(p => [mov, ...p]);  setShowAddEgreso(false) }
    setNewDesc(''); setNewMonto(''); setNewFecha(todayISO())
  }

  async function deleteMov(id, tipo) {
    await api.deleteMovimiento(id)
    if (tipo === 'ingreso') setIngresos(p => p.filter(x => x.id !== id))
    else                    setEgresos(p => p.filter(x => x.id !== id))
  }

  const tabs = [
    { id: 'saldos',   label: 'Saldos' },
    { id: 'ingresos', label: 'Ingresos' },
    { id: 'egresos',  label: 'Egresos' },
  ]

  if (loading) return <div style={{ textAlign: 'center', color: c.muted, fontSize: 13, padding: '40px 0' }}>Cargando…</div>

  return (
    <div>
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 10, color: c.muted, letterSpacing: '1.2px', textTransform: 'uppercase', marginBottom: 3 }}>Panel profesional</div>
        <div style={{ fontFamily: "'DM Serif Display', serif", fontSize: 22, color: c.ink }}>Estado de cuenta</div>
      </div>

      {/* Resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 20 }}>
        <div style={{ background: `linear-gradient(135deg,${c.aquaLight},#C8EDE5)`, border: `0.5px solid #A8DDD5`, borderRadius: 16, padding: '15px 14px' }}>
          <div style={{ fontSize: 9, color: c.aquaDark, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 5 }}>Ingresos</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: c.aquaDark, lineHeight: 1 }}>${totalIngresos.toLocaleString()}</div>
          <div style={{ fontSize: 9, color: c.aquaDark, marginTop: 3 }}>{ingresos.length} mov.</div>
        </div>
        <div style={{ background: `linear-gradient(135deg,${c.redBg},#FDE8E4)`, border: `0.5px solid ${c.redBorder}`, borderRadius: 16, padding: '15px 14px' }}>
          <div style={{ fontSize: 9, color: c.redSub, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 5 }}>Egresos</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: c.redText, lineHeight: 1 }}>${totalEgresos.toLocaleString()}</div>
          <div style={{ fontSize: 9, color: c.redSub, marginTop: 3 }}>{egresos.length} mov.</div>
        </div>
        <div style={{ background: balance >= 0 ? `linear-gradient(135deg,${c.skyLight},${c.skyXlight})` : `linear-gradient(135deg,${c.redBg},#FDE8E4)`, border: `0.5px solid ${balance >= 0 ? c.border : c.redBorder}`, borderRadius: 16, padding: '15px 14px' }}>
          <div style={{ fontSize: 9, color: balance >= 0 ? c.skyDark : c.redText, textTransform: 'uppercase', letterSpacing: '0.8px', marginBottom: 5 }}>Balance</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: balance >= 0 ? c.skyDark : c.redText, lineHeight: 1 }}>${Math.abs(balance).toLocaleString()}</div>
          <div style={{ fontSize: 9, color: c.muted, marginTop: 3 }}>{balance >= 0 ? 'Positivo ✓' : 'Negativo'}</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', background: c.skyXlight, borderRadius: 12, padding: 3, marginBottom: 18 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{ flex: 1, padding: '8px 4px', borderRadius: 10, border: 'none', cursor: 'pointer', background: tab === t.id ? c.white : 'transparent', color: tab === t.id ? c.skyDark : c.muted, fontSize: 12, fontWeight: tab === t.id ? 500 : 400, fontFamily: "'DM Sans', sans-serif", boxShadow: tab === t.id ? '0 1px 4px rgba(13,53,64,0.08)' : 'none', transition: 'all 0.15s' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Saldos */}
      {tab === 'saldos' && (
        <div>
          {saldos.length === 0 && <div style={{ textAlign: 'center', color: c.muted, fontSize: 13, paddingTop: 20 }}>Sin saldos pendientes</div>}
          {saldos.length > 0 && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <div style={{ fontSize: 10, letterSpacing: '1.2px', textTransform: 'uppercase', color: c.redSub, fontWeight: 500 }}>Pendientes · ${totalDeuda.toLocaleString()}</div>
                <div style={{ flex: 1, height: '0.5px', background: c.redBorder }} />
              </div>
              {saldos.map(s => (
                <div key={s.id} style={{ background: c.white, borderRadius: 15, border: `0.5px solid ${c.redBorder}`, padding: '14px 16px', marginBottom: 9, display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: `linear-gradient(135deg,${c.redBg},#FDDDD8)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 16, fontWeight: 600, color: c.redText }}>{(s.nombre || '?').charAt(0)}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 13, fontWeight: 500, color: c.ink }}>{s.nombre} {s.apellido}</span>
                      {s.tipo && <CatBadge cat={s.tipo} />}
                    </div>
                    <div style={{ fontSize: 11, color: c.redSub }}>{s.sesiones_pendientes} sesión{s.sesiones_pendientes !== 1 ? 'es' : ''} sin cobrar</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 17, fontWeight: 700, color: c.redText }}>${s.saldo_pendiente.toLocaleString()}</div>
                    <button onClick={() => cobrar(s.id)}
                      style={{ fontSize: 10, color: c.aquaDark, background: c.aquaLight, border: 'none', borderRadius: 8, padding: '3px 8px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500, marginTop: 4 }}>✓ Cobrado</button>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      )}

      {/* Ingresos */}
      {tab === 'ingresos' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 10, letterSpacing: '1.2px', textTransform: 'uppercase', color: c.aquaDark, fontWeight: 500 }}>Total: ${totalIngresos.toLocaleString()}</div>
            <button onClick={() => setShowAddIngreso(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 10, border: 'none', background: c.aqua, color: '#fff', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
              <svg width="11" height="11" viewBox="0 0 13 13" fill="none"><path d="M6.5 1v11M1 6.5h11" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/></svg>
              Agregar
            </button>
          </div>
          {showAddIngreso && (
            <div style={{ background: c.aquaLight, borderRadius: 13, border: `0.5px solid #A8DDD5`, padding: '13px 14px', marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Descripción" style={{ padding: '8px 11px', borderRadius: 9, border: `0.5px solid #A8DDD5`, background: c.white, fontSize: 12, color: c.ink, fontFamily: "'DM Sans', sans-serif" }} />
              <input value={newMonto} onChange={e => setNewMonto(e.target.value)} placeholder="Monto $" type="number" style={{ padding: '8px 11px', borderRadius: 9, border: `0.5px solid #A8DDD5`, background: c.white, fontSize: 12, color: c.ink, fontFamily: "'DM Sans', sans-serif" }} />
              <input value={newFecha} onChange={e => setNewFecha(e.target.value)} type="date" style={{ padding: '8px 11px', borderRadius: 9, border: `0.5px solid #A8DDD5`, background: c.white, fontSize: 12, color: c.ink, fontFamily: "'DM Sans', sans-serif" }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => addMovimiento('ingreso')} style={{ flex: 1, padding: '8px 0', borderRadius: 9, border: 'none', background: c.aquaDark, color: '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Guardar</button>
                <button onClick={() => setShowAddIngreso(false)} style={{ padding: '8px 14px', borderRadius: 9, border: 'none', background: 'rgba(0,0,0,0.05)', color: c.muted, fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Cancelar</button>
              </div>
            </div>
          )}
          {ingresos.length === 0 && <div style={{ textAlign: 'center', color: c.muted, fontSize: 13, paddingTop: 16 }}>Sin ingresos registrados</div>}
          {ingresos.map(item => (
            <div key={item.id} style={{ background: c.white, borderRadius: 13, border: `0.5px solid ${c.border}`, padding: '12px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: c.aquaLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M5 6l3-3 3 3" stroke={c.aquaDark} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: c.ink, marginBottom: 2 }}>{item.descripcion}</div>
                <div style={{ fontSize: 11, color: c.muted }}>{formatFecha(item.fecha)}</div>
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: c.aquaDark }}>+${item.monto.toLocaleString()}</span>
              <button onClick={() => deleteMov(item.id, 'ingreso')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.muted, padding: '4px', display: 'flex', alignItems: 'center' }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke={c.muted} strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Egresos */}
      {tab === 'egresos' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 10, letterSpacing: '1.2px', textTransform: 'uppercase', color: c.redSub, fontWeight: 500 }}>Total: ${totalEgresos.toLocaleString()}</div>
            <button onClick={() => setShowAddEgreso(true)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 10, border: 'none', background: c.redSub, color: '#fff', fontSize: 11, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>
              <svg width="11" height="11" viewBox="0 0 13 13" fill="none"><path d="M6.5 1v11M1 6.5h11" stroke="#fff" strokeWidth="1.5" strokeLinecap="round"/></svg>
              Agregar
            </button>
          </div>
          {showAddEgreso && (
            <div style={{ background: c.redBg, borderRadius: 13, border: `0.5px solid ${c.redBorder}`, padding: '13px 14px', marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input value={newDesc} onChange={e => setNewDesc(e.target.value)} placeholder="Descripción" style={{ padding: '8px 11px', borderRadius: 9, border: `0.5px solid ${c.redBorder}`, background: c.white, fontSize: 12, color: c.ink, fontFamily: "'DM Sans', sans-serif" }} />
              <input value={newMonto} onChange={e => setNewMonto(e.target.value)} placeholder="Monto $" type="number" style={{ padding: '8px 11px', borderRadius: 9, border: `0.5px solid ${c.redBorder}`, background: c.white, fontSize: 12, color: c.ink, fontFamily: "'DM Sans', sans-serif" }} />
              <input value={newFecha} onChange={e => setNewFecha(e.target.value)} type="date" style={{ padding: '8px 11px', borderRadius: 9, border: `0.5px solid ${c.redBorder}`, background: c.white, fontSize: 12, color: c.ink, fontFamily: "'DM Sans', sans-serif" }} />
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => addMovimiento('egreso')} style={{ flex: 1, padding: '8px 0', borderRadius: 9, border: 'none', background: c.redText, color: '#fff', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Guardar</button>
                <button onClick={() => setShowAddEgreso(false)} style={{ padding: '8px 14px', borderRadius: 9, border: 'none', background: 'rgba(0,0,0,0.05)', color: c.muted, fontSize: 12, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif" }}>Cancelar</button>
              </div>
            </div>
          )}
          {egresos.length === 0 && <div style={{ textAlign: 'center', color: c.muted, fontSize: 13, paddingTop: 16 }}>Sin egresos registrados</div>}
          {egresos.map(item => (
            <div key={item.id} style={{ background: c.white, borderRadius: 13, border: `0.5px solid ${c.border}`, padding: '12px 14px', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: c.redBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M5 10l3 3 3-3" stroke={c.redText} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: c.ink, marginBottom: 2 }}>{item.descripcion}</div>
                <div style={{ fontSize: 11, color: c.muted }}>{formatFecha(item.fecha)}</div>
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, color: c.redText }}>-${item.monto.toLocaleString()}</span>
              <button onClick={() => deleteMov(item.id, 'egreso')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.muted, padding: '4px', display: 'flex', alignItems: 'center' }}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 1l10 10M11 1L1 11" stroke={c.muted} strokeWidth="1.5" strokeLinecap="round"/></svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
