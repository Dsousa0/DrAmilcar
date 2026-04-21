# Admin User Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restrict user creation to admins only, add full CRUD admin panel for users, and remove public self-registration.

**Architecture:** Add a `role` field to the User model and JWT payload, protect admin routes with a `requireAdmin` middleware, expose `/api/admin/users` CRUD endpoints, remove the public `/auth/register` endpoint, and add an `AdminUsers` page in the frontend guarded by `user.role === 'admin'`.

**Tech Stack:** Node.js/Express, Mongoose, JWT (jsonwebtoken), React + inline styles (Neutro Premium design system), axios

---

## File Map

**Create:**
- `backend/src/routes/admin.routes.js` — mounts admin CRUD routes behind authenticate + requireAdmin
- `backend/src/controllers/admin.controller.js` — listUsers, createUser, updateUser, deleteUser
- `backend/scripts/seed-admin.js` — one-time idempotent admin user seeder
- `backend/tests/integration/admin.routes.test.js` — integration tests for all admin endpoints
- `frontend/src/pages/AdminUsers.jsx` — full-page admin CRUD UI

**Modify:**
- `backend/src/models/User.model.js` — add `role` field
- `backend/src/services/auth.service.js` — no change needed (generateToken is generic)
- `backend/src/controllers/auth.controller.js` — include `role` in generateToken call; remove `register`
- `backend/src/middleware/auth.middleware.js` — add `requireAdmin`
- `backend/src/routes/auth.routes.js` — remove `/register` route
- `backend/src/app.js` — mount `/api/admin` routes
- `backend/package.json` — add `seed:admin` script
- `backend/tests/integration/auth.routes.test.js` — remove register tests; fix login beforeEach
- `backend/tests/unit/auth.service.test.js` — add `role` to token test
- `frontend/src/pages/Login.jsx` — remove register mode
- `frontend/src/context/AuthContext.jsx` — remove `register`, expose `isAdmin`
- `frontend/src/services/api.js` — add admin API functions
- `frontend/src/App.jsx` — add admin routing and "Usuários" button

---

## Task 1: Add `role` field to User model

**Files:**
- Modify: `backend/src/models/User.model.js`

- [ ] **Step 1: Add `role` field to the schema**

Replace the contents of `backend/src/models/User.model.js`:

```js
const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user',
  },
}, { timestamps: true })

userSchema.set('toJSON', {
  transform: (_, obj) => {
    delete obj.passwordHash
    delete obj.__v
    return obj
  },
})

module.exports = mongoose.model('User', userSchema)
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/models/User.model.js
git commit -m "feat: add role field to User model"
```

---

## Task 2: Include `role` in JWT payload

**Files:**
- Modify: `backend/src/controllers/auth.controller.js`
- Modify: `backend/tests/unit/auth.service.test.js`

- [ ] **Step 1: Update the token test to assert role is returned**

In `backend/tests/unit/auth.service.test.js`, update the `verifyToken` test block:

```js
describe('verifyToken', () => {
  it('should return the original payload for a valid token', () => {
    const token = authService.generateToken({ userId: 'abc123', email: 'a@b.com', role: 'admin' })
    const payload = authService.verifyToken(token)
    expect(payload.userId).toBe('abc123')
    expect(payload.email).toBe('a@b.com')
    expect(payload.role).toBe('admin')
  })

  it('should throw for a tampered token', () => {
    expect(() => authService.verifyToken('invalid.token.here')).toThrow()
  })
})
```

- [ ] **Step 2: Run the test to verify it fails**

```bash
cd backend && npx jest tests/unit/auth.service.test.js --no-coverage
```

