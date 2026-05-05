require('dotenv').config()
const app = require('./app')
const { connectMongo } = require('./config/mongo')
const { initChroma } = require('./config/chroma')
const logger = require('./utils/logger')
const env = require('./config/env')

async function seedAdmin() {
  if (!env.ADMIN_EMAIL || !env.ADMIN_PASSWORD) return
  const User = require('./models/User.model')
  const bcrypt = require('bcrypt')
  const exists = await User.findOne({ email: env.ADMIN_EMAIL })
  if (exists) return
  const passwordHash = await bcrypt.hash(env.ADMIN_PASSWORD, 12)
  await User.create({ email: env.ADMIN_EMAIL, passwordHash, role: 'admin' })
  logger.info({ email: env.ADMIN_EMAIL }, 'Admin user created')
}

async function start() {
  await connectMongo()
  logger.info('MongoDB connected')

  await seedAdmin()

  await initChroma()
  logger.info('ChromaDB connected')

  const server = app.listen(env.PORT, () => {
    logger.info({ port: env.PORT }, 'Server started')
  })

  const shutdown = async (signal) => {
    logger.info({ signal }, 'Shutting down gracefully')
    server.close(async () => {
      const mongoose = require('mongoose')
      await mongoose.connection.close()
      logger.info('Shutdown complete')
      process.exit(0)
    })
    setTimeout(() => {
      logger.error('Forced shutdown after timeout')
      process.exit(1)
    }, 10_000)
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, 'Unhandled rejection')
  })
  process.on('uncaughtException', (err) => {
    logger.fatal({ err }, 'Uncaught exception')
    process.exit(1)
  })
}

start().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
