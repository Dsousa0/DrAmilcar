const { embedQuery } = require('../services/embedding.service')
const { queryChunks } = require('../services/vector.service')
const { streamAnswer } = require('../services/rag.service')
const { appendMessages } = require('../services/conversation.service')
const Document = require('../models/Document.model')
const logger = require('../utils/logger')

async function streamChat(req, res) {
  const { question, conversationId } = req.body
  const { userId } = req.user

  if (!question?.trim()) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'question is required' },
    })
  }

  const docCount = await Document.countDocuments({})
  if (docCount === 0) {
    return res.status(422).json({
      error: {
        code: 'NO_DOCUMENTS',
        message: 'No indexed documents found. Upload a PDF first.',
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
    const chunks = await queryChunks({ queryEmbedding, nResults: 5 })

    if (chunks.length === 0) {
      const fallback = 'Não encontrei informações relevantes nos seus documentos.'
      res.write(`data: ${JSON.stringify({ token: fallback })}\n\n`)
      res.write('data: [DONE]\n\n')
      if (conversationId) {
        await appendMessages(conversationId, userId, question, fallback).catch((err) => { logger.error({ err }, 'Failed to persist conversation messages') })
      }
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
        logger.info({ userId }, 'Chat stream completed')
        if (conversationId) {
          await appendMessages(conversationId, userId, question, fullResponse).catch((err) => {
            logger.error({ err }, 'Failed to persist conversation messages')
          })
        }
      },
    })
  } catch (err) {
    logger.error({ err, userId }, 'Stream error')
    if (!res.writableEnded) {
      res.write(`data: ${JSON.stringify({ error: 'An error occurred during streaming' })}\n\n`)
      res.end()
    }
  }
}

module.exports = { streamChat }
