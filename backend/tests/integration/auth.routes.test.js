const request = require('supertest')
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')

jest.mock('../../src/config/chroma', () => ({}))
jest.mock('../../src/services/embedding.service', () => ({ embedTexts: jest.fn().mockResolvedValue([]) }))

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
    expect(res.body.user.mustChangePassword).toBe(false)
  })

  it('flags mustChangePassword when set on the user', async () => {
    const passwordHash = await hashPassword('temp_pass')
    await User.create({ email: 'first@example.com', passwordHash, role: 'user', mustChangePassword: true })
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'first@example.com', password: 'temp_pass' })
    expect(res.status).toBe(200)
    expect(res.body.user.mustChangePassword).toBe(true)
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

describe('POST /api/auth/change-password', () => {
  let token
  let userId
  beforeEach(async () => {
    const passwordHash = await hashPassword('temp_pass')
    const user = await User.create({ email: 'reset@example.com', passwordHash, role: 'user', mustChangePassword: true })
    userId = user._id.toString()
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'reset@example.com', password: 'temp_pass' })
    token = login.body.token
  })

  it('returns 401 without token', async () => {
    const res = await request(app)
      .post('/api/auth/change-password')
      .send({ currentPassword: 'temp_pass', newPassword: 'new_password_1' })
    expect(res.status).toBe(401)
  })

  it('returns 400 when newPassword too short', async () => {
    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'temp_pass', newPassword: 'abc' })
    expect(res.status).toBe(400)
  })

  it('returns 401 when currentPassword is wrong', async () => {
    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'WRONG', newPassword: 'new_password_1' })
    expect(res.status).toBe(401)
  })

  it('rotates the hash, clears mustChangePassword and returns a fresh session', async () => {
    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'temp_pass', newPassword: 'new_password_1' })
    expect(res.status).toBe(200)
    expect(res.body.token).toBeDefined()
    expect(res.body.user.mustChangePassword).toBe(false)

    const persisted = await User.findById(userId)
    expect(persisted.mustChangePassword).toBe(false)

    // Old password no longer works; new one does
    const oldLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'reset@example.com', password: 'temp_pass' })
    expect(oldLogin.status).toBe(401)
    const newLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'reset@example.com', password: 'new_password_1' })
    expect(newLogin.status).toBe(200)
    expect(newLogin.body.user.mustChangePassword).toBe(false)
  })

  it('rejects when newPassword equals currentPassword', async () => {
    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'temp_pass', newPassword: 'temp_pass' })
    expect(res.status).toBe(400)
  })
})

describe('protected routes block users with mustChangePassword', () => {
  it('returns 403 PASSWORD_CHANGE_REQUIRED on /api/conversations until reset', async () => {
    const passwordHash = await hashPassword('temp_pass')
    await User.create({ email: 'gated@example.com', passwordHash, role: 'user', mustChangePassword: true })
    const login = await request(app)
      .post('/api/auth/login')
      .send({ email: 'gated@example.com', password: 'temp_pass' })
    const token = login.body.token

    const blocked = await request(app)
      .get('/api/conversations')
      .set('Authorization', `Bearer ${token}`)
    expect(blocked.status).toBe(403)
    expect(blocked.body.error.code).toBe('PASSWORD_CHANGE_REQUIRED')

    const reset = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${token}`)
      .send({ currentPassword: 'temp_pass', newPassword: 'new_password_1' })
    const newToken = reset.body.token

    const allowed = await request(app)
      .get('/api/conversations')
      .set('Authorization', `Bearer ${newToken}`)
    expect(allowed.status).toBe(200)
  })
})
