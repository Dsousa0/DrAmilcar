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
