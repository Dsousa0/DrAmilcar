const request = require('supertest')
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')

jest.mock('../../src/config/chroma', () => ({}))
jest.mock('../../src/services/embedding.service', () => ({ embedTexts: jest.fn().mockResolvedValue([]) }))

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
