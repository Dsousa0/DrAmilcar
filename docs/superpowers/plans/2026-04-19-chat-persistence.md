# Chat Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Persist chat conversations to MongoDB so users keep history across sessions, can switch between past conversations, and can reset with a "Nova Conversa" button.

**Architecture:** A new `Conversation` Mongoose model stores messages as an embedded array. The existing chat stream endpoint is extended to accept `conversationId` and saves both messages after streaming completes. The frontend gains a `useConversations` hook that manages conversation list + active messages, wired into the sidebar and ChatWindow.

**Tech Stack:** Mongoose, Express, React hooks, axios (existing patterns throughout)

---

## File Map

| Action | Path |
|--------|------|
| Create | `backend/src/models/Conversation.model.js` |
| Create | `backend/src/services/conversation.service.js` |
| Create | `backend/src/controllers/conversations.controller.js` |
| Create | `backend/src/routes/conversations.routes.js` |
| Create | `backend/tests/unit/conversation.service.test.js` |
| Modify | `backend/src/controllers/chat.controller.js` |
| Modify | `backend/src/app.js` |
| Modify | `frontend/src/services/api.js` |
| Create | `frontend/src/hooks/useConversations.js` |
| Modify | `frontend/src/hooks/useChat.js` |
| Create | `frontend/src/components/Conversations/ConversationList.jsx` |
| Modify | `frontend/src/components/Chat/ChatWindow.jsx` |
| Modify | `frontend/src/App.jsx` |

---

## Task 1: Conversation Mongoose Model

**Files:**
- Create: `backend/src/models/Conversation.model.js`

- [ ] **Step 1: Write the model**

```js
// backend/src/models/Conversation.model.js
const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
})

const conversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: { type: String, default: '' },
  messages: [messageSchema],
}, { timestamps: true })

conversationSchema.set('toJSON', {
  transform: (_, obj) => {
    delete obj.__v
    return obj
  },
})

module.exports = mongoose.model('Conversation', conversationSchema)
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/models/Conversation.model.js
git commit -m "feat: add Conversation mongoose model"
```

---

## Task 2: Conversation Service

**Files:**
- Create: `backend/src/services/conversation.service.js`
- Create: `backend/tests/unit/conversation.service.test.js`

- [ ] **Step 1: Write the failing tests**

