const Document = require('../models/Document.model')
const pdfService = require('../services/pdf.service')
const embeddingService = require('../services/embedding.service')
const vectorService = require('../services/vector.service')
const logger = require('../utils/logger')

async function listDocuments(req, res, next) {
  try {
    const docs = await Document.find({ userId: req.user.userId }).sort({ createdAt: -1 })
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

    const { originalname, buffer, size } = req.file
    const { userId } = req.user

    const { chunks } = await pdfService.processBuffer(buffer)
    if (chunks.length === 0) {
      return res.status(422).json({
        error: { code: 'UNPROCESSABLE', message: 'PDF has no extractable text' },
      })
    }

    const embeddings = await embeddingService.embedTexts(chunks)

    const doc = await Document.create({
      userId,
      originalName: originalname,
      sizeBytes: size,
      chunkCount: chunks.length,
      chromaCollection: `user_${userId}`,
    })

    await vectorService.addChunks({
      userId,
      documentId: doc._id.toString(),
      chunks,
      embeddings,
    })

    logger.info({ userId, documentId: doc._id, chunks: chunks.length }, 'Document indexed')
    res.status(201).json(doc)
  } catch (err) {
    next(err)
  }
}

async function deleteDocument(req, res, next) {
  try {
    const { id } = req.params
    const { userId } = req.user

    const doc = await Document.findOne({ _id: id, userId })
    if (!doc) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'Document not found' },
      })
    }

    await vectorService.deleteDocumentChunks({ userId, documentId: id })
    await Document.deleteOne({ _id: id })

    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

module.exports = { listDocuments, uploadDocument, deleteDocument }
