const { Router } = require('express')
const { authenticate, requireAdmin } = require('../middleware/auth.middleware')
const { listUsers, createUser, updateUser, deleteUser } = require('../controllers/admin.controller')

const router = Router()

router.use(authenticate, requireAdmin)

router.get('/users', listUsers)
router.post('/users', createUser)
router.patch('/users/:id', updateUser)
router.delete('/users/:id', deleteUser)

module.exports = router