```js
// backend/tests/unit/conversation.service.test.js
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')
const conversationService = require('../../src/services/conversation.service')

let mongod

beforeAll(async () => {
  mongod = await MongoMemoryServer.create()
  await mongoose.connect(mongod.getUri())
})

afterAll(async () => {
  await mongoose.disconnect()
  await mongod.stop()
})

afterEach(async () => {
  await mongoose.connection.db.dropDatabase()
})

const uid = () => new mongoose.Types.ObjectId()

describe('createConversation', () => {
  it('creates a conversation with empty messages and empty title', async () => {
    const userId = uid()
    const conv = await conversationService.createConversation(userId)
    expect(conv.userId.toString()).toBe(userId.toString())
    expect(conv.messages).toHaveLength(0)
    expect(conv.title).toBe('')
  })
})

describe('listConversations', () => {
  it('returns conversations sorted newest first without messages', async () => {
    const userId = uid()
    const c1 = await conversationService.createConversation(userId)
    const c2 = await conversationService.createConversation(userId)
    const list = await conversationService.listConversations(userId)
    expect(list).toHaveLength(2)
    expect(list[0]._id.toString()).toBe(c2._id.toString())
    expect(list[0].messages).toBeUndefined()
  })

  it('returns empty array when user has no conversations', async () => {
    const list = await conversationService.listConversations(uid())
    expect(list).toHaveLength(0)
  })
})

describe('getConversation', () => {
  it('returns full conversation with messages for correct user', async () => {
    const userId = uid()
    const conv = await conversationService.createConversation(userId)
    const found = await conversationService.getConversation(userId, conv._id)
    expect(found._id.toString()).toBe(conv._id.toString())
    expect(Array.isArray(found.messages)).toBe(true)
  })

  it('returns null when conversationId belongs to a different user', async () => {
    const userId = uid()
    const conv = await conversationService.createConversation(userId)
    const result = await conversationService.getConversation(uid(), conv._id)
    expect(result).toBeNull()
  })
})

describe('appendMessages', () => {
  it('appends user and assistant messages and sets title from first user message', async () => {
    const userId = uid()
    const conv = await conversationService.createConversation(userId)
    await conversationService.appendMessages(conv._id, 'Hello world question', 'Hello answer')
    const updated = await conversationService.getConversation(userId, conv._id)
    expect(updated.messages).toHaveLength(2)
    expect(updated.messages[0].role).toBe('user')
    expect(updated.messages[0].content).toBe('Hello world question')
    expect(updated.messages[1].role).toBe('assistant')
    expect(updated.messages[1].content).toBe('Hello answer')
    expect(updated.title).toBe('Hello world question')
  })

  it('does not overwrite an existing title on subsequent messages', async () => {
    const userId = uid()
    const conv = await conversationService.createConversation(userId)
    await conversationService.appendMessages(conv._id, 'First question', 'First answer')
    await conversationService.appendMessages(conv._id, 'Second question', 'Second answer')
    const updated = await conversationService.getConversation(userId, conv._id)
    expect(updated.title).toBe('First question')
    expect(updated.messages).toHaveLength(4)
  })

  it('truncates title to 60 characters', async () => {
    const userId = uid()
    const conv = await conversationService.createConversation(userId)
    const longQuestion = 'A'.repeat(80)
    await conversationService.appendMessages(conv._id, longQuestion, 'answer')
    const updated = await conversationService.getConversation(userId, conv._id)
    expect(updated.title).toHaveLength(60)
  })
})
```

- [ ] **Step 2: Run tests — expect FAIL**

```bash
cd backend && npx jest tests/unit/conversation.service.test.js --no-coverage
```

Expected: FAIL — "Cannot find module '../../src/services/conversation.service'"

- [ ] **Step 3: Write the service**

```js
// backend/src/services/conversation.service.js
const Conversation = require('../models/Conversation.model')

async function createConversation(userId) {
  return Conversation.create({ userId, title: '', messages: [] })
}

async function listConversations(userId) {
  return Conversation.find({ userId })
    .select('_id title updatedAt')
    .sort({ updatedAt: -1 })
    .lean()
}

async function getConversation(userId, conversationId) {
  return Conversation.findOne({ _id: conversationId, userId })
}

async function appendMessages(conversationId, userContent, assistantContent) {
  const now = new Date()
  const conv = await Conversation.findById(conversationId)
  if (!conv) return

  const setTitle = conv.title === '' ? userContent.slice(0, 60) : conv.title

  await Conversation.updateOne(
    { _id: conversationId },
    {
      $set: { title: setTitle },
      $push: {
        messages: {
          $each: [
            { role: 'user', content: userContent, createdAt: now },
            { role: 'assistant', content: assistantContent, createdAt: now },
          ],
        },
      },
    }
  )
}

module.exports = { createConversation, listConversations, getConversation, appendMessages }
```

- [ ] **Step 4: Run tests — expect PASS**

```bash
cd backend && npx jest tests/unit/conversation.service.test.js --no-coverage
```

Expected: 7 tests passing, 0 failures

- [ ] **Step 5: Commit**

```bash
git add backend/src/services/conversation.service.js backend/tests/unit/conversation.service.test.js
git commit -m "feat: add conversation service with tests"
```

---

## Task 3: Conversations Controller + Routes + Register in app.js

**Files:**
- Create: `backend/src/controllers/conversations.controller.js`
- Create: `backend/src/routes/conversations.routes.js`
- Modify: `backend/src/app.js`

- [ ] **Step 1: Write the controller**

