const request = require('supertest')
const mongoose = require('mongoose')
const { MongoMemoryServer } = require('mongodb-memory-server')

jest.mock('../../src/config/chroma', () => ({}))
jest.mock('../../src/services/embedding.service', () => ({
  embedTexts: jest.fn().mockResolvedValue([[0.1]]),
  embedQuery: jest.fn().mockResolvedValue([0.1]),
}))
jest.mock('../../src/services/vector.service', () => ({
  addChunks: jest.fn().mockResolvedValue(),
  queryChunks: jest.fn().mockResolvedValue([]),
  deleteDocumentChunks: jest.fn().mockResolvedValue(),
  deleteConversationChunks: jest.fn().mockResolvedValue(),
}))
jest.mock('../../src/services/pdf.service', () => ({
  processBuffer: jest.fn().mockResolvedValue({ text: 'sample', chunks: ['sample'] }),
}))

const app = require('../../src/app')
const Conversation = require('../../src/models/Conversation.model')
const Document = require('../../src/models/Document.model')
const { generateToken } = require('../../src/services/auth.service')
const vectorService = require('../../src/services/vector.service')

let mongoServer
let userAToken
let userAId
let userBToken
let userBId
let convA
let convB

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create()
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
  jest.clearAllMocks()

  userAId = new mongoose.Types.ObjectId().toString()
  userBId = new mongoose.Types.ObjectId().toString()
  userAToken = generateToken({ userId: userAId, email: 'a@test.com', role: 'user' })
  userBToken = generateToken({ userId: userBId, email: 'b@test.com', role: 'user' })

  convA = await Conversation.create({ userId: userAId, title: 'A', messages: [] })
  convB = await Conversation.create({ userId: userBId, title: 'B', messages: [] })
})

describe('GET /api/conversations/:id/documents', () => {
  it('returns 401 when no token provided', async () => {
    const res = await request(app).get(`/api/conversations/${convA._id}/documents`)
    expect(res.status).toBe(401)
  })

  it('returns docs only for the conversation owner', async () => {
    await Document.create({
      userId: userAId,
      conversationId: convA._id,
      originalName: 'mine.pdf',
      sizeBytes: 100,
      chunkCount: 1,
    })

    const res = await request(app)
      .get(`/api/conversations/${convA._id}/documents`)
      .set('Authorization', `Bearer ${userAToken}`)

    expect(res.status).toBe(200)
    expect(res.body.data).toHaveLength(1)
    expect(res.body.data[0].originalName).toBe('mine.pdf')
  })

  it('returns 404 when listing docs of another user conversation', async () => {
    const res = await request(app)
      .get(`/api/conversations/${convB._id}/documents`)
      .set('Authorization', `Bearer ${userAToken}`)

    expect(res.status).toBe(404)
  })

  it('returns 404 for invalid conversationId', async () => {
    const res = await request(app)
      .get('/api/conversations/not-an-id/documents')
      .set('Authorization', `Bearer ${userAToken}`)

    expect(res.status).toBe(404)
  })
})

describe('POST /api/conversations/:id/documents/upload', () => {
  it('returns 401 without token', async () => {
    const res = await request(app)
      .post(`/api/conversations/${convA._id}/documents/upload`)
      .attach('file', Buffer.from('%PDF-1.4 fake'), { filename: 'x.pdf', contentType: 'application/pdf' })
    expect(res.status).toBe(401)
  })

  it('uploads and persists document linked to the conversation', async () => {
    const res = await request(app)
      .post(`/api/conversations/${convA._id}/documents/upload`)
      .set('Authorization', `Bearer ${userAToken}`)
      .attach('file', Buffer.from('%PDF-1.4 fake'), { filename: 'mine.pdf', contentType: 'application/pdf' })

    expect(res.status).toBe(201)
    expect(res.body.conversationId).toBe(convA._id.toString())
    expect(res.body.userId).toBe(userAId)

    const persisted = await Document.findById(res.body._id)
    expect(persisted).not.toBeNull()
    expect(persisted.conversationId.toString()).toBe(convA._id.toString())

    expect(vectorService.addChunks).toHaveBeenCalledWith(
      expect.objectContaining({
        conversationId: convA._id.toString(),
        userId: userAId,
      })
    )
  })

  it('returns 404 when uploading to another user conversation', async () => {
    const res = await request(app)
      .post(`/api/conversations/${convB._id}/documents/upload`)
      .set('Authorization', `Bearer ${userAToken}`)
      .attach('file', Buffer.from('%PDF-1.4 fake'), { filename: 'x.pdf', contentType: 'application/pdf' })

    expect(res.status).toBe(404)
    expect(vectorService.addChunks).not.toHaveBeenCalled()
  })

  it('returns 400 when no file attached', async () => {
    const res = await request(app)
      .post(`/api/conversations/${convA._id}/documents/upload`)
      .set('Authorization', `Bearer ${userAToken}`)
    expect(res.status).toBe(400)
  })
})

describe('DELETE /api/documents/:id', () => {
  it('returns 401 without token', async () => {
    const res = await request(app).delete(`/api/documents/${new mongoose.Types.ObjectId()}`)
    expect(res.status).toBe(401)
  })

  it('deletes a document owned by the user', async () => {
    const doc = await Document.create({
      userId: userAId,
      conversationId: convA._id,
      originalName: 'mine.pdf',
      sizeBytes: 100,
      chunkCount: 1,
    })

    const res = await request(app)
      .delete(`/api/documents/${doc._id}`)
      .set('Authorization', `Bearer ${userAToken}`)

    expect(res.status).toBe(204)
    expect(await Document.findById(doc._id)).toBeNull()
    expect(vectorService.deleteDocumentChunks).toHaveBeenCalled()
  })

  it('returns 404 when trying to delete another user document', async () => {
    const doc = await Document.create({
      userId: userBId,
      conversationId: convB._id,
      originalName: 'theirs.pdf',
      sizeBytes: 100,
      chunkCount: 1,
    })

    const res = await request(app)
      .delete(`/api/documents/${doc._id}`)
      .set('Authorization', `Bearer ${userAToken}`)

    expect(res.status).toBe(404)
    expect(await Document.findById(doc._id)).not.toBeNull()
    expect(vectorService.deleteDocumentChunks).not.toHaveBeenCalled()
  })
})

describe('DELETE /api/conversations/:id (cascade)', () => {
  it('deletes conversation and cascades to documents and vector chunks', async () => {
    const doc = await Document.create({
      userId: userAId,
      conversationId: convA._id,
      originalName: 'mine.pdf',
      sizeBytes: 100,
      chunkCount: 1,
    })

    const res = await request(app)
      .delete(`/api/conversations/${convA._id}`)
      .set('Authorization', `Bearer ${userAToken}`)

    expect(res.status).toBe(204)
    expect(await Conversation.findById(convA._id)).toBeNull()
    expect(await Document.findById(doc._id)).toBeNull()
    expect(vectorService.deleteConversationChunks).toHaveBeenCalledWith(
      expect.objectContaining({ conversationId: expect.anything() })
    )
  })

  it('returns 404 when deleting another user conversation', async () => {
    const res = await request(app)
      .delete(`/api/conversations/${convB._id}`)
      .set('Authorization', `Bearer ${userAToken}`)

    expect(res.status).toBe(404)
    expect(await Conversation.findById(convB._id)).not.toBeNull()
  })
})
