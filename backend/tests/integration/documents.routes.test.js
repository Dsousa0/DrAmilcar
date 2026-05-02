const request = require('supertest')
const jwt = require('jsonwebtoken')

const JWT_SECRET = 'test_secret_at_least_32_characters_long_ok'

jest.mock('../../src/config/chroma', () => ({}))
jest.mock('../../src/services/embedding.service', () => ({ embedTexts: jest.fn().mockResolvedValue([]) }))

function makeToken(role) {
  return jwt.sign({ userId: 'aaaaaaaaaaaaaaaaaaaaaaaa', email: 'test@test.com', role }, JWT_SECRET)
}

let app
beforeAll(() => {
  app = require('../../src/app')
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
