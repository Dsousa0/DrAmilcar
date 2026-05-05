import React, { useState, useEffect, useCallback } from 'react'
import { getUsers, createUser, updateUser, deleteUser } from '../services/api'

const ROLE_BADGE = {
  admin: { background: 'rgba(240,120,32,0.12)', color: '#f07820', border: '1px solid rgba(240,120,32,0.25)' },
  user: { background: 'rgba(255,255,255,0.04)', color: '#6b6058', border: '1px solid #242018' },
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('pt-BR')
}

export default function AdminUsers({ onBack }) {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [showCreate, setShowCreate] = useState(false)
  const [createForm, setCreateForm] = useState({ email: '', password: '', role: 'user' })
  const [createError, setCreateError] = useState('')
  const [createLoading, setCreateLoading] = useState(false)

  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState({ email: '', password: '', role: 'user' })
  const [editError, setEditError] = useState('')
  const [editLoading, setEditLoading] = useState(false)

  const [deleteConfirm, setDeleteConfirm] = useState(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      setUsers(await getUsers())
    } catch {
      setError('Erro ao carregar usuários.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleCreate(e) {
    e.preventDefault()
    setCreateError('')
    setCreateLoading(true)
    try {
      await createUser(createForm)
      setCreateForm({ email: '', password: '', role: 'user' })
      setShowCreate(false)
      await load()
    } catch (err) {
      setCreateError(err.response?.data?.error?.message || 'Erro ao criar usuário.')
    } finally {
      setCreateLoading(false)
    }
  }

  function openEdit(user) {
    setEditId(user._id)
    setEditForm({ email: user.email, password: '', role: user.role })
    setEditError('')
  }

  async function handleEdit(e) {
    e.preventDefault()
    setEditError('')
    setEditLoading(true)
    try {
      const payload = { email: editForm.email, role: editForm.role }
      if (editForm.password) payload.password = editForm.password
      await updateUser(editId, payload)
      setEditId(null)
      await load()
    } catch (err) {
      setEditError(err.response?.data?.error?.message || 'Erro ao atualizar usuário.')
    } finally {
      setEditLoading(false)
    }
  }

  async function handleDelete(id) {
    try {
      await deleteUser(id)
      setDeleteConfirm(null)
      await load()
    } catch (err) {
      setError(err.response?.data?.error?.message || 'Erro ao remover usuário.')
    }
  }

  const inputStyle = {
    width: '100%',
    background: '#0d0c0a',
    border: '1.5px solid #242018',
    borderRadius: '8px',
    padding: '9px 12px',
    fontSize: '13px',
    color: '#ede8df',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 200ms, box-shadow 200ms',
  }

  function inputFocus(e) {
    e.target.style.borderColor = '#f07820'
    e.target.style.boxShadow = '0 0 0 3px rgba(240,120,32,0.10)'
  }
  function inputBlur(e) {
    e.target.style.borderColor = '#242018'
    e.target.style.boxShadow = 'none'
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0d0c0a', padding: '32px 24px' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
          <button
            onClick={onBack}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#4a433d',
              fontSize: '13px',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '0',
              transition: 'color 150ms',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#b0a899')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#4a433d')}
          >
            ← Voltar
          </button>
          <h1
            style={{
              fontFamily: "'Lora', serif",
              fontSize: '22px',
              fontWeight: 700,
              color: '#ede8df',
              letterSpacing: '-0.3px',
              margin: 0,
            }}
          >
            Gestão de Usuários
          </h1>
          <button
            onClick={() => { setShowCreate(true); setCreateError('') }}
            style={{
              marginLeft: 'auto',
              background: '#f07820',
              color: '#0d0c0a',
              border: 'none',
              borderRadius: '8px',
              padding: '9px 16px',
              fontSize: '12px',
              fontWeight: 700,
              fontFamily: 'inherit',
              cursor: 'pointer',
              transition: 'background 150ms',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#e06810')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#f07820')}
          >
            + Novo usuário
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div
            style={{
              background: '#131110',
              border: '1px solid #242018',
              borderRadius: '12px',
              padding: '20px',
              marginBottom: '16px',
            }}
          >
            <p
              style={{
                fontSize: '10px',
                fontWeight: 700,
                color: '#4a433d',
                marginBottom: '14px',
                textTransform: 'uppercase',
                letterSpacing: '1.4px',
              }}
            >
              Novo usuário
            </p>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="email"
                placeholder="Email"
                required
                value={createForm.email}
                onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                style={inputStyle}
                onFocus={inputFocus}
                onBlur={inputBlur}
              />
              <input
                type="password"
                placeholder="Senha"
                required
                minLength={6}
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                style={inputStyle}
                onFocus={inputFocus}
                onBlur={inputBlur}
              />
              <select
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                style={{ ...inputStyle, cursor: 'pointer' }}
              >
                <option value="user">Usuário</option>
                <option value="admin">Admin</option>
              </select>
              {createError && (
                <p style={{ fontSize: '12px', color: '#e05040', margin: 0 }}>{createError}</p>
              )}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="submit"
                  disabled={createLoading}
                  style={{
                    background: createLoading ? '#2a2420' : '#f07820',
                    color: createLoading ? '#4a433d' : '#0d0c0a',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '9px 18px',
                    fontSize: '12px',
                    fontWeight: 700,
                    fontFamily: 'inherit',
                    cursor: createLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  {createLoading ? 'Criando…' : 'Criar'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  style={{
                    background: 'none',
                    border: '1px solid #242018',
                    borderRadius: '8px',
                    padding: '9px 18px',
                    fontSize: '12px',
                    color: '#6b6058',
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    transition: 'border-color 150ms, color 150ms',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3a3530'; e.currentTarget.style.color = '#b0a899' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#242018'; e.currentTarget.style.color = '#6b6058' }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Error */}
        {error && (
          <p
            style={{
              fontSize: '12px',
              color: '#e05040',
              marginBottom: '12px',
              padding: '8px 12px',
              background: 'rgba(224,80,64,0.08)',
              borderRadius: '8px',
              border: '1px solid rgba(224,80,64,0.15)',
            }}
          >
            {error}
          </p>
        )}

        {/* User list */}
        <div
          style={{
            background: '#131110',
            border: '1px solid #242018',
            borderRadius: '12px',
            overflow: 'hidden',
          }}
        >
          {loading ? (
            <p style={{ padding: '24px', fontSize: '13px', color: '#4a433d', textAlign: 'center' }}>
              Carregando…
            </p>
          ) : users.length === 0 ? (
            <p style={{ padding: '24px', fontSize: '13px', color: '#4a433d', textAlign: 'center' }}>
              Nenhum usuário encontrado.
            </p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #242018' }}>
                  {['Email', 'Role', 'Criado em', 'Ações'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '10px 16px',
                        fontSize: '9px',
                        fontWeight: 700,
                        color: '#3a3530',
                        textTransform: 'uppercase',
                        letterSpacing: '1.4px',
                        textAlign: 'left',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <React.Fragment key={u._id}>
                    <tr
                      style={{
                        borderBottom: i < users.length - 1 ? '1px solid #1a1815' : 'none',
                        background: editId === u._id ? 'rgba(240,120,32,0.04)' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#b0a899' }}>{u.email}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            borderRadius: '4px',
                            padding: '2px 8px',
                            ...ROLE_BADGE[u.role],
                          }}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: '#4a433d' }}>
                        {formatDate(u.createdAt)}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '12px' }}>
                          <button
                            onClick={() => editId === u._id ? setEditId(null) : openEdit(u)}
                            style={{
                              fontSize: '11px',
                              color: '#f07820',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                              fontWeight: 600,
                              transition: 'color 150ms',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#ffa050')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#f07820')}
                          >
                            {editId === u._id ? 'Cancelar' : 'Editar'}
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(u._id)}
                            style={{
                              fontSize: '11px',
                              color: '#3a3530',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              fontFamily: 'inherit',
                              transition: 'color 150ms',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#e05040')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#3a3530')}
                          >
                            Remover
                          </button>
                        </div>
                      </td>
                    </tr>

                    {editId === u._id && (
                      <tr style={{ background: 'rgba(240,120,32,0.02)' }}>
                        <td colSpan={4} style={{ padding: '0 16px 16px' }}>
                          <form
                            onSubmit={handleEdit}
                            style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '12px' }}
                          >
                            <input
                              type="email"
                              required
                              value={editForm.email}
                              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                              style={inputStyle}
                              onFocus={inputFocus}
                              onBlur={inputBlur}
                            />
                            <input
                              type="password"
                              placeholder="Nova senha (opcional)"
                              minLength={6}
                              value={editForm.password}
                              onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                              style={inputStyle}
                              onFocus={inputFocus}
                              onBlur={inputBlur}
                            />
                            <select
                              value={editForm.role}
                              onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                              style={{ ...inputStyle, cursor: 'pointer' }}
                            >
                              <option value="user">Usuário</option>
                              <option value="admin">Admin</option>
                            </select>
                            {editError && (
                              <p style={{ fontSize: '12px', color: '#e05040', margin: 0 }}>{editError}</p>
                            )}
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                type="submit"
                                disabled={editLoading}
                                style={{
                                  background: editLoading ? '#2a2420' : '#f07820',
                                  color: editLoading ? '#4a433d' : '#0d0c0a',
                                  border: 'none',
                                  borderRadius: '8px',
                                  padding: '8px 16px',
                                  fontSize: '12px',
                                  fontWeight: 700,
                                  fontFamily: 'inherit',
                                  cursor: editLoading ? 'not-allowed' : 'pointer',
                                }}
                              >
                                {editLoading ? 'Salvando…' : 'Salvar'}
                              </button>
                            </div>
                          </form>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Delete confirmation modal */}
        {deleteConfirm && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 50,
              backdropFilter: 'blur(4px)',
            }}
          >
            <div
              style={{
                background: '#131110',
                border: '1px solid #242018',
                borderRadius: '14px',
                padding: '28px 24px',
                maxWidth: '360px',
                width: '100%',
                boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
              }}
            >
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#ede8df', marginBottom: '8px' }}>
                Remover usuário?
              </p>
              <p style={{ fontSize: '13px', color: '#6b6058', marginBottom: '24px' }}>
                Esta ação não pode ser desfeita.
              </p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  style={{
                    background: 'none',
                    border: '1px solid #242018',
                    borderRadius: '8px',
                    padding: '9px 16px',
                    fontSize: '12px',
                    color: '#6b6058',
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    transition: 'border-color 150ms, color 150ms',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#3a3530'; e.currentTarget.style.color = '#b0a899' }}
                  onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#242018'; e.currentTarget.style.color = '#6b6058' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  style={{
                    background: '#e05040',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '9px 16px',
                    fontSize: '12px',
                    fontWeight: 600,
                    fontFamily: 'inherit',
                    cursor: 'pointer',
                    transition: 'background 150ms',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#c03a2c')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#e05040')}
                >
                  Remover
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
