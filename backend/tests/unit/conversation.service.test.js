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
    await conversationService.appendMessages(conv._id, userId, 'Hello world question', 'Hello answer')
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
    await conversationService.appendMessages(conv._id, userId, 'First question', 'First answer')
    await conversationService.appendMessages(conv._id, userId, 'Second question', 'Second answer')
    const updated = await conversationService.getConversation(userId, conv._id)
    expect(updated.title).toBe('First question')
    expect(updated.messages).toHaveLength(4)
  })

  it('truncates title to 60 characters', async () => {
    const userId = uid()
    const conv = await conversationService.createConversation(userId)
    const longQuestion = 'A'.repeat(80)
    await conversationService.appendMessages(conv._id, userId, longQuestion, 'answer')
    const updated = await conversationService.getConversation(userId, conv._id)
    expect(updated.title).toHaveLength(60)
  })
})
