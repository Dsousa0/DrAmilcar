require('dotenv').config()
const app = require('./app')
const { connectMongo } = require('./config/mongo')
const logger = require('./utils/logger')
const env = require('./config/env')

async function start() {
  await connectMongo()
  logger.info('MongoDB connected')

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
