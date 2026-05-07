const { Router } = require('express')
const { authenticate } = require('../middleware/auth.middleware')
const { deleteDocument } = require('../controllers/documents.controller')

const router = Router()
router.use(authenticate)
router.delete('/:id', deleteDocument)

module.exports = router