Expected: FAIL — `expect(received).toBe(expected)` — `role` is undefined in payload (because the controller hasn't been updated yet, but the service itself is generic, so actually this test will PASS since `generateToken` already forwards whatever payload it receives). If it passes, move on.

- [ ] **Step 3: Update auth.controller.js to include `role` in the token**

Replace `backend/src/controllers/auth.controller.js`:

```js
const User = require('../models/User.model')
const { hashPassword, comparePassword, generateToken } = require('../services/auth.service')

async function login(req, res, next) {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'email and password are required' },
      })
    }
    const user = await User.findOne({ email })
    const valid = user && (await comparePassword(password, user.passwordHash))
    if (!valid) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' },
      })
    }
    const token = generateToken({ userId: user._id.toString(), email: user.email, role: user.role })
    res.json({ token, user: { id: user._id, email: user.email, role: user.role } })
  } catch (err) {
    next(err)
  }
}

module.exports = { login }
```

Note: `register` is removed. The login response now includes `role` in both `token` and `user` object.

- [ ] **Step 4: Run tests**

```bash
cd backend && npx jest tests/unit/auth.service.test.js --no-coverage
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add backend/src/controllers/auth.controller.js backend/tests/unit/auth.service.test.js
git commit -m "feat: include role in JWT payload and login response"
```

---

## Task 3: Add `requireAdmin` middleware

**Files:**
- Modify: `backend/src/middleware/auth.middleware.js`

- [ ] **Step 1: Add `requireAdmin` to the middleware file**

Replace `backend/src/middleware/auth.middleware.js`:

```js
const { verifyToken } = require('../services/auth.service')

function authenticate(req, res, next) {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Missing or malformed token' },
    })
  }
  const token = header.slice(7)
  try {
    req.user = verifyToken(token)
    next()
  } catch {
    return res.status(401).json({
      error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' },
    })
  }
}

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({
      error: { code: 'FORBIDDEN', message: 'Admin access required' },
    })
  }
  next()
}

module.exports = { authenticate, requireAdmin }
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/middleware/auth.middleware.js
git commit -m "feat: add requireAdmin middleware"
```

---

## Task 4: Create admin controller

**Files:**
- Create: `backend/src/controllers/admin.controller.js`

- [ ] **Step 1: Create the controller**

Create `backend/src/controllers/admin.controller.js`:

```js
const User = require('../models/User.model')
const { hashPassword } = require('../services/auth.service')

async function listUsers(req, res, next) {
  try {
    const users = await User.find({}).sort({ createdAt: -1 })
    res.json({ data: users })
  } catch (err) {
    next(err)
  }
}

async function createUser(req, res, next) {
  try {
    const { email, password, role = 'user' } = req.body
    if (!email || !password) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'email and password are required' },
      })
    }
    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'role must be admin or user' },
      })
    }
    if (await User.findOne({ email })) {
      return res.status(409).json({
        error: { code: 'CONFLICT', message: 'Email already registered' },
      })
    }
    const passwordHash = await hashPassword(password)
    const user = await User.create({ email, passwordHash, role })
    res.status(201).json(user)
  } catch (err) {
    next(err)
  }
}

async function updateUser(req, res, next) {
  try {
    const { id } = req.params
    const { email, password, role } = req.body

    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'User not found' },
      })
    }

    if (email) {
      const conflict = await User.findOne({ email, _id: { $ne: id } })
      if (conflict) {
        return res.status(409).json({
          error: { code: 'CONFLICT', message: 'Email already in use' },
        })
      }
      user.email = email
    }

    if (password) {
      user.passwordHash = await hashPassword(password)
    }

    if (role) {
      if (!['admin', 'user'].includes(role)) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'role must be admin or user' },
        })
      }
      user.role = role
    }

    await user.save()
    res.json(user)
  } catch (err) {
    next(err)
  }
}

async function deleteUser(req, res, next) {
  try {
    const { id } = req.params
    if (id === req.user.userId) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Cannot delete your own account' },
      })
    }
    const user = await User.findByIdAndDelete(id)
    if (!user) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'User not found' },
      })
    }
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

module.exports = { listUsers, createUser, updateUser, deleteUser }
```

- [ ] **Step 2: Commit**

```bash
git add backend/src/controllers/admin.controller.js
git commit -m "feat: add admin controller with user CRUD"
```

---

## Task 5: Create admin routes, integration tests, and mount in app

**Files:**
- Create: `backend/src/routes/admin.routes.js`
- Create: `backend/tests/integration/admin.routes.test.js`
- Modify: `backend/src/app.js`

- [ ] **Step 1: Write the integration tests (TDD — they will fail until routes are mounted)**

Create `backend/tests/integration/admin.routes.test.js`:

```js
const request = require('supertest')
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')

jest.mock('../../src/config/chroma', () => ({}))

const app = require('../../src/app')
const User = require('../../src/models/User.model')
const { hashPassword, generateToken } = require('../../src/services/auth.service')

let mongoServer
let adminToken
let adminId
let userToken
let userId

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create()
  process.env.MONGODB_URI = mongoServer.getUri()
  await mongoose.connect(mongoServer.getUri())
})

afterAll(async () => {
  await mongoose.connection.close()
  await mongoServer.stop()
})

beforeEach(async () => {
  const { collections } = mongoose.connection
  for (const key in collections) {
    await collections[key].deleteMany({})
  }

  const adminHash = await hashPassword('adminpass')
  const admin = await User.create({ email: 'admin@test.com', passwordHash: adminHash, role: 'admin' })
  adminId = admin._id.toString()
  adminToken = generateToken({ userId: adminId, email: admin.email, role: 'admin' })

  const userHash = await hashPassword('userpass')
  const user = await User.create({ email: 'user@test.com', passwordHash: userHash, role: 'user' })
  userId = user._id.toString()
  userToken = generateToken({ userId: userId, email: user.email, role: 'user' })
})

describe('GET /api/admin/users', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).get('/api/admin/users')
    expect(res.status).toBe(401)
  })

  it('returns 403 for non-admin users', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${userToken}`)
    expect(res.status).toBe(403)
  })

  it('returns list of users for admin', async () => {
    const res = await request(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(2)
    expect(res.body.data[0].passwordHash).toBeUndefined()
  })
})

