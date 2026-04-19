const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
})

const conversationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  title: { type: String, default: '' },
  messages: [messageSchema],
}, { timestamps: true })

conversationSchema.set('toJSON', {
  transform: (_, obj) => {
    delete obj.__v
    return obj
  },
})

module.exports = mongoose.model('Conversation', conversationSchema)
