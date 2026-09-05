import { useEffect, useState } from 'react'
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { api } from './api.js'
import Login from './Login.jsx'
import ProfessionalDashboard from './ProfessionalDashboard.jsx'
import Pacientes from './Pacientes.jsx'
import PacienteDetalle from './PacienteDetalle.jsx'
import PatientClinicalRoutineBridge from './PatientClinicalRoutineBridge.jsx'
import ClinicalRoutinePatientPage from './ClinicalRoutinePatientPage.jsx'
import ClinicalRoutinesHub from './ClinicalRoutinesHub.jsx'
import Ejercicios from './Ejercicios.jsx'
import Agenda from './Agenda.jsx'
import KineClaude from './KineClaude.jsx'
import Notas from './Notas.jsx'
import Cuenta from './Cuenta.jsx'
import PortalPaciente from './PortalPaciente.jsx'
import PatientRoutineProgressMount from './PatientRoutineProgressMount.jsx'
import BrandLogo from './BrandLogo.jsx'
import FloatingAIAssistant from './FloatingAIAssistant.jsx'
import './kine.css'
import './premium-refresh.css'
import './clinical-routine-mobile.css'

const KINE_EMAIL = 'augustociuro@gmail.com'

const c = {
  bg: '#081521', white: '#112433', sky: '#38C5CB', skyDark: '#7CE5E2',
  skyLight: 'rgba(56,197,203,.14)', skyXlight: '#0D1D2B', aqua: '#56D3B1', aquaDark: '#91E8D0',
  aquaLight: 'rgba(86,211,177,.14)', ink: '#F2F7FB', ink2: '#B7C8D7', muted: '#7F96A8',
  border: 'rgba(148,184,204,.16)', sidebar: '#0A1825',
}

const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Inicio', path: '/kine',
    icon: (a) => <svg width="18" height="18" viewBox="0 0 22 22" fill="none"><path d="M3 11L11 4l8 7" stroke={a ? c.skyDark : 'rgba(183,200,215,0.52)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 9v9h4v-4h2v4h4V9" stroke={a ? c.skyDark : 'rgba(183,200,215,0.52)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { id: 'pacientes',  label: 'Pacientes', path: '/kine/pacientes',
    icon: (a) => <svg width="18" height="18" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="7" r="4" stroke={a ? c.skyDark : 'rgba(183,200,215,0.52)'} strokeWidth="1.5"/><path d="M4 19c0-3.9 3.1-7 7-7s7 3.1 7 7" stroke={a ? c.skyDark : 'rgba(183,200,215,0.52)'} strokeWidth="1.5" strokeLinecap="round"/></svg> },
  { id: 'agenda',     label: 'Agenda',    path: '/kine/agenda',
    icon: (a) => <svg width="18" height="18" viewBox="0 0 22 22" fill="none"><rect x="3" y="5" width="16" height="14" rx="2" stroke={a ? c.skyDark : 'rgba(183,200,215,0.52)'} strokeWidth="1.5"/><path d="M7 5V3M15 5V3M3 9h16" stroke={a ? c.skyDark : 'rgba(183,200,215,0.52)'} strokeWidth="1.5" strokeLinecap="round"/></svg> },
  { id: 'rutinas-clinicas', label: 'Rutinas', path: '/kine/rutinas-clinicas',
    icon: (a) => <svg width="18" height="18" viewBox="0 0 22 22" fill="none"><path d="M5 5h12v12H5z" stroke={a ? c.skyDark : 'rgba(183,200,215,0.52)'} strokeWidth="1.5"/><path d="M8 9h6M8 13h4" stroke={a ? c.skyDark : 'rgba(183,200,215,0.52)'} strokeWidth="1.5" strokeLinecap="round"/></svg> },
  { id: 'cuenta',     label: 'Finanzas',  path: '/kine/cuenta',
    icon: (a) => <svg width="18" height="18" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="8" stroke={a ? c.skyDark : 'rgba(183,200,215,0.52)'} strokeWidth="1.5"/><path d="M11 7v1.5m0 5V15m-2-5.5c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2 .9-2 2 .9 2 2 2" stroke={a ? c.skyDark : 'rgba(183,200,215,0.52)'} strokeWidth="1.3" strokeLinecap="round"/></svg> },
]