```js
// backend/src/controllers/conversations.controller.js
const {
  createConversation,
  listConversations,
  getConversation,
} = require('../services/conversation.service')

async function list(req, res) {
  const conversations = await listConversations(req.user.userId)
  res.json({ data: conversations })
}

async function create(req, res) {
  const conv = await createConversation(req.user.userId)
  res.status(201).json(conv)
}

async function get(req, res) {
  const conv = await getConversation(req.user.userId, req.params.id)
  if (!conv) return res.status(404).json({ error: { message: 'Conversation not found' } })
  res.json(conv)
}

module.exports = { list, create, get }
```

- [ ] **Step 2: Write the routes**

```js
// backend/src/routes/conversations.routes.js
const { Router } = require('express')
const { authenticate } = require('../middleware/auth.middleware')
const { list, create, get } = require('../controllers/conversations.controller')

const router = Router()
router.use(authenticate)
router.get('/', list)
router.post('/', create)
router.get('/:id', get)

module.exports = router
```

- [ ] **Step 3: Register route in app.js**

Open `backend/src/app.js`. After line `const chatRoutes = require('./routes/chat.routes')`, add:

```js
const conversationsRoutes = require('./routes/conversations.routes')
```

After `app.use('/api/chat', chatRoutes)`, add:

```js
app.use('/api/conversations', conversationsRoutes)
```

Full `app.js` after change:

```js
const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const pinoHttp = require('pino-http')
const env = require('./config/env')
const logger = require('./utils/logger')

const authRoutes = require('./routes/auth.routes')
const documentsRoutes = require('./routes/documents.routes')
const chatRoutes = require('./routes/chat.routes')
const conversationsRoutes = require('./routes/conversations.routes')
const { errorHandler } = require('./middleware/error.middleware')

const app = express()

app.use(helmet())
app.use(cors({ origin: env.CORS_ORIGIN || '*' }))
app.use(express.json({ limit: '1mb' }))
app.use(pinoHttp({ logger }))

app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
}))

app.get('/health', (req, res) => res.json({ status: 'ok' }))

app.use('/api/auth', authRoutes)
app.use('/api/documents', documentsRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/conversations', conversationsRoutes)

app.use(errorHandler)

module.exports = app
```

- [ ] **Step 4: Run all backend tests — expect PASS**

```bash
cd backend && npx jest --no-coverage
```

Expected: all existing tests + conversation service tests passing

- [ ] **Step 5: Commit**

```bash
git add backend/src/controllers/conversations.controller.js backend/src/routes/conversations.routes.js backend/src/app.js
git commit -m "feat: add conversations routes and controller"
```

---

## Task 4: Extend chat.controller.js to Persist Messages

**Files:**
- Modify: `backend/src/controllers/chat.controller.js`

- [ ] **Step 1: Rewrite chat.controller.js**

```js
// backend/src/controllers/chat.controller.js
const { embedQuery } = require('../services/embedding.service')
const { queryChunks } = require('../services/vector.service')
const { streamAnswer } = require('../services/rag.service')
const { appendMessages } = require('../services/conversation.service')
const Document = require('../models/Document.model')
const logger = require('../utils/logger')

async function streamChat(req, res) {
  const { question, conversationId } = req.body
  const { userId } = req.user

  if (!question?.trim()) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'question is required' },
    })
  }

  const docCount = await Document.countDocuments({ userId })
  if (docCount === 0) {
    return res.status(422).json({
      error: {
        code: 'NO_DOCUMENTS',
        message: 'No indexed documents found. Upload a PDF first.',
      },
    })
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  try {
    const queryEmbedding = await embedQuery(question)
    const chunks = await queryChunks({ userId, queryEmbedding, nResults: 5 })

    if (chunks.length === 0) {
      const fallback = 'Não encontrei informações relevantes nos seus documentos.'
      res.write(`data: ${JSON.stringify({ token: fallback })}\n\n`)
      res.write('data: [DONE]\n\n')
      if (conversationId) {
        await appendMessages(conversationId, question, fallback).catch(() => {})
      }
      return res.end()
    }

    let fullResponse = ''

    await streamAnswer({
      chunks,
      question,
      onToken: (token) => {
        fullResponse += token
        res.write(`data: ${JSON.stringify({ token })}\n\n`)
      },
      onDone: async () => {
        res.write('data: [DONE]\n\n')
        res.end()
        logger.info({ userId }, 'Chat stream completed')
        if (conversationId) {
          await appendMessages(conversationId, question, fullResponse).catch((err) => {
            logger.error({ err }, 'Failed to persist conversation messages')
          })
        }
      },
    })
  } catch (err) {
    logger.error({ err, userId }, 'Stream error')
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ error: 'An error occurred during streaming' })}\n\n`)
      res.end()
    }
  }
}

