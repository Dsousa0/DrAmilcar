import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'

export default function Login() {
  const { login, register } = useAuth()
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (mode === 'login') {
        await login(email, password)
      } else {
        await register(email, password)
      }
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Algo deu errado. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4f1' }}>
      <div style={{ background: '#fffffe', borderRadius: '16px', padding: '36px 32px', width: '100%', maxWidth: '380px', boxShadow: '0 2px 16px rgba(28,25,23,0.08)' }}>

        <h1 style={{ fontFamily: "'Lora', serif", fontSize: '24px', fontWeight: 700, color: '#1c1917', letterSpacing: '-0.4px', marginBottom: '4px' }}>
          DrAmilcar
        </h1>
        <p style={{ fontSize: '13px', color: '#78716c', marginBottom: '28px', fontWeight: 400 }}>
          {mode === 'login' ? 'Entre na sua conta' : 'Crie sua conta'}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#44403c', marginBottom: '5px' }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: '100%', background: '#f5f4f1', border: '1.5px solid #e8e5e0', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: '#44403c', fontFamily: 'inherit', outline: 'none', transition: 'border-color 200ms', boxSizing: 'border-box' }}
              onFocus={(e) => (e.target.style.borderColor = '#d6a96a')}
              onBlur={(e) => (e.target.style.borderColor = '#e8e5e0')}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#44403c', marginBottom: '5px' }}>
              Senha
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              style={{ width: '100%', background: '#f5f4f1', border: '1.5px solid #e8e5e0', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', color: '#44403c', fontFamily: 'inherit', outline: 'none', transition: 'border-color 200ms', boxSizing: 'border-box' }}
              onFocus={(e) => (e.target.style.borderColor = '#d6a96a')}
              onBlur={(e) => (e.target.style.borderColor = '#e8e5e0')}
            />
          </div>

          {error && <p style={{ fontSize: '12px', color: '#c25b4a' }}>{error}</p>}

          <button
            type="submit"
            disabled={loading}
            style={{ width: '100%', background: loading ? '#44403c' : '#292524', color: '#fafaf9', border: 'none', borderRadius: '8px', padding: '11px', fontSize: '13px', fontWeight: 600, fontFamily: 'inherit', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 150ms', marginTop: '4px' }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = '#1c1917' }}
            onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = '#292524' }}
          >
            {loading ? 'Aguarde…' : mode === 'login' ? 'Entrar' : 'Criar conta'}
          </button>
        </form>

        <p style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px', color: '#a8a29e' }}>
          {mode === 'login' ? 'Não tem conta?' : 'Já tem conta?'}{' '}
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError('') }}
            style={{ color: '#d6a96a', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px' }}
          >
            {mode === 'login' ? 'Cadastre-se' : 'Entrar'}
          </button>
        </p>
      </div>
    </div>
  )
}
