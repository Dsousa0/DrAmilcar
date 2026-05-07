const { ChatOpenAI } = require('@langchain/openai')
const env = require('../config/env')
const logger = require('../utils/logger')

const SYSTEM_TEMPLATE = `Você é um assistente técnico. Use apenas os trechos abaixo, extraídos dos documentos enviados pelo usuário nesta conversa, para responder à pergunta. Se a resposta não estiver no texto, diga que não sabe.

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
    maxRetries: 0,
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

  const fallbacks = env.LLM_FALLBACK_MODEL
    ? env.LLM_FALLBACK_MODEL.split(',').map(m => m.trim()).filter(Boolean)
    : []
  const modelsToTry = [env.LLM_MODEL, ...fallbacks].filter(Boolean)

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
      const isRetryable = err.status === 429 || err.status === 404 ||
        err.message?.includes('rate limit') || err.message?.includes('rate-limited') ||
        err.message?.includes('No endpoints found')
      if (isRetryable && modelName !== modelsToTry.at(-1)) {
        logger.warn({ model: modelName, fallback: modelsToTry[modelsToTry.indexOf(modelName) + 1], status: err.status }, 'Model unavailable, switching to fallback')
      } else {
        throw err
      }
    }
  }
}

module.exports = { buildPrompt, streamAnswer }
