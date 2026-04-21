const User = require('../models/User.model')
const { hashPassword, comparePassword, generateToken } = require('../services/auth.service')

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
    const token = generateToken({ userId: user._id.toString(), email: user.email, role: user.role })
    res.json({ token, user: { id: user._id, email: user.email, role: user.role } })
  } catch (err) {
    next(err)
  }
}

module.exports = { login }
