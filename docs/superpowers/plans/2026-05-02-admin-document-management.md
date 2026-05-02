# Admin-Only Document Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restrict document upload/delete to admin users, consolidate all documents into a shared global ChromaDB collection, and add tab navigation so regular users can view documents read-only via a sidebar.

**Architecture:** The backend replaces per-user ChromaDB collections (`user_{userId}`) with a single `global_documents` collection; upload and delete routes gain `requireAdmin` middleware (already implemented in `auth.middleware.js`). The frontend adds `activeView` state to `App.jsx` toggling between Chat and a new `DocumentsPage`; `DocumentList` gains a `canDelete` prop so admins see delete buttons and regular users see a read-only list.

**Tech Stack:** Node.js + Express + ChromaDB (backend); Jest + Supertest (backend tests); React + Vite + TailwindCSS (frontend, no test framework — verify manually).

---

## File Map

**Backend — Modify:**
- `backend/src/services/vector.service.js` — replace per-user collection logic with global `global_documents` constant
- `backend/src/controllers/documents.controller.js` — remove `userId` filter from list/delete; use global collection in upload
- `backend/src/routes/documents.routes.js` — add `requireAdmin` to `POST /upload` and `DELETE /:id`
- `backend/src/controllers/chat.controller.js` — remove `userId` from `countDocuments` and `queryChunks` calls

**Backend — Create:**
- `backend/tests/setup.js` — Jest setup file (sets required env vars for test environment)
- `backend/tests/documents.routes.test.js` — route-level tests for access control (401/403)

**Frontend — Modify:**
- `frontend/src/components/Documents/DocumentList.jsx` — add `canDelete` prop; render delete button conditionally
- `frontend/src/App.jsx` — add `activeView` state, nav tabs, render `DocumentsPage` or `ChatWindow`

**Frontend — Create:**
- `frontend/src/pages/DocumentsPage.jsx` — combines `UploadZone` + `DocumentList`, role-aware rendering

---

## Task 1: Refactor vector.service.js to global collection

**Files:**
- Modify: `backend/src/services/vector.service.js`

- [ ] **Step 1: Replace per-user collection logic with a global constant**

Replace the full contents of `backend/src/services/vector.service.js`:

```javascript
const { chroma } = require('../config/chroma')
const logger = require('../utils/logger')

const GLOBAL_COLLECTION = 'global_documents'

async function getOrCreateCollection() {
  return chroma.getOrCreateCollection({
    name: GLOBAL_COLLECTION,
    metadata: { 'hnsw:space': 'cosine' },
  })
}

async function addChunks({ documentId, chunks, embeddings }) {
  const collection = await getOrCreateCollection()
  const ids = chunks.map((_, i) => `${documentId}_${i}`)
  await collection.add({
    ids,
    embeddings,
    documents: chunks,
    metadatas: chunks.map(() => ({ documentId })),
  })
  logger.info({ documentId, count: chunks.length }, 'Chunks added to ChromaDB')
}

async function queryChunks({ queryEmbedding, nResults = 5 }) {
  const collection = await getOrCreateCollection()
  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults,
  })
  return results.documents[0] || []
}

async function deleteDocumentChunks({ documentId }) {
  const collection = await getOrCreateCollection()
  const existing = await collection.get({ where: { documentId } })
  if (existing.ids.length > 0) {
    await collection.delete({ ids: existing.ids })
  }
  logger.info({ documentId, deleted: existing.ids.length }, 'Chunks deleted from ChromaDB')
}

module.exports = { addChunks, queryChunks, deleteDocumentChunks }
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/services/vector.service.js
git commit -m "refactor: switch vector service to global_documents collection"
```

---

## Task 2: Update documents.controller.js

**Files:**
- Modify: `backend/src/controllers/documents.controller.js`

- [ ] **Step 1: Update listDocuments — remove userId filter**

On line 9, change:
```javascript
const docs = await Document.find({ userId: req.user.userId }).sort({ createdAt: -1 })
```
to:
```javascript
const docs = await Document.find({}).sort({ createdAt: -1 })
```

- [ ] **Step 2: Update uploadDocument — use global collection, remove userId from vectorService call**

Replace lines 36–49 (the `Document.create` + `vectorService.addChunks` block):

```javascript
    const doc = await Document.create({
      userId,
      originalName: originalname,
      sizeBytes: size,
      chunkCount: chunks.length,
      chromaCollection: 'global_documents',
    })

    await vectorService.addChunks({
      documentId: doc._id.toString(),
      chunks,
      embeddings,
    })
```

