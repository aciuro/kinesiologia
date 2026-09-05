import { useEffect, useState } from 'react'
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom'
import { api } from './api.js'
import Login from './Login.jsx'
import Dashboard from './Dashboard.jsx'
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
  bg: '#EAF1F7', white: '#FFFFFF', sky: '#25B6D6', skyDark: '#0B5876',
  skyLight: '#DDF3F8', skyXlight: '#F3F8FB', aqua: '#37C4BC', aquaDark: '#137A78',
  aquaLight: '#DDF7F3', ink: '#102A43', ink2: '#34536C', muted: '#637D91',
  border: 'rgba(91,128,151,.28)', sidebar: '#102A43',
}

const NAV_ITEMS = [
  { id: 'dashboard',  label: 'Inicio', path: '/kine',
    icon: (a) => <svg width="18" height="18" viewBox="0 0 22 22" fill="none"><path d="M3 11L11 4l8 7" stroke={a ? c.skyDark : 'rgba(13,53,64,0.35)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><path d="M6 9v9h4v-4h2v4h4V9" stroke={a ? c.skyDark : 'rgba(13,53,64,0.35)'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg> },
  { id: 'pacientes',  label: 'Pacientes', path: '/kine/pacientes',
    icon: (a) => <svg width="18" height="18" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="7" r="4" stroke={a ? c.skyDark : 'rgba(13,53,64,0.35)'} strokeWidth="1.5"/><path d="M4 19c0-3.9 3.1-7 7-7s7 3.1 7 7" stroke={a ? c.skyDark : 'rgba(13,53,64,0.35)'} strokeWidth="1.5" strokeLinecap="round"/></svg> },
  { id: 'agenda',     label: 'Agenda',    path: '/kine/agenda',
    icon: (a) => <svg width="18" height="18" viewBox="0 0 22 22" fill="none"><rect x="3" y="5" width="16" height="14" rx="2" stroke={a ? c.skyDark : 'rgba(13,53,64,0.35)'} strokeWidth="1.5"/><path d="M7 5V3M15 5V3M3 9h16" stroke={a ? c.skyDark : 'rgba(13,53,64,0.35)'} strokeWidth="1.5" strokeLinecap="round"/></svg> },
  { id: 'rutinas-clinicas', label: 'Rutinas', path: '/kine/rutinas-clinicas',
    icon: (a) => <svg width="18" height="18" viewBox="0 0 22 22" fill="none"><path d="M5 5h12v12H5z" stroke={a ? c.skyDark : 'rgba(13,53,64,0.35)'} strokeWidth="1.5"/><path d="M8 9h6M8 13h4" stroke={a ? c.skyDark : 'rgba(13,53,64,0.35)'} strokeWidth="1.5" strokeLinecap="round"/></svg> },
  { id: 'cuenta',     label: 'Cuenta',    path: '/kine/cuenta',
    icon: (a) => <svg width="18" height="18" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="8" stroke={a ? c.skyDark : 'rgba(13,53,64,0.35)'} strokeWidth="1.5"/><path d="M11 7v1.5m0 5V15m-2-5.5c0-1.1.9-2 2-2s2 .9 2 2-.9 2-2 2-2 .9-2 2 .9 2 2 2" stroke={a ? c.skyDark : 'rgba(13,53,64,0.35)'} strokeWidth="1.3" strokeLinecap="round"/></svg> },
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
  .adm-shell { min-height: 100vh; background: radial-gradient(circle at 58% -8%, rgba(91,184,204,.18), transparent 34%), linear-gradient(135deg, #F6FBFC 0%, #FAFDFD 56%, #EEF8FA 100%); display: flex; flex-direction: column; }
  .adm-sidebar { display: none !important; }
  .adm-topbar { background: transparent; display: flex; align-items: center; justify-content: space-between; padding: 16px 18px 8px; max-width: 860px; width: 100%; margin: 0 auto; }
  .adm-content { flex: 1; padding: 12px 18px 126px; max-width: 860px; margin: 0 auto; width: 100%; }
  .adm-bottom-nav { position: fixed; bottom: 12px; left: 12px; right: 12px; background: rgba(255,255,255,.88); backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px); border: 1px solid ${c.border}; border-radius: 24px; display: flex; justify-content: space-around; padding: 10px 4px env(safe-area-inset-bottom,10px); z-index: 100; box-shadow: 0 18px 48px rgba(13,53,64,.14); }
  .adm-bnav-btn { display: flex; flex-direction: column; align-items: center; gap: 3px; flex: 1; min-width: 48px; background: none; border: none; cursor: pointer; padding: 5px 2px; border-radius: 16px; }
  .adm-bnav-label { font-size: 9px; font-family: 'DM Sans', sans-serif; white-space: nowrap; }
  .adm-bnav-dot { width: 4px; height: 4px; border-radius: 50%; background: ${c.skyDark}; margin: 1px auto 0; }
  .adm-secondary-nav { max-width: 860px; width: calc(100% - 36px); margin: 0 auto 10px; display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; }
  .adm-secondary-btn { border: 1px solid ${c.border}; background: rgba(255,255,255,.76); color: ${c.ink2}; border-radius: 999px; padding: 7px 12px; font-size: 11px; font-weight: 800; cursor: pointer; font-family: 'DM Sans', sans-serif; }
  .adm-secondary-btn.active { background: rgba(63,167,184,.14); color: ${c.skyDark}; border-color: rgba(63,167,184,.28); }
  @media (min-width: 768px) {
    .adm-shell { height: 100vh; overflow: hidden; }
    .adm-topbar { padding: 26px 40px 8px; max-width: 920px; }
    .adm-content { overflow-y: auto; max-width: 920px; padding: 18px 40px 136px; }
    .adm-bottom-nav { max-width: 520px; left: 50%; right: auto; width: calc(100% - 40px); transform: translateX(-50%); }
    .adm-secondary-nav { max-width: 920px; width: calc(100% - 80px); }
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

  return (
    <div className="adm-shell">
      <style>{ADMIN_CSS}</style>
      <header className="adm-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 42, height: 42, borderRadius: 14, background: 'rgba(255,255,255,.72)', display: 'grid', placeItems: 'center', boxShadow: '0 10px 24px rgba(13,53,64,.08)' }}>
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
          <button onClick={onLogout} style={{ background: 'rgba(255,255,255,.85)', border: `1px solid ${c.border}`, borderRadius: 12, padding: '6px 11px', fontSize: 11, color: c.muted, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 800 }}>Salir</button>
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
          <Route path="/" element={<Dashboard />} />
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
              <span className="adm-bnav-label" style={{ color: active ? c.skyDark : 'rgba(13,53,64,0.45)', fontWeight: active ? 800 : 500 }}>{item.label}</span>
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#F6FBFC', gap: 12 }}>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: 'rgba(255,255,255,.78)', display: 'grid', placeItems: 'center', boxShadow: '0 18px 42px rgba(13,53,64,.12)' }}>
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
