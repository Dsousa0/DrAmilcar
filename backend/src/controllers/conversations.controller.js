const {
  createConversation,
  listConversations,
  getConversation,
  deleteConversation,
} = require('../services/conversation.service')

async function list(req, res, next) {
  try {
    const conversations = await listConversations(req.user.userId)
    res.json({ data: conversations })
  } catch (err) {
    next(err)
  }
}

async function create(req, res, next) {
  try {
    const conv = await createConversation(req.user.userId)
    res.status(201).json(conv)
  } catch (err) {
    next(err)
  }
}

async function get(req, res, next) {
  try {
    const conv = await getConversation(req.user.userId, req.params.id)
    if (!conv) return res.status(404).json({ error: { message: 'Conversation not found' } })
    res.json(conv)
  } catch (err) {
    next(err)
  }
}

async function remove(req, res, next) {
  try {
    const ok = await deleteConversation(req.user.userId, req.params.id)
    if (!ok) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Conversation not found' },
      })
    }
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

module.exports = { list, create, get, remove }