module.exports = { streamChat }
```

- [ ] **Step 2: Run all backend tests — expect PASS**

```bash
cd backend && npx jest --no-coverage
```

Expected: all tests passing (chat.controller is not directly unit-tested; existing integration tests should still pass)

- [ ] **Step 3: Commit**

```bash
git add backend/src/controllers/chat.controller.js
git commit -m "feat: persist chat messages to conversation after stream"
```

---

## Task 5: Frontend — api.js + useConversations hook

**Files:**
- Modify: `frontend/src/services/api.js`
- Create: `frontend/src/hooks/useConversations.js`

- [ ] **Step 1: Add conversation API functions to api.js**

Replace the full content of `frontend/src/services/api.js`:

```js
// frontend/src/services/api.js
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.reload()
    }
    return Promise.reject(err)
  }
)

export async function getConversations() {
  const { data } = await api.get('/conversations')
  return data.data
}

export async function createConversation() {
  const { data } = await api.post('/conversations')
  return data
}

export async function getConversation(id) {
  const { data } = await api.get(`/conversations/${id}`)
  return data
}

export default api
```

- [ ] **Step 2: Create useConversations hook**

```js
// frontend/src/hooks/useConversations.js
import { useState, useEffect, useCallback } from 'react'
import { getConversations, createConversation, getConversation } from '../services/api.js'

