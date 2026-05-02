const { chroma } = require('../config/chroma')
const logger = require('../utils/logger')

const GLOBAL_COLLECTION = 'global_documents'

async function getOrCreateCollection() {
  return chroma.getOrCreateCollection({
    name: GLOBAL_COLLECTION,
    metadata: { 'hnsw:space': 'cosine' },
  })
}

async function addChunks({ documentId, chunks, embeddings }) {
  const collection = await getOrCreateCollection()
  const ids = chunks.map((_, i) => `${documentId}_${i}`)
  await collection.add({
    ids,
    embeddings,
    documents: chunks,
    metadatas: chunks.map(() => ({ documentId })),
  })
  logger.info({ documentId, count: chunks.length }, 'Chunks added to ChromaDB')
}

async function queryChunks({ queryEmbedding, nResults = 5 }) {
  const collection = await getOrCreateCollection()
  const results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults,
  })
  return results.documents[0] || []
}

async function deleteDocumentChunks({ documentId }) {
  const collection = await getOrCreateCollection()
  const existing = await collection.get({ where: { documentId } })
  if (existing.ids.length > 0) {
    await collection.delete({ ids: existing.ids })
  }
  logger.info({ documentId, deleted: existing.ids.length }, 'Chunks deleted from ChromaDB')
}

module.exports = { addChunks, queryChunks, deleteDocumentChunks }
