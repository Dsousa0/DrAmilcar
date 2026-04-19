const { ChromaClient } = require('chromadb')
const env = require('./env')

const chroma = new ChromaClient({ path: env.CHROMA_URL })

module.exports = chroma