export function useConversations() {
  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)

  const loadConversations = useCallback(async () => {
    try {
      const list = await getConversations()
      setConversations(list)
      if (list.length > 0 && !activeId) {
        const latest = await getConversation(list[0]._id)
        setActiveId(latest._id)
        setMessages(latest.messages)
      }
    } catch {
      // silently start with empty state
    } finally {
      setLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  const selectConversation = useCallback(async (id) => {
    try {
      const conv = await getConversation(id)
      setActiveId(conv._id)
      setMessages(conv.messages)
    } catch {
      // ignore
    }
  }, [])

  const newConversation = useCallback(async () => {
    try {
      const conv = await createConversation()
      setConversations((prev) => [{ _id: conv._id, title: conv.title, updatedAt: conv.updatedAt }, ...prev])
      setActiveId(conv._id)
      setMessages([])
    } catch {
      // ignore
    }
  }, [])

  const ensureActiveConversation = useCallback(async () => {
    if (activeId) return activeId
    const conv = await createConversation()
    setConversations((prev) => [{ _id: conv._id, title: conv.title, updatedAt: conv.updatedAt }, ...prev])
    setActiveId(conv._id)
    setMessages([])
    return conv._id
  }, [activeId])

  const appendOptimistic = useCallback((role, content) => {
    setMessages((prev) => [...prev, { role, content }])
  }, [])

  const updateLastMessage = useCallback((content) => {
    setMessages((prev) => {
      const updated = [...prev]
      updated[updated.length - 1] = { ...updated[updated.length - 1], content }
      return updated
    })
  }, [])

  const appendTokenToLast = useCallback((token) => {
    setMessages((prev) => {
      const updated = [...prev]
      const last = updated[updated.length - 1]
      updated[updated.length - 1] = { ...last, content: last.content + token }
      return updated
    })
  }, [])

  const refreshList = useCallback(async () => {
    try {
      const list = await getConversations()
      setConversations(list)
    } catch {
      // ignore
    }
  }, [])

  return {
    conversations,
    activeId,
    messages,
    loading,
    selectConversation,
    newConversation,
    ensureActiveConversation,
    appendOptimistic,
    updateLastMessage,
    appendTokenToLast,
    refreshList,
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/services/api.js frontend/src/hooks/useConversations.js
git commit -m "feat: add conversation API helpers and useConversations hook"
```

---

## Task 6: ConversationList Component

**Files:**
- Create: `frontend/src/components/Conversations/ConversationList.jsx`

- [ ] **Step 1: Write the component**

```jsx
// frontend/src/components/Conversations/ConversationList.jsx
export default function ConversationList({ conversations, activeId, onSelect, onNew }) {
  return (
    <div className="flex flex-col">
      <div className="px-4 pt-3 pb-2">
        <button
          onClick={onNew}
          className="w-full text-xs font-medium text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-400 rounded-lg py-1.5 transition-colors"
        >
          + Nova Conversa
        </button>
      </div>

      {conversations.length > 0 && (
        <>
          <p className="text-xs font-medium text-gray-400 uppercase px-4 pb-1 tracking-wide">
            Conversas
          </p>
          <ul className="overflow-y-auto max-h-48">
            {conversations.map((conv) => (
              <li key={conv._id}>
                <button
                  onClick={() => onSelect(conv._id)}
                  className={`w-full text-left px-4 py-2 text-xs truncate transition-colors ${
                    conv._id === activeId
                      ? 'bg-blue-50 text-blue-700 font-medium'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {conv.title || 'Nova conversa'}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/Conversations/ConversationList.jsx
git commit -m "feat: add ConversationList sidebar component"
```

---

## Task 7: Wire Everything Together — useChat + ChatWindow + App.jsx

**Files:**
- Modify: `frontend/src/hooks/useChat.js`
- Modify: `frontend/src/components/Chat/ChatWindow.jsx`
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Rewrite useChat.js**

useChat now receives conversation state management functions from outside instead of owning messages state.

```js
// frontend/src/hooks/useChat.js
import { useState, useCallback } from 'react'

export function useChat({ conversationId, appendOptimistic, appendTokenToLast, ensureActiveConversation, refreshList }) {
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState('')

  const sendMessage = useCallback(async (question) => {
    if (isStreaming) return

    setError('')

    const activeConvId = await ensureActiveConversation()

    appendOptimistic('user', question)
    appendOptimistic('assistant', '')
    setIsStreaming(true)

    try {
      const token = localStorage.getItem('token')
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ question, conversationId: activeConvId }),
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error?.message || 'Erro na requisição')
      }

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      outer: while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const text = decoder.decode(value, { stream: true })
        const lines = text.split('\n')

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          const payload = line.slice(6).trim()
          if (payload === '[DONE]') break outer

          let parsed
          try {
            parsed = JSON.parse(payload)
          } catch {
            continue
          }

          if (parsed.error) throw new Error(parsed.error)

          if (parsed.token) {
            appendTokenToLast(parsed.token)
          }
        }
      }

      await refreshList()
    } catch (err) {
      setError(err.message || 'Falha ao conectar com o servidor.')
      // remove the optimistic assistant bubble on error
      appendOptimistic('__remove_last__', '')
    } finally {
      setIsStreaming(false)
    }
  }, [isStreaming, conversationId, appendOptimistic, appendTokenToLast, ensureActiveConversation, refreshList])

  return { isStreaming, error, sendMessage }
}
```

- [ ] **Step 2: Rewrite ChatWindow.jsx**

ChatWindow now receives messages and conversation callbacks as props.

```jsx
// frontend/src/components/Chat/ChatWindow.jsx
import { useEffect, useRef } from 'react'
import MessageBubble from './MessageBubble.jsx'
import ChatInput from './ChatInput.jsx'
import { useChat } from '../../hooks/useChat.js'

export default function ChatWindow({
  messages,
  conversationId,
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
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto px-4 pt-4 bg-gray-50">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full">
            <p className="text-gray-400 text-sm">
              Faça upload de um PDF e comece a conversar.
            </p>
          </div>
        )}
        {messages.map((msg, i) => (
          <MessageBubble key={i} role={msg.role} content={msg.content} />
        ))}
        {error && (
          <p className="text-red-500 text-xs text-center mb-2">{error}</p>
        )}
        <div ref={bottomRef} />
      </div>

      <ChatInput onSend={sendMessage} disabled={isStreaming} />
    </div>
  )
}
```

- [ ] **Step 3: Rewrite App.jsx**

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

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100">
      {/* Sidebar */}
      <aside className="w-72 flex flex-col bg-white border-r border-gray-200 shrink-0">
        {/* Header */}
        <div className="px-4 py-4 border-b border-gray-200">
          <h1 className="text-lg font-bold text-gray-800">DrAmilcar</h1>
          <p className="text-xs text-gray-400 truncate">{user?.email}</p>
        </div>

        {/* Conversations */}
        <ConversationList
          conversations={conversations}
          activeId={activeId}
          onSelect={selectConversation}
          onNew={newConversation}
        />

        <div className="border-t border-gray-100 mt-1" />

        {/* Upload */}
        <UploadZone onUpload={upload} uploading={uploading} progress={uploadProgress} />

        {/* Error */}
        {docsError && <p className="text-xs text-red-500 px-4 -mt-2 mb-2">{docsError}</p>}

        {/* Document list */}
        <div className="flex-1 overflow-y-auto">
          <p className="text-xs font-medium text-gray-400 uppercase px-4 pt-2 pb-1 tracking-wide">
            Documentos indexados
          </p>
          <DocumentList documents={documents} loading={docsLoading} onRemove={remove} />
        </div>

        {/* Logout */}
        <div className="px-4 py-3 border-t border-gray-200">
          <button
            onClick={logout}
            className="text-xs text-gray-400 hover:text-red-500 transition-colors"
          >
            Sair
          </button>
        </div>
      </aside>

      {/* Chat */}
      <main className="flex-1 flex flex-col min-w-0">
        <ChatWindow
          messages={messages}
          conversationId={activeId}
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

- [ ] **Step 4: Fix the `__remove_last__` error removal in useConversations**

The `appendOptimistic` function in `useConversations.js` needs to handle the error cleanup signal from useChat. Open `frontend/src/hooks/useConversations.js` and replace the `appendOptimistic` function:

```js
const appendOptimistic = useCallback((role, content) => {
  if (role === '__remove_last__') {
    setMessages((prev) => prev.slice(0, -1))
    return
  }
  setMessages((prev) => [...prev, { role, content }])
}, [])
```

- [ ] **Step 5: Verify the frontend builds without errors**

```bash
cd frontend && npm run build
```

Expected: Build succeeds with no errors

- [ ] **Step 6: Commit**

```bash
git add frontend/src/hooks/useChat.js frontend/src/components/Chat/ChatWindow.jsx frontend/src/App.jsx frontend/src/hooks/useConversations.js
git commit -m "feat: wire conversation persistence into chat UI"
```

---

## Task 8: Final Verification

- [ ] **Step 1: Run all backend tests**

```bash
cd backend && npx jest --no-coverage
```

Expected: all tests passing

- [ ] **Step 2: Smoke test in browser**

With backend and frontend both running:

1. Open http://localhost:5173 and log in
2. Upload a PDF if none indexed
3. Send a message — "Pensando" animation appears, response streams in
4. Refresh the page — conversation reloads with full history
5. Click "+ Nova Conversa" — chat resets to empty
6. Send another message in the new conversation
7. Click the first conversation in the sidebar — history switches correctly

- [ ] **Step 3: Push to main**

```bash
git push origin main
```
