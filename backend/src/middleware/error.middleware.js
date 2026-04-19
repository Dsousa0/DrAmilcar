function errorHandler(err, req, res, next) {
  const status = err.status || 500
  res.status(status).json({ error: { code: 'INTERNAL_ERROR', message: err.message } })
}
module.exports = { errorHandler }
