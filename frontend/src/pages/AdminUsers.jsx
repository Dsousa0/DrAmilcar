import React, { useState, useEffect, useCallback } from 'react'
import { getUsers, createUser, updateUser, deleteUser } from '../services/api'

const ROLE_BADGE = {
  admin: { background: '#fef3e2', color: '#d6a96a', border: '1px solid #f0d9a8' },
  user: { background: '#f5f4f1', color: '#78716c', border: '1px solid #e8e5e0' },
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
    background: '#f5f4f1',
    border: '1.5px solid #e8e5e0',
    borderRadius: '8px',
    padding: '9px 12px',
    fontSize: '13px',
    color: '#44403c',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
  }

  const selectStyle = { ...inputStyle }

  return (
    <div style={{ minHeight: '100vh', background: '#f5f4f1', padding: '32px 24px' }}>
      <div style={{ maxWidth: '760px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '28px' }}>
          <button
            onClick={onBack}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#78716c', fontSize: '13px', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px', padding: '0' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#1c1917')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#78716c')}
          >
            ← Voltar
          </button>
          <h1 style={{ fontFamily: "'Lora', serif", fontSize: '22px', fontWeight: 700, color: '#1c1917', letterSpacing: '-0.3px', margin: 0 }}>
            Gestão de Usuários
          </h1>
          <button
            onClick={() => { setShowCreate(true); setCreateError('') }}
            style={{ marginLeft: 'auto', background: '#292524', color: '#fafaf9', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '12px', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#1c1917')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#292524')}
          >
            + Novo usuário
          </button>
        </div>

        {/* Create form */}
        {showCreate && (
          <div style={{ background: '#fffffe', border: '1px solid #e8e5e0', borderRadius: '12px', padding: '20px', marginBottom: '16px' }}>
            <p style={{ fontSize: '12px', fontWeight: 700, color: '#44403c', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '1px' }}>
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
                onFocus={(e) => (e.target.style.borderColor = '#d6a96a')}
                onBlur={(e) => (e.target.style.borderColor = '#e8e5e0')}
              />
              <input
                type="password"
                placeholder="Senha"
                required
                minLength={6}
                value={createForm.password}
                onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = '#d6a96a')}
                onBlur={(e) => (e.target.style.borderColor = '#e8e5e0')}
              />
              <select
                value={createForm.role}
                onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                style={selectStyle}
              >
                <option value="user">Usuário</option>
                <option value="admin">Admin</option>
              </select>
              {createError && <p style={{ fontSize: '12px', color: '#c25b4a', margin: 0 }}>{createError}</p>}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="submit"
                  disabled={createLoading}
                  style={{ background: '#292524', color: '#fafaf9', border: 'none', borderRadius: '8px', padding: '9px 18px', fontSize: '12px', fontWeight: 600, fontFamily: 'inherit', cursor: createLoading ? 'not-allowed' : 'pointer' }}
                >
                  {createLoading ? 'Criando…' : 'Criar'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  style={{ background: 'none', border: '1px solid #e8e5e0', borderRadius: '8px', padding: '9px 18px', fontSize: '12px', color: '#78716c', fontFamily: 'inherit', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Error */}
        {error && <p style={{ fontSize: '12px', color: '#c25b4a', marginBottom: '12px' }}>{error}</p>}

        {/* User list */}
        <div style={{ background: '#fffffe', border: '1px solid #e8e5e0', borderRadius: '12px', overflow: 'hidden' }}>
          {loading ? (
            <p style={{ padding: '24px', fontSize: '13px', color: '#a8a29e', textAlign: 'center' }}>Carregando…</p>
          ) : users.length === 0 ? (
            <p style={{ padding: '24px', fontSize: '13px', color: '#a8a29e', textAlign: 'center' }}>Nenhum usuário encontrado.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e8e5e0' }}>
                  {['Email', 'Role', 'Criado em', 'Ações'].map((h) => (
                    <th key={h} style={{ padding: '10px 16px', fontSize: '10px', fontWeight: 700, color: '#a8a29e', textTransform: 'uppercase', letterSpacing: '1px', textAlign: 'left' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((u, i) => (
                  <React.Fragment key={u._id}>
                    <tr style={{ borderBottom: i < users.length - 1 ? '1px solid #f0ede8' : 'none', background: editId === u._id ? '#fafaf9' : 'transparent' }}>
                      <td style={{ padding: '12px 16px', fontSize: '13px', color: '#44403c' }}>{u.email}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 600, borderRadius: '4px', padding: '2px 7px', ...ROLE_BADGE[u.role] }}>
                          {u.role}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: '12px', color: '#a8a29e' }}>{formatDate(u.createdAt)}</td>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button
                            onClick={() => editId === u._id ? setEditId(null) : openEdit(u)}
                            style={{ fontSize: '11px', color: '#d6a96a', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
                          >
                            {editId === u._id ? 'Cancelar' : 'Editar'}
                          </button>
                          <button
                            onClick={() => setDeleteConfirm(u._id)}
                            style={{ fontSize: '11px', color: '#a8a29e', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = '#c25b4a')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = '#a8a29e')}
                          >
                            Remover
                          </button>
                        </div>
                      </td>
                    </tr>

                    {editId === u._id && (
                      <tr>
                        <td colSpan={4} style={{ padding: '0 16px 16px' }}>
                          <form onSubmit={handleEdit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', paddingTop: '12px' }}>
                            <input
                              type="email"
                              required
                              value={editForm.email}
                              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                              style={inputStyle}
                              onFocus={(e) => (e.target.style.borderColor = '#d6a96a')}
                              onBlur={(e) => (e.target.style.borderColor = '#e8e5e0')}
                            />
                            <input
                              type="password"
                              placeholder="Nova senha (opcional)"
                              minLength={6}
                              value={editForm.password}
                              onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                              style={inputStyle}
                              onFocus={(e) => (e.target.style.borderColor = '#d6a96a')}
                              onBlur={(e) => (e.target.style.borderColor = '#e8e5e0')}
                            />
                            <select
                              value={editForm.role}
                              onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                              style={selectStyle}
                            >
                              <option value="user">Usuário</option>
                              <option value="admin">Admin</option>
                            </select>
                            {editError && <p style={{ fontSize: '12px', color: '#c25b4a', margin: 0 }}>{editError}</p>}
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button
                                type="submit"
                                disabled={editLoading}
                                style={{ background: '#292524', color: '#fafaf9', border: 'none', borderRadius: '8px', padding: '8px 16px', fontSize: '12px', fontWeight: 600, fontFamily: 'inherit', cursor: editLoading ? 'not-allowed' : 'pointer' }}
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

        {/* Delete confirmation */}
        {deleteConfirm && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(28,25,23,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
            <div style={{ background: '#fffffe', borderRadius: '12px', padding: '28px 24px', maxWidth: '360px', width: '100%', boxShadow: '0 8px 32px rgba(28,25,23,0.16)' }}>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#1c1917', marginBottom: '8px' }}>Remover usuário?</p>
              <p style={{ fontSize: '13px', color: '#78716c', marginBottom: '20px' }}>Esta ação não pode ser desfeita.</p>
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setDeleteConfirm(null)}
                  style={{ background: 'none', border: '1px solid #e8e5e0', borderRadius: '8px', padding: '9px 16px', fontSize: '12px', color: '#78716c', fontFamily: 'inherit', cursor: 'pointer' }}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => handleDelete(deleteConfirm)}
                  style={{ background: '#c25b4a', color: '#fffffe', border: 'none', borderRadius: '8px', padding: '9px 16px', fontSize: '12px', fontWeight: 600, fontFamily: 'inherit', cursor: 'pointer' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#a84a3a')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '#c25b4a')}
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
