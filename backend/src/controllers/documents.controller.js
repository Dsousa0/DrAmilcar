const mongoose = require('mongoose')
const Document = require('../models/Document.model')
const Conversation = require('../models/Conversation.model')
const pdfService = require('../services/pdf.service')
const embeddingService = require('../services/embedding.service')
const vectorService = require('../services/vector.service')
const logger = require('../utils/logger')

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id)
}

async function assertConversationOwnership(conversationId, userId) {
  if (!isValidObjectId(conversationId)) return null
  return Conversation.findOne({ _id: conversationId, userId }).select('_id')
}

async function listDocuments(req, res, next) {
  try {
    const { conversationId } = req.params
    const { userId } = req.user

    const conv = await assertConversationOwnership(conversationId, userId)
    if (!conv) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Conversation not found' },
      })
    }

    const docs = await Document.find({ userId, conversationId }).sort({ createdAt: -1 })
    res.json({ data: docs })
  } catch (err) {
    next(err)
  }
}

async function uploadDocument(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'A PDF file is required' },
      })
    }

    const { conversationId } = req.params
    const { userId } = req.user

    const conv = await assertConversationOwnership(conversationId, userId)
    if (!conv) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Conversation not found' },
      })
    }

    const { originalname, buffer, size } = req.file
    const { chunks } = await pdfService.processBuffer(buffer)
    if (chunks.length === 0) {
      return res.status(422).json({
        error: { code: 'UNPROCESSABLE', message: 'PDF has no extractable text' },
      })
    }

    const embeddings = await embeddingService.embedTexts(chunks)

    const doc = await Document.create({
      userId,
      conversationId,
      originalName: originalname,
      sizeBytes: size,
      chunkCount: chunks.length,
    })

    await vectorService.addChunks({
      documentId: doc._id.toString(),
      userId,
      conversationId,
      chunks,
      embeddings,
    })

    logger.info({ userId, conversationId, documentId: doc._id, chunks: chunks.length }, 'Document indexed')
    res.status(201).json(doc)
  } catch (err) {
    next(err)
  }
}

async function deleteDocument(req, res, next) {
  try {
    const { id } = req.params
    const { userId } = req.user

    if (!isValidObjectId(id)) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Document not found' },
      })
    }

    const doc = await Document.findOne({ _id: id, userId })
    if (!doc) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Document not found' },
      })
    }

    await vectorService.deleteDocumentChunks({ documentId: id })
    await Document.deleteOne({ _id: id })

    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

module.exports = { listDocuments, uploadDocument, deleteDocument }
