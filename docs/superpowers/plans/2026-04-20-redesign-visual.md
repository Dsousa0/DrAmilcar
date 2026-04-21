# Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Substituir a paleta genérica blue/gray e tipografia de sistema por identidade visual coesa: Neutro Premium (off-white/creme/âmbar), Lora no logo, Plus Jakarta Sans na UI.

**Architecture:** Pure styling — nenhuma lógica de negócio é alterada. Cada task modifica um arquivo (ou par de arquivos pequenos), verificada com `npm run build` sem erros. O ChatWindow recebe duas novas props (`activeTitle`, `docCount`) vindas do App.jsx para renderizar o header.

**Tech Stack:** React, TailwindCSS (classes `stone-*` + valores arbitrários `[#d6a96a]`), Google Fonts via `@import` em `index.css`.

---

## File Map

| Ação | Arquivo |
|---|---|
| Modify | `frontend/src/index.css` |
| Modify | `frontend/src/App.jsx` |
| Modify | `frontend/src/components/Conversations/ConversationList.jsx` |
| Modify | `frontend/src/components/Upload/UploadZone.jsx` |
| Modify | `frontend/src/components/Upload/ProgressBar.jsx` |
| Modify | `frontend/src/components/Documents/DocumentList.jsx` |
| Modify | `frontend/src/pages/Login.jsx` |
| Modify | `frontend/src/components/Chat/ChatInput.jsx` |
| Modify | `frontend/src/components/Chat/MessageBubble.jsx` |
| Modify | `frontend/src/components/Chat/ChatWindow.jsx` |

---

## Task 1: Fontes — index.css

**Files:**
- Modify: `frontend/src/index.css`

- [ ] **Step 1: Substituir o conteúdo de index.css**

```css
/* frontend/src/index.css */
@import url('https://fonts.googleapis.com/css2?family=Lora:wght@700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    font-family: 'Plus Jakarta Sans', sans-serif;
    background-color: #fffffe;
    color: #1c1917;
  }
}
```

- [ ] **Step 2: Verificar build**

```bash
cd frontend && npm run build
```

Expected: build conclui sem erros.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/index.css
git commit -m "style: add Lora + Plus Jakarta Sans fonts"
```

---

## Task 2: App.jsx — Shell da sidebar

**Files:**
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Reescrever App.jsx**

```jsx
// frontend/src/App.jsx
import { useAuth } from './context/AuthContext.jsx'
import Login from './pages/Login.jsx'
import { useDocuments } from './hooks/useDocuments.js'
import { useConversations } from './hooks/useConversations.js'
import UploadZone from './components/Upload/UploadZone.jsx'
import DocumentList from './components/Documents/DocumentList.jsx'
import ConversationList from './components/Conversations/ConversationList.jsx'
import ChatWindow from './components/Chat/ChatWindow.jsx'

