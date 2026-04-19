const mongoose = require('mongoose')
const env = require('./env')

async function connectMongo() {
  await mongoose.connect(env.MONGODB_URI, {
    maxPoolSize: 10,
    minPoolSize: 2,
    socketTimeoutMS: 30_000,
    serverSelectionTimeoutMS: 5_000,
  })
}

module.exports = { connectMongo }
