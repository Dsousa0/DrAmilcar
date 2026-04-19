const { OpenAIEmbeddings } = require('@langchain/openai')
const env = require('../config/env')

const embeddings = new OpenAIEmbeddings({
  openAIApiKey: env.OPENROUTER_API_KEY,
  modelName: env.EMBEDDING_MODEL,
  configuration: {
    baseURL: env.OPENROUTER_BASE_URL,
  },
})

async function embedTexts(texts) {
  return embeddings.embedDocuments(texts)
}

async function embedQuery(text) {
  return embeddings.embedQuery(text)
}

module.exports = { embedTexts, embedQuery }
