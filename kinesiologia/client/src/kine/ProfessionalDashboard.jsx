import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from './api.js'

const c = {
  text: '#F2F7FB', textSoft: '#B7C8D7', muted: '#7890A3', line: 'rgba(148, 184, 204, .16)',
  surface: '#112433', surface2: '#0D1D2B', brand: '#38C5CB', brandDark: '#1694A5',
  mint: '#56D3B1', amber: '#F3C970', danger: '#F28B82', dangerSoft: 'rgba(242,139,130,.12)',
}

const CSS = `
  .pro-dashboard { color: ${c.text}; padding-bottom: 20px; }
  .pro-eyebrow { color: ${c.brand}; font-size: 11px; font-weight: 900; letter-spacing: .15em; text-transform: uppercase; }
  .pro-title { color: ${c.text}; font-size: clamp(28px, 3vw, 38px); font-weight: 900; letter-spacing: -.055em; line-height: 1.05; margin-top: 7px; }
  .pro-subtitle { color: ${c.textSoft}; font-size: 14px; font-weight: 600; margin-top: 8px; }
  .pro-card { background: linear-gradient(145deg, rgba(20,43,59,.96), rgba(12,29,43,.96)); border: 1px solid ${c.line}; border-radius: 22px; box-shadow: 0 18px 46px rgba(0,0,0,.16); }
  .pro-metrics { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 24px; }
  .pro-metric { min-height: 130px; padding: 17px; cursor: pointer; }
  .pro-metric:hover { border-color: rgba(56,197,203,.55); }
  .pro-metric-icon { width: 34px; height: 34px; border-radius: 12px; display: grid; place-items: center; font-weight: 950; font-size: 16px; }
  .pro-metric-value { color: ${c.text}; font-size: 28px; font-weight: 900; letter-spacing: -.055em; line-height: 1; margin-top: 14px; }
  .pro-metric-label { color: ${c.textSoft}; font-size: 12px; font-weight: 750; margin-top: 6px; }
  .pro-layout { display: grid; gap: 14px; margin-top: 24px; }
  .pro-section { padding: 20px; }
  .pro-section-head { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 15px; }
  .pro-section-title { color: ${c.text}; font-size: 16px; font-weight: 900; letter-spacing: -.025em; }
  .pro-link { border: 0; background: transparent; color: ${c.brand}; font: inherit; font-size: 12px; font-weight: 850; cursor: pointer; padding: 4px 0; }
  .pro-turno { display: grid; grid-template-columns: 53px 1fr auto; gap: 11px; align-items: center; padding: 11px 0; border-top: 1px solid ${c.line}; }
  .pro-turno:first-of-type { border-top: 0; padding-top: 0; }
  .pro-time { background: rgba(56,197,203,.13); border: 1px solid rgba(56,197,203,.20); color: #8BE9E8; border-radius: 12px; min-height: 46px; display: grid; place-content: center; font-size: 13px; font-weight: 900; }
  .pro-turno-name { color: ${c.text}; font-size: 13px; font-weight: 850; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .pro-turno-motivo { color: ${c.muted}; font-size: 11px; font-weight: 600; margin-top: 3px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .pro-pill { border-radius: 999px; padding: 5px 8px; font-size: 10px; font-weight: 850; text-transform: capitalize; white-space: nowrap; }
  .pro-alert { display: flex; gap: 12px; align-items: flex-start; padding: 13px 0; border-top: 1px solid ${c.line}; }
  .pro-alert:first-of-type { border-top: 0; padding-top: 0; }
  .pro-alert-icon { width: 32px; height: 32px; border-radius: 11px; display: grid; place-items: center; flex: 0 0 auto; font-size: 15px; font-weight: 900; }
  .pro-alert-title { color: ${c.text}; font-size: 13px; font-weight: 850; line-height: 1.25; }
  .pro-alert-text { color: ${c.textSoft}; font-size: 11px; font-weight: 600; margin-top: 3px; line-height: 1.4; }
  .pro-finance { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 14px; }
  .pro-finance-box { border-radius: 15px; padding: 13px; background: rgba(7,16,25,.32); border: 1px solid ${c.line}; }
  .pro-finance-label { color: ${c.muted}; font-size: 10px; text-transform: uppercase; letter-spacing: .09em; font-weight: 850; }
  .pro-finance-value { color: ${c.text}; font-size: 19px; line-height: 1; margin-top: 7px; font-weight: 900; letter-spacing: -.04em; }
  .pro-debt { display: flex; align-items: center; gap: 10px; padding: 9px 0; border-top: 1px solid ${c.line}; }
  .pro-debt-avatar { width: 30px; height: 30px; border-radius: 10px; background: ${c.dangerSoft}; color: ${c.danger}; display: grid; place-items: center; font-size: 12px; font-weight: 900; }
  .pro-debt-name { color: ${c.text}; font-size: 12px; font-weight: 800; }
  .pro-debt-meta { color: ${c.muted}; font-size: 10px; margin-top: 2px; font-weight: 600; }
  .pro-debt-amount { color: #F9B3AA; font-size: 12px; font-weight: 900; margin-left: auto; }
  .pro-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 14px; }
  .pro-action { min-height: 70px; padding: 13px; text-align: left; cursor: pointer; }
  .pro-action-title { color: ${c.text}; font-size: 12px; font-weight: 900; }
  .pro-action-note { color: ${c.textSoft}; font-size: 10px; margin-top: 5px; line-height: 1.3; font-weight: 600; }
  .pro-empty { color: ${c.muted}; font-size: 13px; font-weight: 650; text-align: center; padding: 25px 8px; }
  @media (min-width: 760px) {
    .pro-metrics { grid-template-columns: repeat(4, minmax(0, 1fr)); }
    .pro-layout { grid-template-columns: minmax(0, 1.15fr) minmax(300px, .85fr); align-items: start; }
    .pro-main-column { display: grid; gap: 14px; }
  }
`

