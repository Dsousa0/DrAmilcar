const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, immutable: true },
})

const conversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: { type: String, default: '', trim: true, maxlength: 200 },
  messages: [messageSchema],
}, { timestamps: true })

conversationSchema.index({ userId: 1, createdAt: -1 })

conversationSchema.set('toJSON', {
  transform: (_, obj) => {
    delete obj.__v
    return obj
  },
})

module.exports = mongoose.model('Conversation', conversationSchema)
