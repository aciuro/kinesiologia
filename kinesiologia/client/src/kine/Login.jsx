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
    width: '100%', borderRadius: 18, border: '1px solid rgba(91,128,151,.32)', background: '#fff',
    padding: '14px 16px', color: '#102A43', outline: 'none', fontSize: 16,
    fontFamily: 'inherit', boxSizing: 'border-box', transition: 'border-color 0.15s',
    marginTop: 8,
  }

  return (
    <div style={{ minHeight: '100vh', background: 'radial-gradient(circle at 50% -12%, rgba(37,182,214,.28), transparent 34%), linear-gradient(135deg, #EAF1F7 0%, #F8FBFD 52%, #DCEAF3 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 16px' }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 30 }}>
          <div style={{ width: 96, height: 96, borderRadius: 28, background: 'rgba(255,255,255,.78)', display: 'grid', placeItems: 'center', margin: '0 auto', boxShadow: '0 18px 42px rgba(13,53,64,.12)', border: '1px solid rgba(83,151,166,.22)' }}>
            <BrandLogo size={86} />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 950, color: '#102A43', marginTop: 16, marginBottom: 0, letterSpacing: '-.04em' }}>KinePlus</h1>
          <p style={{ fontSize: 15, color: '#637D91', marginTop: 6, marginBottom: 0, fontWeight: 700 }}>Tu rehabilitación, más clara y cerca</p>
        </div>

        <div style={{ background: 'rgba(255,255,255,.94)', borderRadius: 28, padding: 24, boxShadow: '0 18px 48px rgba(13,53,64,.12)', border: '1px solid rgba(83,151,166,.30)' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <label style={{ fontSize: 15, fontWeight: 800, color: '#34536C' }}>Email</label>
              <input
                type="email" required autoFocus placeholder="tu@email.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                style={fld}
                onFocus={e => e.target.style.borderColor = '#2F9FB2'}
                onBlur={e => e.target.style.borderColor = 'rgba(83,151,166,.30)'}
              />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label style={{ fontSize: 15, fontWeight: 800, color: '#34536C' }}>Contraseña</label>
                <button type="button" onClick={() => setShowPassword(v => !v)}
                  style={{ fontSize: 14, color: '#0B5876', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0, fontWeight: 800 }}>
                  {showPassword ? 'Ocultar' : 'Mostrar'}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'} required placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                style={fld}
                onFocus={e => e.target.style.borderColor = '#2F9FB2'}
                onBlur={e => e.target.style.borderColor = 'rgba(83,151,166,.30)'}
              />
            </div>

            {error && (
              <div style={{ borderRadius: 14, background: '#fef2f2', border: '1px solid #fecaca', padding: '12px 14px', fontSize: 13, color: '#dc2626' }}>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading}
              style={{ width: '100%', borderRadius: 18, background: loading ? '#7BCFCB' : 'linear-gradient(135deg, #102A43 0%, #0B5876 100%)', color: '#fff', padding: '15px', fontSize: 16, fontWeight: 900, border: 'none', cursor: loading ? 'default' : 'pointer', fontFamily: 'inherit', boxShadow: '0 14px 32px rgba(16,42,67,.24)', transition: 'background 0.15s' }}>
              {loading ? 'Ingresando...' : 'Ingresar'}
            </button>
          </form>
        </div>

        <p style={{ marginTop: 24, textAlign: 'center', fontSize: 12, color: '#789FAA', fontWeight: 700 }}>
          Acceso para pacientes y profesionales
        </p>
      </div>
    </div>
  )
}