function salutation() {
  const hour = new Date().getHours()
  return hour < 12 ? 'Buenos días' : hour < 19 ? 'Buenas tardes' : 'Buenas noches'
}

function dateLabel() {
  return new Intl.DateTimeFormat('es-AR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date())
}

function money(value) {
  return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(Number(value || 0))
}

function appointmentTone(status) {
  if (status === 'confirmado') return { background: 'rgba(86,211,177,.14)', color: '#87E6CD' }
  if (status === 'pendiente') return { background: 'rgba(243,201,112,.14)', color: '#F9D990' }
  return { background: 'rgba(112,178,210,.14)', color: '#A9D8EE' }
}

export default function ProfessionalDashboard({ nombre = 'Augusto' }) {
  const [data, setData] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    let current = true
    Promise.all([
      api.getDashboard(),
      api.getSaldosTodos(),
      api.getMovimientos('ingreso'),
      api.getMovimientos('egreso'),
      api.getPacientes(),
    ]).then(async ([dashboard, saldos, ingresos, egresos, pacientes]) => {
      const routines = await Promise.all((pacientes || []).map(p => api.getRutinasPaciente(p.id).catch(() => [])))
      if (current) setData({ dashboard, saldos: saldos || [], ingresos: ingresos || [], egresos: egresos || [], routines: routines.flat().filter(r => r.activa) })
    }).catch(() => current && setData({ dashboard: { stats: {}, proximosTurnos: [] }, saldos: [], ingresos: [], egresos: [], routines: [] }))
    return () => { current = false }
  }, [])

  const financial = useMemo(() => {
    const ingresos = (data?.ingresos || []).reduce((sum, item) => sum + Number(item.monto || 0), 0)
    const egresos = (data?.egresos || []).reduce((sum, item) => sum + Number(item.monto || 0), 0)
    const debt = (data?.saldos || []).reduce((sum, item) => sum + Number(item.saldo_pendiente || 0), 0)
    return { ingresos, egresos, balance: ingresos - egresos, debt }
  }, [data])

  if (!data) return <div className="pro-empty">Preparando tu panel…</div>

  const { stats = {}, proximosTurnos = [] } = data.dashboard || {}
  const metrics = [
    { label: 'Turnos hoy', value: stats.turnos_hoy || 0, icon: '◷', tone: '#AA94FF', bg: 'rgba(170,148,255,.13)', path: '/kine/agenda' },
    { label: 'Pacientes activos', value: stats.total_pacientes || 0, icon: '⌁', tone: '#6FD7EE', bg: 'rgba(111,215,238,.12)', path: '/kine/pacientes' },
    { label: 'Rutinas activas', value: data.routines.length, icon: '↗', tone: '#72DFC2', bg: 'rgba(114,223,194,.12)', path: '/kine/rutinas-clinicas' },
    { label: 'Por cobrar', value: money(financial.debt), icon: '$', tone: '#F4BA91', bg: 'rgba(244,186,145,.12)', path: '/kine/cuenta' },
  ]

  return (
    <div className="pro-dashboard">
      <style>{CSS}</style>
      <header>
        <div className="pro-eyebrow">{dateLabel()}</div>
        <h1 className="pro-title">{salutation()}, {nombre}</h1>
        <p className="pro-subtitle">Tu consultorio, agenda y seguimiento clínico en un solo lugar.</p>
      </header>

      <section className="pro-metrics" aria-label="Resumen del consultorio">
        {metrics.map(item => <button type="button" className="pro-card pro-metric" key={item.label} onClick={() => navigate(item.path)} style={{ border: `1px solid ${c.line}` }}>
          <span className="pro-metric-icon" style={{ background: item.bg, color: item.tone }}>{item.icon}</span>
          <div className="pro-metric-value">{item.value}</div>
          <div className="pro-metric-label">{item.label}</div>
        </button>)}
      </section>

      <section className="pro-layout">
        <div className="pro-main-column">
          <div className="pro-card pro-section">
            <div className="pro-section-head"><h2 className="pro-section-title">Agenda y próximos turnos</h2><button className="pro-link" onClick={() => navigate('/kine/agenda')}>Ver agenda completa →</button></div>
            {proximosTurnos.length ? proximosTurnos.map(turno => {
              const tone = appointmentTone(turno.estado)
              return <div className="pro-turno" key={turno.id}>
                <div className="pro-time">{turno.hora?.slice(0, 5) || '—'}</div>
                <div><div className="pro-turno-name">{turno.nombre} {turno.apellido}</div><div className="pro-turno-motivo">{turno.motivo || 'Sesión de seguimiento'}</div></div>
                <span className="pro-pill" style={tone}>{turno.estado || 'programado'}</span>
              </div>
            }) : <div className="pro-empty">No hay turnos próximos. Podés crear uno desde Agenda.</div>}
          </div>

          <div className="pro-card pro-section">
            <div className="pro-section-head"><h2 className="pro-section-title">Acciones rápidas</h2></div>
            <div className="pro-actions">
              <button type="button" className="pro-card pro-action" onClick={() => navigate('/kine/pacientes')}><div className="pro-action-title">＋ Nuevo paciente</div><div className="pro-action-note">Crear ficha y acceso al portal.</div></button>
              <button type="button" className="pro-card pro-action" onClick={() => navigate('/kine/agenda')}><div className="pro-action-title">＋ Nuevo turno</div><div className="pro-action-note">Reservar una sesión en la agenda.</div></button>
              <button type="button" className="pro-card pro-action" onClick={() => navigate('/kine/rutinas-clinicas')}><div className="pro-action-title">Crear rutina</div><div className="pro-action-note">Asignar ejercicios a un tratamiento.</div></button>
              <button type="button" className="pro-card pro-action" onClick={() => navigate('/kine/ejercicios')}><div className="pro-action-title">Biblioteca</div><div className="pro-action-note">Explorar ejercicios por articulación.</div></button>
            </div>
          </div>
        </div>

        <aside className="pro-main-column">
          <div className="pro-card pro-section">
            <div className="pro-section-head"><h2 className="pro-section-title">Requiere atención</h2><button className="pro-link" onClick={() => navigate('/kine/cuenta')}>Ver finanzas →</button></div>
            <div className="pro-alert"><span className="pro-alert-icon" style={{ background: c.dangerSoft, color: c.danger }}>!</span><div><div className="pro-alert-title">{data.saldos.length} paciente{data.saldos.length === 1 ? '' : 's'} con saldo pendiente</div><div className="pro-alert-text">Hay {money(financial.debt)} pendientes de cobro.</div></div></div>
            <div className="pro-alert"><span className="pro-alert-icon" style={{ background: 'rgba(86,211,177,.12)', color: c.mint }}>✓</span><div><div className="pro-alert-title">{data.routines.length} rutina{data.routines.length === 1 ? '' : 's'} activa{data.routines.length === 1 ? '' : 's'}</div><div className="pro-alert-text">Podés revisarlas desde Tratamientos.</div></div></div>
            <div className="pro-alert"><span className="pro-alert-icon" style={{ background: 'rgba(243,201,112,.12)', color: c.amber }}>◷</span><div><div className="pro-alert-title">{stats.turnos_proximos || 0} turnos por confirmar</div><div className="pro-alert-text">Revisalos para mantener la agenda al día.</div></div></div>
          </div>

          <div className="pro-card pro-section">
            <div className="pro-section-head"><h2 className="pro-section-title">Estado de cuenta</h2><button className="pro-link" onClick={() => navigate('/kine/cuenta')}>Gestionar →</button></div>
            <div className="pro-finance"><div className="pro-finance-box"><div className="pro-finance-label">Ingresos</div><div className="pro-finance-value" style={{ color: '#8CE3C8' }}>{money(financial.ingresos)}</div></div><div className="pro-finance-box"><div className="pro-finance-label">Balance</div><div className="pro-finance-value" style={{ color: financial.balance >= 0 ? '#A9DFF0' : '#F5AAA2' }}>{money(financial.balance)}</div></div></div>
            {data.saldos.length ? data.saldos.slice(0, 3).map(saldo => <div className="pro-debt" key={saldo.id}><span className="pro-debt-avatar">{saldo.nombre?.[0] || '?'}</span><div><div className="pro-debt-name">{saldo.nombre} {saldo.apellido}</div><div className="pro-debt-meta">{saldo.sesiones_pendientes} sesión{saldo.sesiones_pendientes === 1 ? '' : 'es'} sin cobrar</div></div><span className="pro-debt-amount">{money(saldo.saldo_pendiente)}</span></div>) : <div className="pro-empty">No hay pagos pendientes.</div>}
          </div>
        </aside>
      </section>
    </div>
  )
}