- [ ] **Step 3: Update deleteDocument — remove ownership check**

Replace the entire `deleteDocument` function:

```javascript
async function deleteDocument(req, res, next) {
  try {
    const { id } = req.params

    const doc = await Document.findById(id)
    if (!doc) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Document not found' },
      })
    }

    await vectorService.deleteDocumentChunks({ documentId: id })
    await Document.deleteOne({ _id: id })

    res.status(204).send()
  } catch (err) {
    next(err)
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/controllers/documents.controller.js
git commit -m "refactor: global collection in upload, remove userId ownership checks"
```

---

## Task 3: Protect routes with requireAdmin + write tests

**Files:**
- Create: `backend/tests/setup.js`
- Create: `backend/tests/documents.routes.test.js`
- Modify: `backend/src/routes/documents.routes.js`

- [ ] **Step 1: Create tests/setup.js**

Create `backend/tests/setup.js`:

```javascript
process.env.NODE_ENV = 'test'
process.env.MONGODB_URI = 'mongodb://localhost:27017/dramilcar-test'
process.env.CHROMA_URL = 'http://localhost:8000'
process.env.OPENROUTER_API_KEY = 'test-key-placeholder'
process.env.OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1'
process.env.JWT_SECRET = 'test-secret-key-minimum-32-chars!!'
process.env.JWT_EXPIRES_IN = '24h'
```

- [ ] **Step 2: Write failing tests**

Create `backend/tests/documents.routes.test.js`:

```javascript
const request = require('supertest')
const jwt = require('jsonwebtoken')

const JWT_SECRET = 'test-secret-key-minimum-32-chars!!'

function makeToken(role) {
  return jwt.sign({ userId: 'aaaaaaaaaaaaaaaaaaaaaaaa', email: 'test@test.com', role }, JWT_SECRET)
}

// Lazy-load app so setup.js env vars are set first
let app
beforeAll(() => {
  app = require('../src/app')
})

describe('POST /api/documents/upload', () => {
  it('returns 401 when no token provided', async () => {
    const res = await request(app)
      .post('/api/documents/upload')
      .attach('file', Buffer.from('%PDF-1.4 fake'), { filename: 'test.pdf', contentType: 'application/pdf' })
    expect(res.status).toBe(401)
  })

  it('returns 403 for non-admin users', async () => {
    const token = makeToken('user')
    const res = await request(app)
      .post('/api/documents/upload')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('%PDF-1.4 fake'), { filename: 'test.pdf', contentType: 'application/pdf' })
    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })
})

describe('DELETE /api/documents/:id', () => {
  it('returns 401 when no token provided', async () => {
    const res = await request(app).delete('/api/documents/507f1f77bcf86cd799439011')
    expect(res.status).toBe(401)
  })

  it('returns 403 for non-admin users', async () => {
    const token = makeToken('user')
    const res = await request(app)
      .delete('/api/documents/507f1f77bcf86cd799439011')
      .set('Authorization', `Bearer ${token}`)
    expect(res.status).toBe(403)
    expect(res.body.error.code).toBe('FORBIDDEN')
  })
})

describe('GET /api/documents', () => {
  it('returns 401 when no token provided', async () => {
    const res = await request(app).get('/api/documents')
    expect(res.status).toBe(401)
  })
})
```

- [ ] **Step 3: Run tests — expect them to FAIL (upload/delete not yet protected)**

```bash
cd backend && npm test -- --testPathPattern=documents.routes
```
Expected output: FAIL — the upload and delete tests for non-admin return something other than 403.

- [ ] **Step 4: Add requireAdmin to routes**

Replace the full contents of `backend/src/routes/documents.routes.js`:

```javascript
const { Router } = require('express')
const { authenticate, requireAdmin } = require('../middleware/auth.middleware')
const { upload } = require('../middleware/upload.middleware')
const {
  listDocuments,
  uploadDocument,
  deleteDocument,
} = require('../controllers/documents.controller')

const router = Router()
router.use(authenticate)
router.get('/', listDocuments)
router.post('/upload', requireAdmin, upload.single('file'), uploadDocument)
router.delete('/:id', requireAdmin, deleteDocument)

module.exports = router
```

- [ ] **Step 5: Run tests — expect them to PASS**

