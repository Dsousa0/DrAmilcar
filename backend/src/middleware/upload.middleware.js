const multer = require('multer')
const env = require('../config/env')

const storage = multer.memoryStorage()

function fileFilter(req, file, cb) {
  if (file.mimetype === 'application/pdf') {
    cb(null, true)
  } else {
    cb(new Error('Only PDF files are allowed'), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.UPLOAD_LIMIT_MB * 1024 * 1024 },
})

module.exports = { upload }
