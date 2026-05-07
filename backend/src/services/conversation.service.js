const Conversation = require('../models/Conversation.model')
const Document = require('../models/Document.model')
const vectorService = require('./vector.service')
const logger = require('../utils/logger')

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

async function appendMessages(conversationId, userId, userContent, assistantContent) {
  const now = new Date()
  const candidateTitle = userContent.trim().slice(0, 60)

  await Conversation.updateOne(
    { _id: conversationId, userId },
    [
      {
        $set: {
          title: {
            $cond: [{ $eq: ['$title', ''] }, candidateTitle || 'Nova conversa', '$title'],
          },
          messages: {
            $concatArrays: [
              '$messages',
              [
                { role: 'user', content: userContent, createdAt: now },
                { role: 'assistant', content: assistantContent, createdAt: now },
              ],
            ],
          },
          updatedAt: now,
        },
      },
    ]
  )
}

async function deleteConversation(userId, conversationId) {
  const conv = await Conversation.findOne({ _id: conversationId, userId }).select('_id')
  if (!conv) return false

  await vectorService.deleteConversationChunks({ conversationId }).catch((err) => {
    logger.error({ err, conversationId }, 'Failed to delete vector chunks for conversation')
  })
  await Document.deleteMany({ conversationId, userId })
  await Conversation.deleteOne({ _id: conversationId, userId })
  return true
}

module.exports = { createConversation, listConversations, getConversation, appendMessages, deleteConversation }