describe('POST /api/admin/users', () => {
  it('returns 403 for non-admin', async () => {
    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ email: 'new@test.com', password: 'pass123' })
    expect(res.status).toBe(403)
  })

  it('creates a user as admin', async () => {
    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'new@test.com', password: 'pass123', role: 'user' })
    expect(res.status).toBe(201)
    expect(res.body.email).toBe('new@test.com')
    expect(res.body.role).toBe('user')
    expect(res.body.passwordHash).toBeUndefined()
  })

  it('returns 409 for duplicate email', async () => {
    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'user@test.com', password: 'pass123' })
    expect(res.status).toBe(409)
  })

  it('returns 400 for missing email', async () => {
    const res = await request(app)
      .post('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ password: 'pass123' })
    expect(res.status).toBe(400)
  })
})

describe('PATCH /api/admin/users/:id', () => {
  it('updates user email as admin', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'updated@test.com' })
    expect(res.status).toBe(200)
    expect(res.body.email).toBe('updated@test.com')
  })

  it('returns 404 for non-existent user', async () => {
    const fakeId = new mongoose.Types.ObjectId()
    const res = await request(app)
      .patch(`/api/admin/users/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'x@test.com' })
    expect(res.status).toBe(404)
  })

  it('returns 403 for non-admin', async () => {
    const res = await request(app)
      .patch(`/api/admin/users/${adminId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .send({ email: 'hacked@test.com' })
    expect(res.status).toBe(403)
  })
})

