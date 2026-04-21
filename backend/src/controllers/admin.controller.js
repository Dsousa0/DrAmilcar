const User = require('../models/User.model')
const { hashPassword } = require('../services/auth.service')

async function listUsers(req, res, next) {
  try {
    const users = await User.find({}).sort({ createdAt: -1 })
    res.json({ data: users })
  } catch (err) {
    next(err)
  }
}

async function createUser(req, res, next) {
  try {
    const { email, password, role = 'user' } = req.body
    if (!email || !password) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'email and password are required' },
      })
    }
    if (!['admin', 'user'].includes(role)) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'role must be admin or user' },
      })
    }
    if (await User.findOne({ email })) {
      return res.status(409).json({
        error: { code: 'CONFLICT', message: 'Email already registered' },
      })
    }
    const passwordHash = await hashPassword(password)
    const user = await User.create({ email, passwordHash, role })
    res.status(201).json(user)
  } catch (err) {
    next(err)
  }
}

async function updateUser(req, res, next) {
  try {
    const { id } = req.params
    const { email, password, role } = req.body

    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'User not found' },
      })
    }

    if (email) {
      const conflict = await User.findOne({ email, _id: { $ne: id } })
      if (conflict) {
        return res.status(409).json({
          error: { code: 'CONFLICT', message: 'Email already in use' },
        })
      }
      user.email = email
    }

    if (password) {
      user.passwordHash = await hashPassword(password)
    }

    if (role) {
      if (!['admin', 'user'].includes(role)) {
        return res.status(400).json({
          error: { code: 'VALIDATION_ERROR', message: 'role must be admin or user' },
        })
      }
      user.role = role
    }

    await user.save()
    res.json(user)
  } catch (err) {
    next(err)
  }
}

async function deleteUser(req, res, next) {
  try {
    const { id } = req.params
    if (id === req.user.userId) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Cannot delete your own account' },
      })
    }
    const user = await User.findByIdAndDelete(id)
    if (!user) {
      return res.status(404).json({
        error: { code: 'NOT_FOUND', message: 'User not found' },
      })
    }
    res.status(204).send()
  } catch (err) {
    next(err)
  }
}

module.exports = { listUsers, createUser, updateUser, deleteUser }
