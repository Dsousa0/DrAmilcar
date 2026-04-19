const mongoose = require('mongoose')

const documentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  originalName: { type: String, required: true },
  sizeBytes: { type: Number, required: true },
  chunkCount: { type: Number, required: true },
  chromaCollection: { type: String, required: true },
}, { timestamps: true })

documentSchema.set('toJSON', {
  transform: (_, obj) => {
    delete obj.__v
    return obj
  },
})

module.exports = mongoose.model('Document', documentSchema)
