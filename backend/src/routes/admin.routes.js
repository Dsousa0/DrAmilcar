const { Router } = require('express')
const { authenticate, requireAdmin, requirePasswordChanged } = require('../middleware/auth.middleware')
const { listUsers, createUser, updateUser, deleteUser } = require('../controllers/admin.controller')

const router = Router()

router.use(authenticate, requirePasswordChanged, requireAdmin)

router.get('/users', listUsers)
router.post('/users', createUser)
router.patch('/users/:id', updateUser)
router.delete('/users/:id', deleteUser)

module.exports = router
