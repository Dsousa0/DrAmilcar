const { chroma } = require('../config/chroma')
const logger = require('../utils/logger')

const COLLECTION_NAME = 'documents'

async function getOrCreateCollection() {
  return chroma.getOrCreateCollection({
    name: COLLECTION_NAME,
    metadata: { 'hnsw:space': 'cosine' },
  })
}

async function addChunks({ documentId, userId, conversationId, chunks, embeddings }) {
  const collection = await getOrCreateCollection()
  const ids = chunks.map((_, i) => `${documentId}_${i}`)
  const meta = {
    documentId: documentId.toString(),
    userId: userId.toString(),
    conversationId: conversationId.toString(),
  }
  await collection.add({
    ids,
    embeddings,
    documents: chunks,
    metadatas: chunks.map(() => meta),
  })
  logger.info({ documentId, userId, conversationId, count: chunks.length }, 'Chunks added to ChromaDB')
}

async function queryChunks({ queryEmbedding, nResults = 5, where }) {
  const collection = await getOrCreateCollection()
  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults,
    ...(where ? { where } : {}),
  })
  return results.documents[0] || []
}

async function deleteDocumentChunks({ documentId }) {
  const collection = await getOrCreateCollection()
  const existing = await collection.get({ where: { documentId: documentId.toString() } })
  if (existing.ids.length > 0) {
    await collection.delete({ ids: existing.ids })
  }
  logger.info({ documentId, deleted: existing.ids.length }, 'Chunks deleted from ChromaDB')
}

async function deleteConversationChunks({ conversationId }) {
  const collection = await getOrCreateCollection()
  const existing = await collection.get({ where: { conversationId: conversationId.toString() } })
  if (existing.ids.length > 0) {
    await collection.delete({ ids: existing.ids })
  }
  logger.info({ conversationId, deleted: existing.ids.length }, 'Conversation chunks deleted from ChromaDB')
}

module.exports = { addChunks, queryChunks, deleteDocumentChunks, deleteConversationChunks }
