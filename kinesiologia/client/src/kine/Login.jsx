import { useState } from 'react'
import { api } from './api.js'
import BrandLogo from './BrandLogo.jsx'

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await api.login(form)
      onLogin(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const fld = {
    width: '100%', borderRadius: 16, border: '1px solid rgba(148,184,204,.24)', background: '#0B1B29',
    padding: '15px 16px', color: '#F2F7FB', outline: 'none', fontSize: 17,
    fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.15s',
    marginTop: 8,
  }

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at 50% -16%, rgba(42,174,186,.24), transparent 31%), radial-gradient(circle at 5% 95%, rgba(25,92,120,.22), transparent 31%), linear-gradient(140deg, #081521 0%, #0A1825 48%, #0C2130 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
      <div style={{ width: '100%', maxWidth: 420 }}>
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <BrandLogo size={104} />
          <h1 style={{ fontSize: 34, lineHeight: 1, fontWeight: 950, color: '#F2F7FB', marginTop: 18, marginBottom: 0, letterSpacing: '-.055em' }}>Kine<span style={{ color: '#52D8D4' }}>Plus</span></h1>
          <p style={{ fontSize: 16, color: '#B7C8D7', marginTop: 9, marginBottom: 0, fontWeight: 700 }}>Tu rehabilitación, más clara y cerca</p>
        </div>

        <div style={{ background: 'linear-gradient(145deg, rgba(18,39,55,.98), rgba(12,29,43,.98))', borderRadius: 26, padding: '28px 26px 26px', boxShadow: '0 20px 50px rgba(0,0,0,.27)', border: '1px solid rgba(148,184,204,.18)' }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 21, color: '#F2F7FB', fontWeight: 900, letterSpacing: '-.025em' }}>Ingresá a tu espacio</div>
            <div style={{ marginTop: 5, fontSize: 14, color: '#AFC1CF', fontWeight: 600 }}>Tus ejercicios y seguimiento, en un solo lugar.</div>
          </div>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ fontSize: 15, fontWeight: 850, color: '#DCE8EF' }}>Email</label>
              <input
                type="email" required autoFocus placeholder="tu@email.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                style={fld}
                onFocus={e => e.target.style.borderColor = '#48D5D1'}
                onBlur={e => e.target.style.borderColor = 'rgba(148,184,204,.24)'}
              />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: 15, fontWeight: 850, color: '#DCE8EF' }}>Contraseña</label>
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  style={{ fontSize: 14, color: '#70E0DB', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0, fontWeight: 850 }}>
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'} required placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                style={fld}
                onFocus={e => e.target.style.borderColor = '#48D5D1'}
                onBlur={e => e.target.style.borderColor = 'rgba(148,184,204,.24)'}
              />
            </div>

            {error && (
              <div style={{ borderRadius: 14, background: '#fef2f2', border: '1px solid #fecaca', padding: '12px 14px', fontSize: 13, color: '#dc2626' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ width: '100%', borderRadius: 16, background: loading ? '#398C95' : 'linear-gradient(135deg, #1BAAB5 0%, #16728C 100%)', color: '#fff', padding: '16px', fontSize: 17, fontWeight: 900, border: 'none', cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit', boxShadow: '0 14px 28px rgba(4,116,139,.26)', transition: 'background 0.15s' }}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>

        <p style={{ marginTop: 24, textAlign: 'center', fontSize: 13, color: '#91A9B9', fontWeight: 750 }}>
          Acceso para pacientes y profesionales
        </p>
      </div>
    </div>
  )
}
