const { Router } = require('express')
const { authenticate, requireAdmin } = require('../middleware/auth.middleware')
const { upload } = require('../middleware/upload.middleware')
const {
  listDocuments,
  uploadDocument,
  deleteDocument,
} = require('../controllers/documents.controller')

const router = Router()
router.use(authenticate)
router.get('/', listDocuments)
router.post('/upload', requireAdmin, upload.single('file'), uploadDocument)
router.delete('/:id', requireAdmin, deleteDocument)

module.exports = router
