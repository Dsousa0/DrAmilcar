import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Algo deu errado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0d0c0a',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '600px',
          height: '600px',
          background: 'radial-gradient(circle, rgba(240,120,32,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          background: '#131110',
          border: '1px solid #242018',
          borderRadius: '16px',
          padding: '40px 36px',
          width: '100%',
          maxWidth: '380px',
          position: 'relative',
          zIndex: 1,
          boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(240,120,32,0.04)',
        }}
      >
        {/* Logo mark */}
        <div style={{ marginBottom: '28px' }}>
          <h1
            style={{
              fontFamily: "'Lora', serif",
              fontSize: '26px',
              fontWeight: 700,
              letterSpacing: '-0.4px',
              margin: 0,
              lineHeight: 1,
            }}
          >
            Dr. <span style={{ color: '#f07820' }}>Theo</span>
          </h1>
          <p style={{ fontSize: '12.5px', color: '#6b6058', marginTop: '6px', fontWeight: 400 }}>
            Entre na sua conta
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label
              htmlFor="email"
              style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#b0a899', marginBottom: '6px', letterSpacing: '0.04em', textTransform: 'uppercase' }}
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{
                width: '100%',
                background: '#0d0c0a',
                border: '1.5px solid #242018',
                borderRadius: '8px',
                padding: '11px 13px',
                fontSize: '13px',
                color: '#ede8df',
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 200ms, box-shadow 200ms',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#f07820'
                e.target.style.boxShadow = '0 0 0 3px rgba(240,120,32,0.12)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#242018'
                e.target.style.boxShadow = 'none'
              }}
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#b0a899', marginBottom: '6px', letterSpacing: '0.04em', textTransform: 'uppercase' }}
            >
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={{
                width: '100%',
                background: '#0d0c0a',
                border: '1.5px solid #242018',
                borderRadius: '8px',
                padding: '11px 13px',
                fontSize: '13px',
                color: '#ede8df',
                fontFamily: 'inherit',
                outline: 'none',
                transition: 'border-color 200ms, box-shadow 200ms',
                boxSizing: 'border-box',
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#f07820'
                e.target.style.boxShadow = '0 0 0 3px rgba(240,120,32,0.12)'
              }}
              onBlur={(e) => {
                e.target.style.borderColor = '#242018'
                e.target.style.boxShadow = 'none'
              }}
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p style={{ fontSize: '12px', color: '#e05040', margin: 0, padding: '8px 12px', background: 'rgba(224,80,64,0.08)', borderRadius: '6px', border: '1px solid rgba(224,80,64,0.2)' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: loading ? '#2a2420' : '#f07820',
              color: loading ? '#6b6058' : '#0d0c0a',
              border: 'none',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '13px',
              fontWeight: 700,
              fontFamily: 'inherit',
              cursor: loading ? 'not-allowed' : 'pointer',
              transition: 'background 150ms, transform 80ms',
              marginTop: '4px',
              letterSpacing: '0.02em',
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#e06810' }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = '#f07820' }}
            onMouseDown={(e) => { if (!loading) e.currentTarget.style.transform = 'scale(0.98)' }}
            onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)' }}
          >
            {loading ? 'Aguarde…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
