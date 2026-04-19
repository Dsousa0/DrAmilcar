const pino = require('pino')
const env = require('../config/env')

const logger = pino({
  level: env.NODE_ENV === 'production' ? 'info' : 'debug',
  redact: ['req.headers.authorization', 'body.password', 'body.passwordHash'],
})

module.exports = logger
