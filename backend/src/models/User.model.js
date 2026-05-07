const mongoose = require('mongoose')

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  passwordHash: { type: String, required: true },
  role: {
    type: String,
    enum: ['admin', 'user'],
    default: 'user',
  },
  mustChangePassword: { type: Boolean, default: false },
}, { timestamps: true })

userSchema.set('toJSON', {
  transform: (_, obj) => {
    delete obj.passwordHash
    delete obj.__v
    return obj
  },
})

module.exports = mongoose.model('User', userSchema)
