import { useState } from 'react'
import { useAuth } from '../context/AuthContext.jsx'
import { changePassword } from '../services/api.js'

const inputStyle = {
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
}

const labelStyle = {
  display: 'block',
  fontSize: '11px',
  fontWeight: 600,
  color: '#b0a899',
  marginBottom: '6px',
  letterSpacing: '0.04em',
  textTransform: 'uppercase',
}

function focus(e) {
  e.target.style.borderColor = '#f07820'
  e.target.style.boxShadow = '0 0 0 3px rgba(240,120,32,0.12)'
}
function blur(e) {
  e.target.style.borderColor = '#242018'
  e.target.style.boxShadow = 'none'
}

export default function ChangePassword() {
  const { user, applySession, logout } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (newPassword.length < 6) {
      setError('A nova senha deve ter pelo menos 6 caracteres.')
      return
    }
    if (newPassword !== confirmPassword) {
      setError('A confirmação não confere com a nova senha.')
      return
    }
    if (newPassword === currentPassword) {
      setError('A nova senha deve ser diferente da atual.')
      return
    }
    setLoading(true)
    try {
      const data = await changePassword(currentPassword, newPassword)
      applySession(data.token, data.user)
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Não foi possível trocar a senha.')
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
          maxWidth: '400px',
          position: 'relative',
          zIndex: 1,
          boxShadow: '0 24px 64px rgba(0,0,0,0.5), 0 0 0 1px rgba(240,120,32,0.04)',
        }}
      >
        <div style={{ marginBottom: '24px' }}>
          <h1
            style={{
              fontFamily: "'Lora', serif",
              fontSize: '22px',
              fontWeight: 700,
              letterSpacing: '-0.3px',
              margin: 0,
              lineHeight: 1.1,
              color: '#ede8df',
            }}
          >
            Defina sua nova senha
          </h1>
          <p style={{ fontSize: '12px', color: '#6b6058', marginTop: '8px', lineHeight: 1.5 }}>
            Para continuar, você precisa trocar a senha temporária recebida do administrador.
          </p>
          {user?.email && (
            <p style={{ fontSize: '11px', color: '#4a433d', marginTop: '4px' }}>{user.email}</p>
          )}
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label htmlFor="current" style={labelStyle}>Senha atual</label>
            <input
              id="current"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              autoComplete="current-password"
              style={inputStyle}
              onFocus={focus}
              onBlur={blur}
              placeholder="••••••••"
            />
          </div>

          <div>
            <label htmlFor="newpw" style={labelStyle}>Nova senha</label>
            <input
              id="newpw"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              style={inputStyle}
              onFocus={focus}
              onBlur={blur}
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div>
            <label htmlFor="confirm" style={labelStyle}>Confirmar nova senha</label>
            <input
              id="confirm"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              style={inputStyle}
              onFocus={focus}
              onBlur={blur}
              placeholder="Repita a nova senha"
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
          >
            {loading ? 'Salvando…' : 'Trocar senha e continuar'}
          </button>

          <button
            type="button"
            onClick={logout}
            style={{
              fontSize: '11px',
              color: '#6b6058',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontFamily: 'inherit',
              padding: '4px',
              marginTop: '-4px',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#e05040')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#6b6058')}
          >
            sair
          </button>
        </form>
      </div>
    </div>
  )
}
