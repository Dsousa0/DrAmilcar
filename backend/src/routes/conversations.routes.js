const { Router } = require('express')
const { authenticate } = require('../middleware/auth.middleware')
const { upload } = require('../middleware/upload.middleware')
const { list, create, get, remove } = require('../controllers/conversations.controller')
const {
  listDocuments,
  uploadDocument,
} = require('../controllers/documents.controller')

const router = Router()
router.use(authenticate)
router.get('/', list)
router.post('/', create)
router.get('/:id', get)
router.delete('/:id', remove)

router.get('/:conversationId/documents', listDocuments)
router.post('/:conversationId/documents/upload', upload.single('file'), uploadDocument)

module.exports = router