const SECONDARY_NAV_ITEMS = [
  { id: 'ejercicios', label: 'Biblioteca', path: '/kine/ejercicios' },
  { id: 'notas', label: 'Notas', path: '/kine/notas' },
]

const ADMIN_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700;800;900&family=DM+Serif+Display&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body, #root { height: 100%; }
  body { font-family: 'DM Sans', sans-serif; background: ${c.bg}; -webkit-font-smoothing: antialiased; color: ${c.ink}; }
  textarea, input { outline: none; }
  .adm-shell { min-height: 100vh; background: radial-gradient(circle at 70% -12%, rgba(38,163,180,.17), transparent 34%), radial-gradient(circle at 10% 96%, rgba(31,89,115,.18), transparent 34%), #081521; display: flex; flex-direction: column; }
  .adm-desktop-sidebar { display: none; }
  .adm-topbar { background: transparent; display: flex; align-items: center; justify-content: space-between; padding: 16px 18px 8px; max-width: 860px; width: 100%; margin: 0 auto; }
  .adm-content { flex: 1; padding: 12px 18px 126px; max-width: 860px; margin: 0 auto; width: 100%; }
  .adm-bottom-nav { position: fixed; bottom: 12px; left: 12px; right: 12px; background: rgba(17,36,51,.90); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); border: 1px solid ${c.border}; border-radius: 24px; display: flex; justify-content: space-around; padding: 10px 4px env(safe-area-inset-bottom,10px); z-index: 100; box-shadow: 0 18px 48px rgba(0,0,0,.32); }
  .adm-bnav-btn { display: flex; flex-direction: column; align-items: center; gap: 3px; flex: 1; min-width: 48px; background: none; border: none; cursor: pointer; padding: 5px 2px; border-radius: 16px; }
  .adm-bnav-label { font-size: 9px; font-family: 'DM Sans', sans-serif; white-space: nowrap; }
  .adm-bnav-dot { width: 4px; height: 4px; border-radius: 50%; background: ${c.skyDark}; margin: 1px auto 0; }
  .adm-secondary-nav { max-width: 860px; width: calc(100% - 36px); margin: 0 auto 10px; display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
  .adm-secondary-btn { border: 1px solid ${c.border}; background: rgba(17,36,51,.82); color: ${c.ink2}; border-radius: 999px; padding: 7px 12px; font-size: 11px; font-weight: 800; cursor: pointer; font-family: 'DM Sans', sans-serif; }
  .adm-secondary-btn.active { background: rgba(56,197,203,.14); color: ${c.skyDark}; border-color: rgba(56,197,203,.34); }
  @media (min-width: 768px) {
    .adm-shell { height: 100vh; overflow: hidden; display: grid; grid-template-columns: 248px minmax(0,1fr); grid-template-rows: auto auto minmax(0,1fr); }
    .adm-desktop-sidebar { display: flex; grid-column: 1; grid-row: 1 / span 3; flex-direction: column; gap: 4px; padding: 28px 16px 22px; border-right: 1px solid ${c.border}; background: linear-gradient(180deg, rgba(10,24,37,.98), rgba(8,21,33,.93)); }
    .adm-desktop-brand { display: flex; align-items: center; gap: 10px; margin: 0 6px 30px; }
    .adm-mobile-brand { display: none; }
    .adm-desktop-group { color: ${c.muted}; font-size: 10px; letter-spacing: .12em; text-transform: uppercase; font-weight: 900; margin: 20px 10px 7px; }
    .adm-desktop-nav { width: 100%; border: 0; background: transparent; border-radius: 14px; padding: 11px 12px; display: flex; align-items: center; gap: 10px; color: ${c.ink2}; font: 700 13px 'DM Sans', sans-serif; cursor: pointer; text-align: left; }
    .adm-desktop-nav:hover { background: rgba(255,255,255,.05); color: ${c.ink}; }
    .adm-desktop-nav.active { background: linear-gradient(135deg, rgba(56,197,203,.18), rgba(56,197,203,.08)); color: #A0F0EC; border: 1px solid rgba(56,197,203,.18); }
    .adm-desktop-nav-icon { width: 22px; display: grid; place-items: center; color: inherit; font-size: 16px; }
    .adm-topbar { grid-column: 2; grid-row: 1; padding: 23px 40px 4px; max-width: 1280px; }
    .adm-content { grid-column: 2; grid-row: 3; overflow-y: auto; max-width: 1280px; padding: 22px 40px 48px; }
    .adm-bottom-nav { display: none; }
    .adm-secondary-nav { display: none; }
  }
  ::-webkit-scrollbar { width: 4px; }
  ::-webkit-scrollbar-thumb { background: rgba(63,167,184,.35); border-radius: 2px; }
`

function AdminLayout({ usuario, onLogout }) {
  const navigate = useNavigate()
  const location = useLocation()

  function getActiveId() {
    const p = location.pathname
    if (p === '/kine' || p === '/kine/') return 'dashboard'
    if (p.includes('/paciente')) return 'pacientes'
    if (p.includes('/agenda')) return 'agenda'
    if (p.includes('/rutinas-clinicas')) return 'rutinas-clinicas'
    if (p.includes('/ejercicios')) return 'ejercicios'
    if (p.includes('/claude'))    return 'claude'
    if (p.includes('/cuenta'))    return 'cuenta'
    if (p.includes('/notas'))     return 'notas'
    return 'dashboard'
  }

  const activeId = getActiveId()
  const nombre = usuario?.nombre?.split(' ')[0] || 'Augusto'
  const desktopItems = [...NAV_ITEMS, ...SECONDARY_NAV_ITEMS]

  return (
    <div className="adm-shell">
      <style>{ADMIN_CSS}</style>
      <aside className="adm-desktop-sidebar">
        <div className="adm-desktop-brand">
          <BrandLogo size={42} />
          <div><div style={{ color: c.ink, fontSize: 18, fontWeight: 950, letterSpacing: '-.04em' }}>KinePlus</div><div style={{ color: c.muted, fontSize: 9, fontWeight: 850, letterSpacing: '.12em', textTransform: 'uppercase', marginTop: 2 }}>Panel profesional</div></div>
        </div>
        <div className="adm-desktop-group">Consultorio</div>
        {desktopItems.map(item => {
          const active = activeId === item.id
          const symbol = item.id === 'dashboard' ? '⌂' : item.id === 'pacientes' ? '♙' : item.id === 'agenda' ? '□' : item.id === 'rutinas-clinicas' ? '≡' : item.id === 'cuenta' ? '$' : item.id === 'ejercicios' ? '▦' : '✦'
          return <button key={item.id} className={`adm-desktop-nav ${active ? 'active' : ''}`} onClick={() => navigate(item.path)}><span className="adm-desktop-nav-icon">{symbol}</span>{item.label}</button>
        })}
        <div style={{ flex: 1 }} />
        <button className="adm-desktop-nav" onClick={() => navigate('/kine/claude')}><span className="adm-desktop-nav-icon">✦</span>Asistente IA</button>
      </aside>
      <header className="adm-topbar">
        <div className="adm-mobile-brand" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 42, height: 42, borderRadius: 14, background: 'rgba(255,255,255,.06)', display: 'grid', placeItems: 'center', boxShadow: '0 10px 24px rgba(0,0,0,.12)' }}>
            <BrandLogo size={38} />
          </div>
          <div>
            <div style={{ fontSize: 16, color: c.ink, letterSpacing: '.02em', fontWeight: 950 }}>KinePlus</div>
            <div style={{ fontSize: 10, color: c.muted, letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 800 }}>Panel profesional</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: `linear-gradient(135deg, ${c.sky} 0%, ${c.skyDark} 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, color: '#fff', boxShadow: '0 10px 22px rgba(39,127,146,.18)' }}>
            {nombre[0]}
          </div>
          <button onClick={onLogout} style={{ background: 'rgba(255,255,255,.05)', border: `1px solid ${c.border}`, borderRadius: 12, padding: '6px 11px', fontSize: 11, color: c.ink2, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 800 }}>Salir</button>
        </div>
      </header>

      <div className="adm-secondary-nav">
        {SECONDARY_NAV_ITEMS.map(item => {
          const active = activeId === item.id
          return (
            <button key={item.id} className={`adm-secondary-btn ${active ? 'active' : ''}`} onClick={() => navigate(item.path)}>
              {item.label}
            </button>
          )
        })}
      </div>

      <main className="adm-content">
        <Routes>
          <Route path="/" element={<ProfessionalDashboard nombre={nombre} />} />
          <Route path="/pacientes" element={<Pacientes />} />
          <Route path="/paciente/:id" element={<PatientClinicalRoutineBridge />} />
          <Route path="/paciente/:id/rutinas-clinicas" element={<ClinicalRoutinePatientPage />} />
          <Route path="/rutinas-clinicas" element={<ClinicalRoutinesHub />} />
          <Route path="/rutinas-clinicas/:id" element={<ClinicalRoutinePatientPage />} />
          <Route path="/agenda" element={<Agenda />} />
          <Route path="/ejercicios" element={<Ejercicios />} />
          <Route path="/claude" element={<KineClaude />} />
          <Route path="/cuenta" element={<Cuenta />} />
          <Route path="/notas" element={<Notas />} />
          <Route path="*" element={<Navigate to="/kine" replace />} />
        </Routes>
      </main>

      <nav className="adm-bottom-nav">
        {NAV_ITEMS.map(item => {
          const active = activeId === item.id
          return (
            <button key={item.id} className="adm-bnav-btn" onClick={() => navigate(item.path)}>
              {item.icon(active)}
              <span className="adm-bnav-label" style={{ color: active ? c.skyDark : 'rgba(183,200,215,0.58)', fontWeight: active ? 800 : 500 }}>{item.label}</span>
              {active && <div className="adm-bnav-dot" />}
            </button>
          )
        })}
      </nav>
      <FloatingAIAssistant />
    </div>
  )
}