describe('DELETE /api/admin/users/:id', () => {
  it('deletes a user as admin', async () => {
    const res = await request(app)
      .delete(`/api/admin/users/${userId}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(204)
  })

  it('returns 400 when admin tries to delete own account', async () => {
    const res = await request(app)
      .delete(`/api/admin/users/${adminId}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(400)
  })

  it('returns 404 for non-existent user', async () => {
    const fakeId = new mongoose.Types.ObjectId()
    const res = await request(app)
      .delete(`/api/admin/users/${fakeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
    expect(res.status).toBe(404)
  })

  it('returns 403 for non-admin', async () => {
    const res = await request(app)
      .delete(`/api/admin/users/${userId}`)
      .set('Authorization', `Bearer ${userToken}`)
    expect(res.status).toBe(403)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd backend && npx jest tests/integration/admin.routes.test.js --no-coverage
```

Expected: FAIL — routes not mounted yet.

- [ ] **Step 3: Create admin routes file**

Create `backend/src/routes/admin.routes.js`:

```js
const { Router } = require('express')
const { authenticate, requireAdmin } = require('../middleware/auth.middleware')
const { listUsers, createUser, updateUser, deleteUser } = require('../controllers/admin.controller')

const router = Router()

router.use(authenticate, requireAdmin)

router.get('/users', listUsers)
router.post('/users', createUser)
router.patch('/users/:id', updateUser)
router.delete('/users/:id', deleteUser)

module.exports = router
```

- [ ] **Step 4: Mount admin routes in app.js**

In `backend/src/app.js`, add the import and mount after the existing routes:

```js
const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const pinoHttp = require('pino-http')
const env = require('./config/env')
const logger = require('./utils/logger')

const authRoutes = require('./routes/auth.routes')
const adminRoutes = require('./routes/admin.routes')
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
app.use('/api/admin', adminRoutes)
app.use('/api/documents', documentsRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/conversations', conversationsRoutes)

app.use(errorHandler)

module.exports = app
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
cd backend && npx jest tests/integration/admin.routes.test.js --no-coverage
```

Expected: PASS (all tests green)

- [ ] **Step 6: Commit**

```bash
git add backend/src/routes/admin.routes.js backend/src/controllers/admin.controller.js backend/src/app.js backend/tests/integration/admin.routes.test.js
git commit -m "feat: add admin CRUD routes for user management"
```

---

## Task 6: Remove public register endpoint and update existing tests

**Files:**
- Modify: `backend/src/routes/auth.routes.js`
- Modify: `backend/tests/integration/auth.routes.test.js`

- [ ] **Step 1: Remove `/register` from auth routes**

Replace `backend/src/routes/auth.routes.js`:

```js
const { Router } = require('express')
const { login } = require('../controllers/auth.controller')

const router = Router()
router.post('/login', login)

module.exports = router
```

- [ ] **Step 2: Update auth.routes.test.js**

The existing test calls `POST /api/auth/register` to set up data — replace with direct DB creation. Replace the full contents of `backend/tests/integration/auth.routes.test.js`:

```js
const request = require('supertest')
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')

jest.mock('../../src/config/chroma', () => ({}))

const app = require('../../src/app')
const User = require('../../src/models/User.model')
const { hashPassword } = require('../../src/services/auth.service')

let mongoServer

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create()
  process.env.MONGODB_URI = mongoServer.getUri()
  await mongoose.connect(mongoServer.getUri())
})

afterAll(async () => {
  await mongoose.connection.close()
  await mongoServer.stop()
})

afterEach(async () => {
  const { collections } = mongoose.connection
  for (const key in collections) {
    await collections[key].deleteMany({})
  }
})

describe('POST /api/auth/register (removed)', () => {
  it('returns 404 — public register endpoint no longer exists', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'user@example.com', password: 'password123' })
    expect(res.status).toBe(404)
  })
})

describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    const passwordHash = await hashPassword('correct_pass')
    await User.create({ email: 'login@example.com', passwordHash, role: 'user' })
  })

  it('returns a JWT with role for valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'correct_pass' })

    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.role).toBe('user')
  })

  it('returns 401 for wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'login@example.com', password: 'wrong_pass' })
    expect(res.status).toBe(401)
  })

  it('returns 401 for non-existent user', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@example.com', password: 'pass' })
    expect(res.status).toBe(401)
  })
})
```

- [ ] **Step 3: Run all tests**

```bash
cd backend && npx jest --no-coverage --runInBand
```

Expected: All tests PASS.

- [ ] **Step 4: Commit**

```bash
git add backend/src/routes/auth.routes.js backend/tests/integration/auth.routes.test.js
git commit -m "feat: remove public register endpoint, update auth tests"
```

---

## Task 7: Create seed script

**Files:**
- Create: `backend/scripts/seed-admin.js`
- Modify: `backend/package.json`

- [ ] **Step 1: Create the seed script**

Create `backend/scripts/seed-admin.js`:

```js
require('dotenv').config()
const mongoose = require('mongoose')
const User = require('../src/models/User.model')
const { hashPassword } = require('../src/services/auth.service')

async function main() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD

  if (!email || !password) {
    console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env')
    process.exit(1)
  }

  await mongoose.connect(process.env.MONGODB_URI)

  const existing = await User.findOne({ email })
  if (existing) {
    if (existing.role !== 'admin') {
      existing.role = 'admin'
      await existing.save()
      console.log(`Updated existing user ${email} to admin.`)
    } else {
      console.log(`Admin user ${email} already exists. Nothing to do.`)
    }
    await mongoose.disconnect()
    return
  }

  const passwordHash = await hashPassword(password)
  await User.create({ email, passwordHash, role: 'admin' })
  console.log(`Admin user ${email} created successfully.`)
  await mongoose.disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
```

- [ ] **Step 2: Add `seed:admin` script to package.json**

In `backend/package.json`, update the `scripts` section:

```json
"scripts": {
  "start": "node src/server.js",
  "dev": "nodemon src/server.js",
  "test": "jest --runInBand",
  "test:watch": "jest --watch",
  "seed:admin": "node scripts/seed-admin.js"
}
```

- [ ] **Step 3: Commit**

```bash
git add backend/scripts/seed-admin.js backend/package.json
git commit -m "feat: add seed:admin script to create first admin user"
```

---

## Task 8: Frontend — Remove register mode from Login and AuthContext

**Files:**
- Modify: `frontend/src/pages/Login.jsx`
- Modify: `frontend/src/context/AuthContext.jsx`

- [ ] **Step 1: Simplify Login.jsx to login-only**

Replace `frontend/src/pages/Login.jsx`:

```jsx
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f4f1' }}>
      <div style={{ background: '#fffffe', borderRadius: '16px', padding: '36px 32px', width: '100%', maxWidth: '380px', boxShadow: '0 2px 16px rgba(28,25,23,0.08)' }}>

        <h1 style={{ fontFamily: "'Lora', serif", fontSize: '24px', fontWeight: 700, color: '#1c1917', letterSpacing: '-0.4px', marginBottom: '4px' }}>
          DrAmilcar
        </h1>
        <p style={{ fontSize: '13px', color: '#78716c', marginBottom: '28px', fontWeight: 400 }}>
          Entre na sua conta
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label htmlFor="email" style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#44403c', marginBottom: '5px' }}>
              Email
            </label>
            <input
              id="email"
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
            <label htmlFor="password" style={{ display: 'block', fontSize: '11.5px', fontWeight: 600, color: '#44403c', marginBottom: '5px' }}>
              Senha
            </label>
            <input
              id="password"
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
            {loading ? 'Aguarde…' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update AuthContext — remove `register`, expose `isAdmin`**

Replace `frontend/src/context/AuthContext.jsx`:

```jsx
import { createContext, useContext, useState, useCallback } from 'react'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data.user))
    setToken(data.token)
    setUser(data.user)
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setToken(null)
    setUser(null)
  }, [])

  const isAdmin = user?.role === 'admin'

  return (
    <AuthContext.Provider value={{ token, user, isAdmin, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/Login.jsx frontend/src/context/AuthContext.jsx
git commit -m "feat: remove public register, expose isAdmin in AuthContext"
```

---

## Task 9: Add admin API functions to api.js

**Files:**
- Modify: `frontend/src/services/api.js`

- [ ] **Step 1: Add the four admin API functions**

Replace `frontend/src/services/api.js`:

```js
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

export async function getUsers() {
  const { data } = await api.get('/admin/users')
  return data.data
}

export async function createUser(userData) {
  const { data } = await api.post('/admin/users', userData)
  return data
}

export async function updateUser(id, userData) {
  const { data } = await api.patch(`/admin/users/${id}`, userData)
  return data
}

export async function deleteUser(id) {
  await api.delete(`/admin/users/${id}`)
}

export default api
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/services/api.js
git commit -m "feat: add admin API functions to api.js"
```

---

## Task 10: Create AdminUsers page

**Files:**
- Create: `frontend/src/pages/AdminUsers.jsx`

- [ ] **Step 1: Create the page**

Create `frontend/src/pages/AdminUsers.jsx`:

```jsx
import { useState, useEffect, useCallback } from 'react'
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
                  <>
                    <tr key={u._id} style={{ borderBottom: i < users.length - 1 ? '1px solid #f0ede8' : 'none', background: editId === u._id ? '#fafaf9' : 'transparent' }}>
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

                    {/* Inline edit form */}
                    {editId === u._id && (
                      <tr key={`edit-${u._id}`}>
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
                  </>
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
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/AdminUsers.jsx
git commit -m "feat: add AdminUsers page with full CRUD UI"
```

---

## Task 11: Update App.jsx with admin routing

**Files:**
- Modify: `frontend/src/App.jsx`

- [ ] **Step 1: Add admin routing and "Usuários" button to App.jsx**

Replace `frontend/src/App.jsx`:

```jsx
import { useState } from 'react'
import { useAuth } from './context/AuthContext.jsx'
import Login from './pages/Login.jsx'
import AdminUsers from './pages/AdminUsers.jsx'
import { useDocuments } from './hooks/useDocuments.js'
import { useConversations } from './hooks/useConversations.js'
import UploadZone from './components/Upload/UploadZone.jsx'
import DocumentList from './components/Documents/DocumentList.jsx'
import ConversationList from './components/Conversations/ConversationList.jsx'
import ChatWindow from './components/Chat/ChatWindow.jsx'

function MainLayout() {
  const { user, isAdmin, logout } = useAuth()
  const [adminView, setAdminView] = useState(false)
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

- [ ] **Step 2: Commit**

```bash
git add frontend/src/App.jsx
git commit -m "feat: add admin routing and Usuários button for admin users"
```

---

## Task 12: Final verification and push

- [ ] **Step 1: Run all backend tests**

```bash
cd backend && npx jest --no-coverage --runInBand
```

Expected: All tests PASS.

- [ ] **Step 2: Verify login page has no register toggle**

Open `http://localhost:5173` in a browser. Confirm the login page shows only the login form with no "Cadastre-se" link.

- [ ] **Step 3: Create admin via seed script (dev environment)**

Add to `.env` if not present:
```
ADMIN_EMAIL=admin@dramilcar.com
ADMIN_PASSWORD=suasenhaforte
```

Then run:
```bash
cd backend && npm run seed:admin
```

Expected output: `Admin user admin@dramilcar.com created successfully.`

- [ ] **Step 4: Verify admin panel in browser**

Log in as the admin user. Confirm:
- "Usuários" link appears in the sidebar footer below the email
- Clicking it opens the AdminUsers page
- Can create, edit, and delete users
- "← Voltar" returns to the chat

Log in as a regular user. Confirm:
- "Usuários" link does NOT appear
- Navigating to the admin page is not possible

- [ ] **Step 5: Push to main**

```bash
git push origin main
```
