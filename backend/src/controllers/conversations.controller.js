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
