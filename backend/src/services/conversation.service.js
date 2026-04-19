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

  await Conversation.updateOne(
    { _id: conversationId, title: '' },
    { $set: { title: userContent.slice(0, 60) } }
  )

  await Conversation.updateOne(
    { _id: conversationId },
    {
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
