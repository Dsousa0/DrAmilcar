require('dotenv').config()
const mongoose = require('mongoose')
const { ChromaClient } = require('chromadb')

async function main() {
  const mongoUri = process.env.MONGODB_URI
  const chromaUrl = process.env.CHROMA_URL
  if (!mongoUri || !chromaUrl) {
    console.error('MONGODB_URI and CHROMA_URL must be set in .env')
    process.exit(1)
  }

  await mongoose.connect(mongoUri)
  const docsResult = await mongoose.connection.db.collection('documents').deleteMany({})
  const convsResult = await mongoose.connection.db.collection('conversations').deleteMany({})
  console.log(`Mongo: removed ${docsResult.deletedCount} documents and ${convsResult.deletedCount} conversations.`)
  await mongoose.disconnect()

  const chroma = new ChromaClient({ path: chromaUrl })
  for (const name of ['global_documents', 'documents']) {
    try {
      await chroma.deleteCollection({ name })
      console.log(`Chroma: dropped collection "${name}".`)
    } catch (err) {
      console.log(`Chroma: collection "${name}" not present or already removed.`)
    }
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