```bash
cd backend && npm test -- --testPathPattern=documents.routes
```
Expected output: PASS — all 5 tests green.

- [ ] **Step 6: Commit**

```bash
git add backend/tests/setup.js backend/tests/documents.routes.test.js backend/src/routes/documents.routes.js
git commit -m "feat: restrict document upload and delete to admin users"
```

---

## Task 4: Update chat.controller.js to query global collection

**Files:**
- Modify: `backend/src/controllers/chat.controller.js`

- [ ] **Step 1: Remove userId from countDocuments**

On line 18, change:
```javascript
const docCount = await Document.countDocuments({ userId })
```
to:
```javascript
const docCount = await Document.countDocuments({})
```

- [ ] **Step 2: Remove userId from queryChunks call**

On line 36, change:
```javascript
const chunks = await queryChunks({ userId, queryEmbedding, nResults: 5 })
```
to:
```javascript
const chunks = await queryChunks({ queryEmbedding, nResults: 5 })
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/controllers/chat.controller.js
git commit -m "refactor: chat queries global_documents collection for all users"
```

---

## Task 5: Add canDelete prop to DocumentList.jsx

**Files:**
- Modify: `frontend/src/components/Documents/DocumentList.jsx`

- [ ] **Step 1: Add canDelete prop and make delete button conditional**

Replace the full contents of `frontend/src/components/Documents/DocumentList.jsx`:

```jsx
function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function DocumentList({ documents, loading, onRemove, canDelete }) {
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
          {canDelete && (
            <button
              onClick={() => onRemove(doc._id)}
              title="Remover"
              style={{ fontSize: '16px', color: '#a8a29e', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1, flexShrink: 0, opacity: 0.35, transition: 'opacity 150ms, color 150ms' }}
              onMouseEnter={(e) => { e.currentTarget.style.opacity = '1'; e.currentTarget.style.color = '#c25b4a' }}
              onMouseLeave={(e) => { e.currentTarget.style.opacity = '0.35'; e.currentTarget.style.color = '#a8a29e' }}
            >
              ×
            </button>
          )}
        </li>
      ))}
    </ul>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/Documents/DocumentList.jsx
git commit -m "feat: add canDelete prop to DocumentList for role-based delete visibility"
```

---

## Task 6: Create DocumentsPage.jsx

**Files:**
- Create: `frontend/src/pages/DocumentsPage.jsx`

- [ ] **Step 1: Create the file**

Create `frontend/src/pages/DocumentsPage.jsx`:

```jsx
import UploadZone from '../components/Upload/UploadZone.jsx'
import DocumentList from '../components/Documents/DocumentList.jsx'

export default function DocumentsPage({ isAdmin, upload, uploading, uploadProgress, documents, loading, error, onRemove }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '24px 32px 16px', borderBottom: '1px solid #e8e5e0', flexShrink: 0 }}>
        <h2 style={{ fontFamily: "'Lora', serif", fontSize: '16px', fontWeight: 700, color: '#1c1917' }}>
          {isAdmin ? 'Gerenciar Documentos' : 'Documentos'}
        </h2>
        <p style={{ fontSize: '11px', color: '#a8a29e', marginTop: '4px' }}>
          {isAdmin
            ? 'Faça upload de PDFs para indexar na base de conhecimento.'
            : 'Documentos disponíveis na base de conhecimento.'}
        </p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 24px' }}>
        {isAdmin && (
          <div style={{ marginBottom: '16px' }}>
            <UploadZone onUpload={upload} uploading={uploading} progress={uploadProgress} />
            {error && (
              <p style={{ fontSize: '11px', color: '#c25b4a', marginTop: '6px' }}>{error}</p>
            )}
          </div>
        )}

        <p style={{ fontSize: '9.5px', fontWeight: 700, color: '#a8a29e', letterSpacing: '1.4px', textTransform: 'uppercase', marginBottom: '6px' }}>
          Documentos indexados
        </p>
        <DocumentList
          documents={documents}
          loading={loading}
          onRemove={onRemove}
          canDelete={isAdmin}
        />
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/DocumentsPage.jsx
git commit -m "feat: add DocumentsPage with role-aware upload and read-only list"
```

---

## Task 7: Refactor App.jsx with sidebar navigation

**Files:**
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Replace App.jsx with the new sidebar + activeView layout**

Replace the full contents of `frontend/src/App.jsx`:

