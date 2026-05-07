const User = require('../models/User.model')
const { hashPassword, comparePassword, generateToken } = require('../services/auth.service')

function buildSession(user) {
  const payload = {
    userId: user._id.toString(),
    email: user.email,
    role: user.role,
    mustChangePassword: !!user.mustChangePassword,
  }
  const token = generateToken(payload)
  return {
    token,
    user: {
      id: user._id,
      email: user.email,
      role: user.role,
      mustChangePassword: !!user.mustChangePassword,
    },
  }
}

async function login(req, res, next) {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'email and password are required' },
      })
    }
    const user = await User.findOne({ email })
    const valid = user && (await comparePassword(password, user.passwordHash))
    if (!valid) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' },
      })
    }
    res.json(buildSession(user))
  } catch (err) {
    next(err)
  }
}

async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'currentPassword and newPassword are required' },
      })
    }
    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'A nova senha deve ter pelo menos 6 caracteres.' },
      })
    }
    if (currentPassword === newPassword) {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'A nova senha deve ser diferente da atual.' },
      })
    }

    const user = await User.findById(req.user.userId)
    if (!user) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Usuário não encontrado' },
      })
    }
    const ok = await comparePassword(currentPassword, user.passwordHash)
    if (!ok) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Senha atual incorreta' },
      })
    }

    user.passwordHash = await hashPassword(newPassword)
    user.mustChangePassword = false
    await user.save()

    res.json(buildSession(user))
  } catch (err) {
    next(err)
  }
}

module.exports = { login, changePassword }
