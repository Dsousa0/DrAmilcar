const { Router } = require('express')
const { authenticate, requirePasswordChanged } = require('../middleware/auth.middleware')
const { deleteDocument } = require('../controllers/documents.controller')

const router = Router()
router.use(authenticate, requirePasswordChanged)
router.delete('/:id', deleteDocument)

module.exports = router