```jsx
import { useState } from 'react'
import { useAuth } from './context/AuthContext.jsx'
import Login from './pages/Login.jsx'
import AdminUsers from './pages/AdminUsers.jsx'
import DocumentsPage from './pages/DocumentsPage.jsx'
import { useDocuments } from './hooks/useDocuments.js'
import { useConversations } from './hooks/useConversations.js'
import ConversationList from './components/Conversations/ConversationList.jsx'
import ChatWindow from './components/Chat/ChatWindow.jsx'

function NavButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'block',
        width: '100%',
        textAlign: 'left',
        padding: '6px 12px',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: active ? 600 : 400,
        color: active ? '#1c1917' : '#a8a29e',
        background: active ? '#f0ede8' : 'none',
        border: 'none',
        cursor: 'pointer',
        fontFamily: 'inherit',
        transition: 'all 150ms',
      }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = '#44403c' }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = '#a8a29e' }}
    >
      {children}
    </button>
  )
}

function MainLayout() {
  const { user, isAdmin, logout } = useAuth()
  const [adminView, setAdminView] = useState(false)
  const [activeView, setActiveView] = useState('chat')
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

  if (adminView) {
    return <AdminUsers onBack={() => setAdminView(false)} />
  }

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

        {/* Nav tabs */}
        <div style={{ padding: '8px', borderBottom: '1px solid #e8e5e0', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <NavButton active={activeView === 'chat'} onClick={() => setActiveView('chat')}>
            Chat
          </NavButton>
          <NavButton active={activeView === 'documents'} onClick={() => setActiveView('documents')}>
            Documentos
          </NavButton>
        </div>

        {/* Conversations */}
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          onSelect={(id) => { selectConversation(id); setActiveView('chat') }}
          onNew={() => { newConversation(); setActiveView('chat') }}
        />

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid #e8e5e0' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
            <p style={{ fontSize: '10px', color: '#a8a29e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
              {user?.email}
            </p>
            {isAdmin && (
              <button
                onClick={() => setAdminView(true)}
                style={{ fontSize: '10px', color: '#d6a96a', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left', padding: '0', fontWeight: 600 }}
                onMouseEnter={(e) => (e.currentTarget.style.color = '#c4954f')}
                onMouseLeave={(e) => (e.currentTarget.style.color = '#d6a96a')}
              >
                Usuários
              </button>
            )}
          </div>
          <button
            onClick={logout}
            style={{ fontSize: '10px', color: '#a8a29e', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
            onMouseEnter={(e) => (e.target.style.color = '#c25b4a')}
            onMouseLeave={(e) => (e.target.style.color = '#a8a29e')}
          >
            sair
          </button>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 flex flex-col min-w-0">
        {activeView === 'chat' ? (
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
        ) : (
          <DocumentsPage
            isAdmin={isAdmin}
            upload={upload}
            uploading={uploading}
            uploadProgress={uploadProgress}
            documents={documents}
            loading={docsLoading}
            error={docsError}
            onRemove={remove}
          />
        )}
      </main>
    </div>
  )
}

export default function App() {
  const { token } = useAuth()
  return token ? <MainLayout /> : <Login />
}
```

- [ ] **Step 2: Verify manually in the browser**

Start the dev server:
```bash
cd frontend && npm run dev
```

Check these scenarios:

**Admin user:**
1. Login → sidebar shows "Chat" and "Documentos" nav tabs
2. Click "Documentos" → see heading "Gerenciar Documentos" + UploadZone + empty list
3. Upload a PDF → document appears in list with × delete button
4. Click "Chat" → ChatWindow appears; selecting a conversation auto-switches to Chat view
5. Chat works and uses the uploaded document as context

**Regular user:**
1. Login → sidebar shows "Chat" and "Documentos" nav tabs
2. Click "Documentos" → see heading "Documentos" + NO UploadZone + list of admin-uploaded docs (no delete buttons)
3. Click "Chat" → ChatWindow appears
4. Chat works and can query the admin-uploaded documents

- [ ] **Step 3: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat: add Chat/Documentos sidebar navigation with role-aware views"
```

---

## Task 8: Run backend tests and final check

- [ ] **Step 1: Run full backend test suite**

```bash
cd backend && npm test
```
Expected: all 5 tests in `documents.routes.test.js` pass — PASS.

- [ ] **Step 2: Final commit if any fixes were needed during manual testing**

```bash
git add -A
git commit -m "fix: address issues found during manual verification"
```