function MainLayout() {
  const { user, logout } = useAuth()
  const { documents, loading: docsLoading, uploading, uploadProgress, error: docsError, upload, remove } = useDocuments()
  const {
    conversations,
    activeId,
    messages,
    selectConversation,
    newConversation,
    ensureActiveConversation,
    appendOptimistic,
    appendTokenToLast,
    refreshList,
  } = useConversations()

  const activeConv = conversations.find((c) => c._id === activeId)
  const activeTitle = activeConv?.title || 'Nova conversa'

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#fffffe' }}>
      {/* Sidebar */}
      <aside className="w-72 flex flex-col shrink-0" style={{ background: '#fafaf9', borderRight: '1px solid #e8e5e0' }}>

        {/* Header */}
        <div className="px-4 py-4" style={{ borderBottom: '1px solid #e8e5e0' }}>
          <h1 style={{ fontFamily: "'Lora', serif", fontSize: '18px', fontWeight: 700, color: '#1c1917', letterSpacing: '-0.3px' }}>
            DrAmilcar
          </h1>
          <p style={{ fontSize: '10px', color: '#a8a29e', marginTop: '3px', fontWeight: 400 }}>
            base de conhecimento
          </p>
        </div>

        {/* Conversations */}
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          onSelect={selectConversation}
          onNew={newConversation}
        />

        {/* Divider */}
        <div style={{ height: '1px', background: '#e8e5e0', margin: '4px 0 0' }} />

        {/* Upload */}
        <UploadZone onUpload={upload} uploading={uploading} progress={uploadProgress} />

        {/* Upload error */}
        {docsError && (
          <p style={{ fontSize: '11px', color: '#c25b4a', padding: '0 16px 8px' }}>{docsError}</p>
        )}

        {/* Document list */}
        <div className="flex-1 overflow-y-auto">
          <p style={{ fontSize: '9.5px', fontWeight: 700, color: '#a8a29e', letterSpacing: '1.4px', textTransform: 'uppercase', padding: '10px 16px 6px' }}>
            Documentos
          </p>
          <DocumentList documents={documents} loading={docsLoading} onRemove={remove} />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid #e8e5e0' }}>
          <p style={{ fontSize: '10px', color: '#a8a29e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
            {user?.email}
          </p>
          <button
            onClick={logout}
            style={{ fontSize: '10px', color: '#a8a29e', background: 'none', border: 'none', cursor: 'pointer' }}
            onMouseEnter={(e) => (e.target.style.color = '#c25b4a')}
            onMouseLeave={(e) => (e.target.style.color = '#a8a29e')}
          >
            sair
          </button>
        </div>
      </aside>

      {/* Chat */}
      <main className="flex-1 flex flex-col min-w-0">
        <ChatWindow
          messages={messages}
          conversationId={activeId}
          activeTitle={activeTitle}
          docCount={documents.length}
          appendOptimistic={appendOptimistic}
          appendTokenToLast={appendTokenToLast}
          ensureActiveConversation={ensureActiveConversation}
          refreshList={refreshList}
        />
      </main>
    </div>
  )
}

export default function App() {
  const { token } = useAuth()
  return token ? <MainLayout /> : <Login />
}
```

- [ ] **Step 2: Verificar build**

```bash
cd frontend && npm run build
```

Expected: build conclui sem erros.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "style: apply Neutro Premium palette to main layout"
```

---

## Task 3: ConversationList.jsx

**Files:**
- Modify: `frontend/src/components/Conversations/ConversationList.jsx`

- [ ] **Step 1: Reescrever ConversationList.jsx**

```jsx
// frontend/src/components/Conversations/ConversationList.jsx
export default function ConversationList({ conversations, activeId, onSelect, onNew }) {
  return (
    <div className="flex flex-col">
      {/* Section label */}
      <p style={{ fontSize: '9.5px', fontWeight: 700, color: '#a8a29e', letterSpacing: '1.4px', textTransform: 'uppercase', padding: '14px 16px 6px' }}>
        Conversas
      </p>

      {/* Nova conversa */}
      <div style={{ padding: '0 10px 8px' }}>
        <button
          onClick={onNew}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontSize: '11px',
            fontWeight: 500,
            color: '#78716c',
            background: 'none',
            border: '1.5px dashed #d6c5ae',
            borderRadius: '7px',
            padding: '7px 10px',
            cursor: 'pointer',
            transition: 'all 150ms',
            fontFamily: 'inherit',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#d6a96a'
            e.currentTarget.style.color = '#44403c'
            e.currentTarget.style.background = '#faf7f3'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#d6c5ae'
            e.currentTarget.style.color = '#78716c'
            e.currentTarget.style.background = 'none'
          }}
        >
          <span style={{ color: '#d6a96a', fontSize: '14px', lineHeight: 1 }}>＋</span>
          Nova conversa
        </button>
      </div>

      {/* List */}
      {conversations.length > 0 && (
        <ul className="overflow-y-auto" style={{ maxHeight: '180px' }}>
          {conversations.map((conv) => {
            const isActive = conv._id === activeId
            return (
              <li key={conv._id}>
                <button
                  onClick={() => onSelect(conv._id)}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: isActive ? '8px 10px 8px 8px' : '8px 10px',
                    fontSize: '11px',
                    fontWeight: isActive ? 500 : 400,
                    color: isActive ? '#292524' : '#78716c',
                    background: isActive ? '#f0ede8' : 'none',
                    borderLeft: isActive ? '2.5px solid #d6a96a' : '2.5px solid transparent',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: 'block',
                    margin: '1px 8px',
                    width: 'calc(100% - 16px)',
                    transition: 'all 120ms',
                    fontFamily: 'inherit',
                    border: 'none',
                  }}
                  onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = '#f5f3ef' }}
                  onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = 'none' }}
                >
                  {conv.title || 'Nova conversa'}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verificar build**

```bash
cd frontend && npm run build
```

Expected: build conclui sem erros.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/Conversations/ConversationList.jsx
git commit -m "style: apply stone/amber palette to ConversationList"
```

---

## Task 4: UploadZone.jsx + ProgressBar.jsx

**Files:**
- Modify: `frontend/src/components/Upload/UploadZone.jsx`
- Modify: `frontend/src/components/Upload/ProgressBar.jsx`

- [ ] **Step 1: Reescrever UploadZone.jsx**

```jsx
// frontend/src/components/Upload/UploadZone.jsx
import { useRef, useState } from 'react'
import ProgressBar from './ProgressBar.jsx'

export default function UploadZone({ onUpload, uploading, progress }) {
  const inputRef = useRef(null)
  const [dragging, setDragging] = useState(false)

  function handleFile(file) {
    if (!file || file.type !== 'application/pdf') return
    onUpload(file)
  }

  function handleDrop(e) {
    e.preventDefault()
    setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  return (
    <div style={{ padding: '8px 10px' }}>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        style={{
          border: `1.5px dashed ${dragging ? '#d6a96a' : '#d6c5ae'}`,
          borderRadius: '8px',
          padding: '10px',
          textAlign: 'center',
          cursor: uploading ? 'not-allowed' : 'pointer',
          opacity: uploading ? 0.6 : 1,
          background: dragging ? '#faf7f3' : 'transparent',
          transition: 'all 150ms',
        }}
        onMouseEnter={(e) => { if (!uploading && !dragging) { e.currentTarget.style.borderColor = '#d6a96a'; e.currentTarget.style.background = '#faf7f3' } }}
        onMouseLeave={(e) => { if (!dragging) { e.currentTarget.style.borderColor = '#d6c5ae'; e.currentTarget.style.background = 'transparent' } }}
      >
        <p style={{ fontSize: '10px', color: '#a8a29e' }}>
          {uploading ? 'Enviando…' : 'Soltar PDF ou clicar'}
        </p>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => handleFile(e.target.files[0])}
          disabled={uploading}
        />
      </div>
      {uploading && (
        <div style={{ marginTop: '6px' }}>
          <ProgressBar progress={progress} />
          <p style={{ fontSize: '10px', color: '#a8a29e', marginTop: '3px', textAlign: 'right' }}>{progress}%</p>
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Reescrever ProgressBar.jsx**

```jsx
// frontend/src/components/Upload/ProgressBar.jsx
export default function ProgressBar({ progress }) {
  return (
    <div style={{ width: '100%', background: '#e8e5e0', borderRadius: '9999px', height: '6px' }}>
      <div
        style={{
          width: `${progress}%`,
          height: '6px',
          borderRadius: '9999px',
          background: '#d6a96a',
          transition: 'width 200ms',
        }}
      />
    </div>
  )
}
```

- [ ] **Step 3: Verificar build**

```bash
cd frontend && npm run build
```

Expected: build conclui sem erros.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/components/Upload/UploadZone.jsx frontend/src/components/Upload/ProgressBar.jsx
git commit -m "style: apply stone/amber palette to UploadZone and ProgressBar"
```

---

## Task 5: DocumentList.jsx

**Files:**
- Modify: `frontend/src/components/Documents/DocumentList.jsx`

- [ ] **Step 1: Reescrever DocumentList.jsx**

```jsx
// frontend/src/components/Documents/DocumentList.jsx
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function DocumentList({ documents, loading, onRemove }) {
  if (loading) {
    return <p style={{ fontSize: '11px', color: '#a8a29e', padding: '4px 16px 8px' }}>Carregando…</p>
  }
  if (documents.length === 0) {
    return <p style={{ fontSize: '11px', color: '#a8a29e', padding: '4px 16px 8px' }}>Nenhum documento indexado.</p>
  }
  return (
    <ul style={{ padding: '0 10px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
      {documents.map((doc) => (
        <li
          key={doc._id}
          style={{ display: 'flex', alignItems: 'center', gap: '7px', padding: '7px 8px', borderRadius: '6px' }}
          className="group"
        >
          <span style={{ color: '#d6a96a', fontSize: '10px', flexShrink: 0 }}>◆</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: '10.5px', color: '#44403c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={doc.originalName}>
              {doc.originalName}
            </p>
            <p style={{ fontSize: '9.5px', color: '#a8a29e', marginTop: '1px' }}>
              {formatBytes(doc.sizeBytes)} · {doc.chunkCount} chunks
            </p>
          </div>
          <button
            onClick={() => onRemove(doc._id)}
            title="Remover"
            style={{ fontSize: '16px', color: '#a8a29e', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, flexShrink: 0, opacity: 0, transition: 'opacity 150ms, color 150ms' }}
            className="group-hover:opacity-100"
            onMouseEnter={(e) => (e.currentTarget.style.color = '#c25b4a')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#a8a29e')}
          >
            ×
          </button>
        </li>
      ))}
    </ul>
  )
}
```

- [ ] **Step 2: Verificar build**

```bash
cd frontend && npm run build
```

Expected: build conclui sem erros.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/Documents/DocumentList.jsx
git commit -m "style: apply stone palette to DocumentList"
```

---

## Task 6: Login.jsx

**Files:**
- Modify: `frontend/src/pages/Login.jsx`

- [ ] **Step 1: Reescrever Login.jsx**

```jsx
// frontend/src/pages/Login.jsx
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
```

- [ ] **Step 2: Verificar build**

```bash
cd frontend && npm run build
```

Expected: build conclui sem erros.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Login.jsx
git commit -m "style: apply Neutro Premium palette to Login page"
```

---

## Task 7: ChatInput.jsx

**Files:**
- Modify: `frontend/src/components/Chat/ChatInput.jsx`

- [ ] **Step 1: Reescrever ChatInput.jsx**

```jsx
// frontend/src/components/Chat/ChatInput.jsx
import { useState } from 'react'

export default function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState('')

  function handleSubmit(e) {
    e.preventDefault()
    const question = value.trim()
    if (!question || disabled) return
    onSend(question)
    setValue('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      handleSubmit(e)
    }
  }

  const canSend = !disabled && value.trim().length > 0

  return (
    <form
      onSubmit={handleSubmit}
      style={{ padding: '14px 20px 18px', borderTop: '1px solid #e8e5e0', background: '#fffffe' }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: '10px',
          background: '#f5f4f1',
          border: '1.5px solid #e8e5e0',
          borderRadius: '12px',
          padding: '10px 12px',
          transition: 'border-color 200ms',
        }}
        onFocusCapture={(e) => (e.currentTarget.style.borderColor = '#d6a96a')}
        onBlurCapture={(e) => (e.currentTarget.style.borderColor = '#e8e5e0')}
      >
        <textarea
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Faça uma pergunta sobre os documentos…"
          disabled={disabled}
          rows={2}
          style={{
            flex: 1,
            resize: 'none',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            fontSize: '13px',
            color: '#44403c',
            fontFamily: 'inherit',
            lineHeight: 1.55,
            opacity: disabled ? 0.5 : 1,
          }}
        />
        <button
          type="submit"
          disabled={!canSend}
          style={{
            width: '32px',
            height: '32px',
            background: canSend ? '#d6a96a' : '#e8e5e0',
            border: 'none',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: canSend ? 'pointer' : 'not-allowed',
            flexShrink: 0,
            fontSize: '15px',
            color: canSend ? '#fff' : '#a8a29e',
            fontWeight: 700,
            transition: 'background 150ms, color 150ms',
          }}
          onMouseEnter={(e) => { if (canSend) e.currentTarget.style.background = '#c4954f' }}
          onMouseLeave={(e) => { if (canSend) e.currentTarget.style.background = '#d6a96a' }}
        >
          ↑
        </button>
      </div>
    </form>
  )
}
```

- [ ] **Step 2: Verificar build**

```bash
cd frontend && npm run build
```

Expected: build conclui sem erros.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/Chat/ChatInput.jsx
git commit -m "style: apply stone/amber palette to ChatInput"
```

---

## Task 8: MessageBubble.jsx

**Files:**
- Modify: `frontend/src/components/Chat/MessageBubble.jsx`

- [ ] **Step 1: Reescrever MessageBubble.jsx**

```jsx
// frontend/src/components/Chat/MessageBubble.jsx
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

function ThinkingDots() {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '2px 0' }}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: '#c5bdb4',
            display: 'inline-block',
            animation: 'bounce 1.2s infinite',
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: translateY(0); }
          40% { transform: translateY(-5px); }
        }
      `}</style>
    </span>
  )
}

export default function MessageBubble({ role, content }) {
  const isUser = role === 'user'
  const isThinking = !isUser && content === ''

  return (
    <div style={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', alignItems: 'flex-start', gap: '8px', marginBottom: '14px' }}>
      {!isUser && (
        <div style={{
          width: '26px',
          height: '26px',
          background: '#f0ede8',
          border: '1.5px solid #e8e5e0',
          borderRadius: '50%',
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: "'Lora', serif",
          fontSize: '10px',
          fontWeight: 700,
          color: '#d6a96a',
          marginTop: '1px',
        }}>
          A
        </div>
      )}
      <div
        style={{
          maxWidth: '76%',
          padding: '10px 14px',
          fontSize: '13px',
          lineHeight: isUser ? 1.55 : 1.65,
          borderRadius: isUser ? '16px 16px 3px 16px' : '3px 16px 16px 16px',
          background: isUser ? '#292524' : '#f5f4f1',
          color: isUser ? '#fafaf9' : '#44403c',
        }}
      >
        {isUser ? (
          <p style={{ whiteSpace: 'pre-wrap', margin: 0 }}>{content}</p>
        ) : isThinking ? (
          <ThinkingDots />
        ) : (
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              code({ inline, children, ...props }) {
                return inline ? (
                  <code style={{ background: '#e8e5e0', color: '#44403c', borderRadius: '4px', padding: '1px 5px', fontSize: '12px' }} {...props}>
                    {children}
                  </code>
                ) : (
                  <pre style={{ background: '#1c1917', color: '#fafaf9', borderRadius: '8px', padding: '12px', overflowX: 'auto', fontSize: '12px', margin: '8px 0' }}>
                    <code {...props}>{children}</code>
                  </pre>
                )
              },
              p({ children }) {
                return <p style={{ margin: '0 0 8px', lastChild: { marginBottom: 0 } }}>{children}</p>
              },
            }}
          >
            {content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verificar build**

```bash
cd frontend && npm run build
```

Expected: build conclui sem erros.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/Chat/MessageBubble.jsx
git commit -m "style: apply stone bubbles + amber avatar to MessageBubble"
```

