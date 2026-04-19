const { ChatOpenAI } = require('@langchain/openai')
const env = require('../config/env')
const logger = require('../utils/logger')

const SYSTEM_TEMPLATE = `Você é um assistente técnico. Use os seguintes trechos de documentos para responder à pergunta do usuário. Se a resposta não estiver no texto, diga que não sabe.

CONTEXTO:
---
{context}
---`

function buildPrompt(chunks, question) {
  const context = chunks.join('\n\n')
  return {
    system: SYSTEM_TEMPLATE.replace('{context}', context),
    user: question,
  }
}

async function streamAnswer({ chunks, question, onToken, onDone }) {
  const { system, user } = buildPrompt(chunks, question)

  const llm = new ChatOpenAI({
    openAIApiKey: env.OPENROUTER_API_KEY,
    modelName: env.LLM_MODEL,
    streaming: true,
    maxTokens: 2048,
    configuration: {
      baseURL: env.OPENROUTER_BASE_URL,
      defaultHeaders: {
        'HTTP-Referer': 'https://github.com/Dsousa0/DrAmilcar',
      },
    },
  })

  const stream = await llm.stream([
    { role: 'system', content: system },
    { role: 'user', content: user },
  ])

  for await (const chunk of stream) {
    const token = chunk.content
    if (token) onToken(token)
  }

  onDone()
  logger.debug({ model: env.LLM_MODEL }, 'Stream completed')
}

module.exports = { buildPrompt, streamAnswer }
