const fs = require('fs')
const path = require('path')

const dataPath = path.join(process.cwd(), 'api', '_data')
const filePath = path.join(dataPath, 'users.json')

const ensureStore = () => {
  if (!fs.existsSync(dataPath)) {
    fs.mkdirSync(dataPath, { recursive: true })
  }
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify([]))
  }
}

const readUsers = () => {
  ensureStore()
  return JSON.parse(fs.readFileSync(filePath, 'utf8'))
}

const writeUsers = (users) => {
  ensureStore()
  fs.writeFileSync(filePath, JSON.stringify(users, null, 2))
}

module.exports = { readUsers, writeUsers }
