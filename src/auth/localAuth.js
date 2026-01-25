const storageKey = 'studyplan:localUser'
const usersKey = 'studyplan:localUsers'

const readUser = () => {
  const raw = localStorage.getItem(storageKey)
  if (!raw) return null
  try {
    return JSON.parse(raw)
  } catch {
    return null
  }
}

const writeUser = (user) => {
  if (!user) {
    localStorage.removeItem(storageKey)
    return
  }
  localStorage.setItem(storageKey, JSON.stringify(user))
}

const getStoredUser = () => readUser()

const readUsers = () => {
  const raw = localStorage.getItem(usersKey)
  if (!raw) return []
  try {
    return JSON.parse(raw)
  } catch {
    return []
  }
}

const writeUsers = (users) => {
  localStorage.setItem(usersKey, JSON.stringify(users))
}

const register = ({ email, password, name }) => {
  if (!email || !password) throw new Error('Email and password required')
  const users = readUsers()
  if (users.some((user) => user.email === email)) {
    throw new Error('User already exists')
  }
  const user = { id: email, email, name: name || '', password, createdAt: new Date().toISOString() }
  users.push(user)
  writeUsers(users)
  writeUser(user)
  return user
}

const login = ({ email, password }) => {
  if (!email || !password) throw new Error('Email and password required')
  const users = readUsers()
  const stored = users.find((user) => user.email === email)
  if (!stored || stored.password !== password) throw new Error('Invalid credentials')
  writeUser(stored)
  return stored
}

const oauth = ({ provider }) => {
  const id = `${provider}_${Date.now()}_${Math.random().toString(16).slice(2)}`
  const user = { id, email: `${id}@studyplan.local`, name: provider, createdAt: new Date().toISOString() }
  const users = readUsers()
  users.push(user)
  writeUsers(users)
  writeUser(user)
  return user
}

const logout = () => {
  writeUser(null)
}

export { getStoredUser, login, logout, oauth, register }
