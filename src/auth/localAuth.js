const storageKey = 'studyplan:localUser'

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

const register = ({ email, password, name }) => {
  if (!email || !password) throw new Error('Email and password required')
  const user = { id: email, email, name: name || '', createdAt: new Date().toISOString() }
  writeUser(user)
  return user
}

const login = ({ email, password }) => {
  if (!email || !password) throw new Error('Email and password required')
  const stored = readUser()
  if (!stored || stored.email !== email) throw new Error('Invalid credentials')
  return stored
}

const oauth = ({ provider }) => {
  const id = `${provider}_${Date.now()}_${Math.random().toString(16).slice(2)}`
  const user = { id, email: `${id}@studyplan.local`, name: provider, createdAt: new Date().toISOString() }
  writeUser(user)
  return user
}

const logout = () => {
  writeUser(null)
}

export { getStoredUser, login, logout, oauth, register }
