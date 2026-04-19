const logger = require('../utils/logger')

function errorHandler(err, req, res, next) {
  logger.error({ err, url: req.url, method: req.method }, 'Unhandled error')

  if (err.name === 'MulterError') {
    return res.status(400).json({ error: { code: 'UPLOAD_ERROR', message: err.message } })
  }
  if (err.message === 'Only PDF files are allowed') {
    return res.status(400).json({ error: { code: 'INVALID_FILE_TYPE', message: err.message } })
  }

  const status = err.status || 500
  const message =
    process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message
  res.status(status).json({ error: { code: 'INTERNAL_ERROR', message } })
}

module.exports = { errorHandler }
