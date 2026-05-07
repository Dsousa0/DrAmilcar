const { Router } = require('express')
const { authenticate, requirePasswordChanged } = require('../middleware/auth.middleware')
const { streamChat } = require('../controllers/chat.controller')

const router = Router()
router.use(authenticate, requirePasswordChanged)
router.post('/stream', streamChat)

module.exports = router
