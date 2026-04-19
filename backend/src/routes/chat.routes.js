const { Router } = require('express')
const { authenticate } = require('../middleware/auth.middleware')
const { streamChat } = require('../controllers/chat.controller')

const router = Router()
router.use(authenticate)
router.post('/stream', streamChat)

module.exports = router
