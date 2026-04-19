require('dotenv').config()
const { z } = require('zod')

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  MONGODB_URI: z.string().min(1),
  CHROMA_URL: z.string().url(),
  OPENROUTER_API_KEY: z.string().min(1),
  OPENROUTER_BASE_URL: z.string().url().default('https://openrouter.ai/api/v1'),
  LLM_MODEL: z.string().default('openai/gpt-4o'),
  EMBEDDING_MODEL: z.string().default('openai/text-embedding-3-small'),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string().default('24h'),
  UPLOAD_LIMIT_MB: z.coerce.number().default(250),
  CORS_ORIGIN: z.string().optional(),
})

const parsed = schema.safeParse(process.env)
if (!parsed.success) {
  console.error('Invalid environment variables:', JSON.stringify(parsed.error.format(), null, 2))
  process.exit(1)
}

module.exports = parsed.data
