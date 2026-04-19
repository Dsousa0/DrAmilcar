const { embedQuery } = require('../services/embedding.service')
const { queryChunks } = require('../services/vector.service')
const { streamAnswer } = require('../services/rag.service')
const Document = require('../models/Document.model')
const logger = require('../utils/logger')

async function streamChat(req, res, next) {
  const { question } = req.body
  const { userId } = req.user

  if (!question?.trim()) {
    return res.status(400).json({
      error: { code: 'VALIDATION_ERROR', message: 'question is required' },
    })
  }

  const docCount = await Document.countDocuments({ userId })
  if (docCount === 0) {
    return res.status(422).json({
      error: {
        code: 'NO_DOCUMENTS',
        message: 'No indexed documents found. Upload a PDF first.',
      },
    })
  }

  // Set SSE headers before any async operation that might fail
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Accel-Buffering', 'no')
  res.flushHeaders()

  try {
    const queryEmbedding = await embedQuery(question)
    const chunks = await queryChunks({ userId, queryEmbedding, nResults: 5 })

    if (chunks.length === 0) {
      res.write(
        `data: ${JSON.stringify({ token: 'Não encontrei informações relevantes nos seus documentos.' })}\n\n`
      )
      res.write('data: [DONE]\n\n')
      return res.end()
    }

    await streamAnswer({
      chunks,
      question,
      onToken: (token) => {
        res.write(`data: ${JSON.stringify({ token })}\n\n`)
      },
      onDone: () => {
        res.write('data: [DONE]\n\n')
        res.end()
        logger.info({ userId }, 'Chat stream completed')
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
