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

function buildLLM(modelName) {
  return new ChatOpenAI({
    openAIApiKey: env.OPENROUTER_API_KEY,
    modelName,
    streaming: true,
    maxTokens: 2048,
    configuration: {
      baseURL: env.OPENROUTER_BASE_URL,
      defaultHeaders: {
        'HTTP-Referer': 'https://github.com/Dsousa0/DrAmilcar',
      },
    },
  })
}

async function streamAnswer({ chunks, question, onToken, onDone }) {
  const { system, user } = buildPrompt(chunks, question)
  const messages = [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ]

  const modelsToTry = [env.LLM_MODEL, env.LLM_FALLBACK_MODEL].filter(Boolean)

  for (const modelName of modelsToTry) {
    try {
      const stream = await buildLLM(modelName).stream(messages)
      for await (const chunk of stream) {
        if (chunk.content) onToken(chunk.content)
      }
      await onDone()
      logger.debug({ model: modelName }, 'Stream completed')
      return
    } catch (err) {
      const isRateLimit = err.status === 429 || err.message?.includes('rate limit') || err.message?.includes('rate-limited')
      if (isRateLimit && modelName !== modelsToTry.at(-1)) {
        logger.warn({ model: modelName, fallback: modelsToTry[modelsToTry.indexOf(modelName) + 1] }, 'Rate limit hit, switching to fallback model')
      } else {
        throw err
      }
    }
  }
}

module.exports = { buildPrompt, streamAnswer }
