const express = require('express')
const helmet = require('helmet')
const cors = require('cors')
const rateLimit = require('express-rate-limit')
const pinoHttp = require('pino-http')
const env = require('./config/env')
const logger = require('./utils/logger')

const authRoutes = require('./routes/auth.routes')
const adminRoutes = require('./routes/admin.routes')
const documentsRoutes = require('./routes/documents.routes')
const chatRoutes = require('./routes/chat.routes')
const conversationsRoutes = require('./routes/conversations.routes')
const { errorHandler } = require('./middleware/error.middleware')

const app = express()

app.use(helmet())
app.use(cors({ origin: env.CORS_ORIGIN || '*' }))
app.use(express.json({ limit: '1mb' }))
app.use(pinoHttp({ logger }))

app.use('/api/', rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
}))

app.get('/health', (req, res) => res.json({ status: 'ok' }))

app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/documents', documentsRoutes)
app.use('/api/chat', chatRoutes)
app.use('/api/conversations', conversationsRoutes)

app.use(errorHandler)

module.exports = app
