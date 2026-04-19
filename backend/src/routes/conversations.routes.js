const { Router } = require('express')
const { authenticate } = require('../middleware/auth.middleware')
const { list, create, get } = require('../controllers/conversations.controller')

const router = Router()
router.use(authenticate)
router.get('/', list)
router.post('/', create)
router.get('/:id', get)

module.exports = router