---

## Task 9: ChatWindow.jsx — Chat header + fundo

**Files:**
- Modify: `frontend/src/components/Chat/ChatWindow.jsx`

- [ ] **Step 1: Reescrever ChatWindow.jsx**

```jsx
// frontend/src/components/Chat/ChatWindow.jsx
import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble.jsx'
import ChatInput from './ChatInput.jsx'
import { useChat } from '../../hooks/useChat.js'

export default function ChatWindow({
  messages,
  conversationId,
  activeTitle,
  docCount,
  appendOptimistic,
  appendTokenToLast,
  ensureActiveConversation,
  refreshList,
}) {
  const { isStreaming, error, sendMessage } = useChat({
    conversationId,
    appendOptimistic,
    appendTokenToLast,
    ensureActiveConversation,
    refreshList,
  })
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#fffffe' }}>

      {/* Header */}
      <div style={{ padding: '14px 24px', borderBottom: '1px solid #e8e5e0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ fontSize: '14px', fontWeight: 600, color: '#1c1917', letterSpacing: '-0.2px' }}>
          {activeTitle || 'Nova conversa'}
        </span>
        {docCount > 0 && (
          <span style={{ fontSize: '11px', color: '#a8a29e' }}>
            {docCount} {docCount === 1 ? 'documento' : 'documentos'}
          </span>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 24px 8px', background: '#fffffe' }}>
        {messages.length === 0 && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <p style={{ fontSize: '13px', color: '#a8a29e', textAlign: 'center', lineHeight: 1.6 }}>
              {docCount === 0
                ? 'Faça upload de um PDF na barra lateral para começar.'
                : 'Faça uma pergunta sobre os documentos indexados.'}
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} role={msg.role} content={msg.content} />
        ))}
        {error && (
          <p style={{ fontSize: '12px', color: '#c25b4a', textAlign: 'center', marginBottom: '8px' }}>{error}</p>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <ChatInput onSend={sendMessage} disabled={isStreaming} />
    </div>
  )
}
```

- [ ] **Step 2: Verificar build**

```bash
cd frontend && npm run build
```

Expected: build conclui sem erros.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/Chat/ChatWindow.jsx
git commit -m "style: add chat header and apply stone palette to ChatWindow"
```

---

## Verificação Final

- [ ] **Checar no browser** — abrir `http://localhost:5173`
  - Logo "DrAmilcar" em Lora nos dois lugares (sidebar e login)
  - Nenhum elemento azul visível na UI
  - Acento âmbar `#d6a96a` nos: borda item ativo, botão enviar, avatar "A", link de cadastro, hover em upload
  - Bubble do usuário em `#292524` (stone escuro, não azul)
  - Dots de "pensando" sem texto "Pensando"
  - Empty state com texto contextual (sem documentos vs com documentos)
