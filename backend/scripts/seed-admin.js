require('dotenv').config()
const mongoose = require('mongoose')
const User = require('../src/models/User.model')
const { hashPassword } = require('../src/services/auth.service')

async function main() {
  const email = process.env.ADMIN_EMAIL
  const password = process.env.ADMIN_PASSWORD

  if (!email || !password) {
    console.error('ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env')
    process.exit(1)
  }

  await mongoose.connect(process.env.MONGODB_URI)

  const existing = await User.findOne({ email })
  if (existing) {
    if (existing.role !== 'admin') {
      existing.role = 'admin'
      await existing.save()
      console.log(`Updated existing user ${email} to admin.`)
    } else {
      console.log(`Admin user ${email} already exists. Nothing to do.`)
    }
    await mongoose.disconnect()
    return
  }

  const passwordHash = await hashPassword(password)
  await User.create({ email, passwordHash, role: 'admin' })
  console.log(`Admin user ${email} created successfully.`)
  await mongoose.disconnect()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
