const mongoose = require('mongoose')
const { embedQuery } = require('../services/embedding.service')
const { queryChunks } = require('../services/vector.service')
const { streamAnswer } = require('../services/rag.service')
const { appendMessages } = require('../services/conversation.service')
const Conversation = require('../models/Conversation.model')
const Document = require('../models/Document.model')
const env = require('../config/env')
const logger = require('../utils/logger')

async function streamChat(req, res) {
  const { question, conversationId } = req.body
  const { userId } = req.user

  if (!question?.trim()) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'question is required' },
    })
  }

  if (!conversationId || !mongoose.Types.ObjectId.isValid(conversationId)) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'conversationId is required' },
    })
  }

  const conv = await Conversation.findOne({ _id: conversationId, userId }).select('_id')
  if (!conv) {
    return res.status(404).json({
      error: { code: 'NOT_FOUND', message: 'Conversation not found' },
    })
  }

  const docCount = await Document.countDocuments({ userId, conversationId })
  if (docCount === 0) {
    return res.status(422).json({
      error: {
        code: 'NO_DOCUMENTS',
        message: 'Esta conversa ainda não tem documentos. Envie um PDF para começar.',
      },
    })
  }

  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  try {
    const queryEmbedding = await embedQuery(question)
    const chunks = await queryChunks({
      queryEmbedding,
      nResults: env.RAG_CHUNKS,
      where: { conversationId: conversationId.toString() },
    })

    if (chunks.length === 0) {
      const fallback = 'Não encontrei informações relevantes nos documentos desta conversa.'
      res.write(`data: ${JSON.stringify({ token: fallback })}\n\n`)
      res.write('data: [DONE]\n\n')
      await appendMessages(conversationId, userId, question, fallback).catch((err) => {
        logger.error({ err }, 'Failed to persist conversation messages')
      })
      return res.end()
    }

    let fullResponse = ''

    await streamAnswer({
      chunks,
      question,
      onToken: (token) => {
        fullResponse += token
        res.write(`data: ${JSON.stringify({ token })}\n\n`)
      },
      onDone: async () => {
        res.write('data: [DONE]\n\n')
        res.end()
        logger.info({ userId, conversationId }, 'Chat stream completed')
        await appendMessages(conversationId, userId, question, fullResponse).catch((err) => {
          logger.error({ err }, 'Failed to persist conversation messages')
        })
      },
    })
  } catch (err) {
    logger.error({ err, userId, conversationId }, 'Stream error')
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ error: 'An error occurred during streaming' })}\n\n`)
      res.end()
    }
  }
}

module.exports = { streamChat }
