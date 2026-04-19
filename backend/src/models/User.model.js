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
}, { timestamps: true })

userSchema.set('toJSON', {
  transform: (_, obj) => {
    delete obj.passwordHash
    delete obj.__v
    return obj
  },
})

module.exports = mongoose.model('User', userSchema)