function PacienteLayout({ usuario, paciente, onLogout }) {
  return (
    <>
      <PatientRoutineProgressMount pacienteId={paciente?.id} />
      <Routes>
        <Route path="/*" element={<PortalPaciente usuario={usuario} paciente={paciente} onLogout={onLogout} />} />
      </Routes>
    </>
  )
}

export default function KineApp() {
  const [auth, setAuth] = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const token = localStorage.getItem('kine_token')
    if (!token) { setLoading(false); return }
    api.me()
      .then(data => setAuth(data))
      .catch(() => localStorage.removeItem('kine_token'))
      .finally(() => setLoading(false))
  }, [])

  function handleLogin(data) {
    localStorage.setItem('kine_token', data.token)
    setAuth({ usuario: data.usuario, paciente: data.paciente })
  }

  function handleLogout() {
    localStorage.removeItem('kine_token')
    setAuth(null)
    navigate('/kine/login')
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#081521', gap: 12 }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(255,255,255,.06)', display: 'grid', placeItems: 'center', boxShadow: '0 18px 42px rgba(0,0,0,.28)' }}>
          <BrandLogo size={58} />
        </div>
        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 950, color: c.ink }}>KinePlus</div>
      </div>
    )
  }

  if (!auth) {
    return (
      <div className="kine-app">
        <Routes>
          <Route path="/login" element={<Login onLogin={handleLogin} />} />
          <Route path="*" element={<Navigate to="/kine/login" replace />} />
        </Routes>
      </div>
    )
  }

  const userEmail = auth.usuario?.email?.toLowerCase?.() || ''
  const isKinesiologo = auth.usuario?.rol === 'admin' || userEmail === KINE_EMAIL

  if (isKinesiologo) {
    return <AdminLayout usuario={{ ...auth.usuario, rol: 'admin' }} onLogout={handleLogout} />
  }

  return <PacienteLayout usuario={auth.usuario} paciente={auth.paciente} onLogout={handleLogout} />
}
