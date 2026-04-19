const { pipeline } = require('@xenova/transformers')

const MODEL = 'Xenova/all-MiniLM-L6-v2'
let embedder = null

async function getEmbedder() {
  if (!embedder) {
    embedder = await pipeline('feature-extraction', MODEL)
  }
  return embedder
}

async function embedTexts(texts) {
  const embed = await getEmbedder()
  const results = []
  for (const text of texts) {
    const output = await embed(text, { pooling: 'mean', normalize: true })
    results.push(Array.from(output.data))
  }
  return results
}

async function embedQuery(text) {
  const embed = await getEmbedder()
  const output = await embed(text, { pooling: 'mean', normalize: true })
  return Array.from(output.data)
}

module.exports = { embedTexts, embedQuery }
