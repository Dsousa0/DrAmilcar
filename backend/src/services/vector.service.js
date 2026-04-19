const { chroma } = require('../config/chroma')
const logger = require('../utils/logger')

function collectionName(userId) {
  return `user_${userId}`
}

async function getOrCreateCollection(userId) {
  return chroma.getOrCreateCollection({
    name: collectionName(userId),
    metadata: { 'hnsw:space': 'cosine' },
  })
}

async function addChunks({ userId, documentId, chunks, embeddings }) {
  const collection = await getOrCreateCollection(userId)
  const ids = chunks.map((_, i) => `${documentId}_${i}`)
  await collection.add({
    ids,
    embeddings,
    documents: chunks,
    metadatas: chunks.map(() => ({ documentId })),
  })
  logger.info({ userId, documentId, count: chunks.length }, 'Chunks added to ChromaDB')
}

async function queryChunks({ userId, queryEmbedding, nResults = 5 }) {
  const collection = await getOrCreateCollection(userId)
  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults,
  })
  return results.documents[0] || []
}

async function deleteDocumentChunks({ userId, documentId }) {
  const collection = await getOrCreateCollection(userId)
  const existing = await collection.get({ where: { documentId } })
  if (existing.ids.length > 0) {
    await collection.delete({ ids: existing.ids })
  }
  logger.info({ userId, documentId, deleted: existing.ids.length }, 'Chunks deleted from ChromaDB')
}

module.exports = { addChunks, queryChunks, deleteDocumentChunks }
