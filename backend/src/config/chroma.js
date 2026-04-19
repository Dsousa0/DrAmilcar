const { ChromaClient } = require('chromadb')
const env = require('./env')

const chroma = new ChromaClient({ path: env.CHROMA_URL })

async function initChroma() {
  try {
    await chroma.heartbeat()
  } catch (e) {
    throw new Error(`ChromaDB unreachable at ${env.CHROMA_URL}: ${e.message}`)
  }
}

module.exports = { chroma, initChroma }
