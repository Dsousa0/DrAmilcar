const { Router } = require('express')
const { authenticate } = require('../middleware/auth.middleware')
const { login, changePassword } = require('../controllers/auth.controller')

const router = Router()
router.post('/login', login)
router.post('/change-password', authenticate, changePassword)

module.exports = router
