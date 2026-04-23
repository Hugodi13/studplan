const fs = require('fs')
const path = require('path')

const dataPath = path.join(process.cwd(), 'api', '_data')
const filePath = path.join(dataPath, 'users.json')
const memoryStoreKey = '__studyplanUsersStore'

const getMemoryStore = () => {
  if (!global[memoryStoreKey]) {
    global[memoryStoreKey] = []
  }
  return global[memoryStoreKey]
}

const ensureStore = () => {
  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath, { recursive: true })
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([]))
  }
}

const readUsers = () => {
  try {
    ensureStore()
    const users = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    global[memoryStoreKey] = users
    return users
  } catch {
    return getMemoryStore()
  }
}

const writeUsers = (users) => {
  global[memoryStoreKey] = users
  try {
    ensureStore()
    fs.writeFileSync(filePath, JSON.stringify(users, null, 2))
  } catch {
    // Vercel runtime can be read-only; keep in-memory fallback.
  }
}

module.exports = { readUsers, writeUsers }
