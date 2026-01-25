type EntityRecord = Record<string, unknown> & { id: string; created_by?: string }

type User = {
  id: string
  email: string
  name?: string
  role?: string
}

const storagePrefix = 'studyplan'
const userKey = `${storagePrefix}:user`
const tokenKey = `${storagePrefix}:token`
const usersKey = `${storagePrefix}:users`

const getStoredUser = (): User | null => {
  const raw = localStorage.getItem(userKey)
  if (!raw) return null
  try {
    return JSON.parse(raw) as User
  } catch {
    return null
  }
}

const setStoredUser = (user: User | null) => {
  if (!user) {
    localStorage.removeItem(userKey)
    return
  }
  localStorage.setItem(userKey, JSON.stringify(user))
}

const readLocalUsers = (): User[] => {
  const raw = localStorage.getItem(usersKey)
  if (!raw) return []
  try {
    return JSON.parse(raw) as User[]
  } catch {
    return []
  }
}

const writeLocalUsers = (users: User[]) => {
  localStorage.setItem(usersKey, JSON.stringify(users))
}

const createLocalToken = (user: User) => {
  const payload = btoa(JSON.stringify({ sub: user.id, email: user.email, name: user.name, role: user.role }))
  return `local.${payload}.token`
}

const notifyAuthChange = (user: User | null) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('studyplan:auth', { detail: user }))
  }
}

const getEntityKey = (entity: string, userId: string) =>
  `${storagePrefix}:entity:${userId}:${entity}`

const readEntity = (entity: string, userId: string): EntityRecord[] => {
  const raw = localStorage.getItem(getEntityKey(entity, userId))
  if (!raw) return []
  try {
    return JSON.parse(raw) as EntityRecord[]
  } catch {
    return []
  }
}

const writeEntity = (entity: string, userId: string, data: EntityRecord[]) => {
  localStorage.setItem(getEntityKey(entity, userId), JSON.stringify(data))
}

const sortByField = (records: EntityRecord[], sort?: string) => {
  if (!sort) return records
  const isDesc = sort.startsWith('-')
  const field = sort.replace(/^-/, '')
  return [...records].sort((a, b) => {
    const aValue = a[field] as string | number | undefined
    const bValue = b[field] as string | number | undefined
    if (aValue === bValue) return 0
    if (aValue === undefined) return 1
    if (bValue === undefined) return -1
    if (aValue < bValue) return isDesc ? 1 : -1
    return isDesc ? -1 : 1
  })
}

const createId = () =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `id_${Date.now()}_${Math.random().toString(16).slice(2)}`

const createEntity = (entity: string) => ({
  filter: async (criteria: Record<string, unknown> = {}, sort?: string) => {
    const user = getStoredUser()
    if (!user) return []
    const records = readEntity(entity, user.id)
    const filtered = records.filter((record) => {
      return Object.entries(criteria).every(([key, value]) => record[key] === value)
    })
    return sortByField(filtered, sort)
  },
  create: async (data: Record<string, unknown>) => {
    const user = getStoredUser()
    if (!user) throw new Error('User not logged in')
    const records = readEntity(entity, user.id)
    const record = {
      id: createId(),
      created_by: user.email,
      created_date: new Date().toISOString(),
      ...data,
    } as EntityRecord
    const next = [record, ...records]
    writeEntity(entity, user.id, next)
    return record
  },
  update: async (id: string, data: Record<string, unknown>) => {
    const user = getStoredUser()
    if (!user) throw new Error('User not logged in')
    const records = readEntity(entity, user.id)
    const next = records.map((record) =>
      record.id === id ? ({ ...record, ...data } as EntityRecord) : record,
    )
    writeEntity(entity, user.id, next)
    return next.find((record) => record.id === id) ?? null
  },
  delete: async (id: string) => {
    const user = getStoredUser()
    if (!user) throw new Error('User not logged in')
    const records = readEntity(entity, user.id)
    const next = records.filter((record) => record.id !== id)
    writeEntity(entity, user.id, next)
    return true
  },
  bulkCreate: async (data: Record<string, unknown>[]) => {
    const created = []
    for (const item of data) {
      created.push(await (createEntity(entity) as any).create(item))
    }
    return created
  },
})

const setToken = (token: string | null) => {
  if (!token) {
    localStorage.removeItem(tokenKey)
    return
  }
  localStorage.setItem(tokenKey, token)
}

const getToken = () => localStorage.getItem(tokenKey)

const parseToken = (token: string | null): User | null => {
  if (!token) return null
  const parts = token.split('.')
  if (parts.length !== 3) return null
  try {
    const payload = JSON.parse(atob(parts[1]))
    return { id: payload.sub, email: payload.email, name: payload.name, role: payload.role }
  } catch {
    return null
  }
}

const auth = {
  getCurrentUser: () => getStoredUser() ?? parseToken(getToken()),
  me: async () => {
    const token = getToken()
    if (!token) return null
    const response = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!response.ok) return null
    const data = await response.json()
    return data.user
  },
  register: async ({ email, password, name }: { email: string; password: string; name?: string }) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })
      if (!response.ok) throw new Error('Registration failed')
      const data = await response.json()
      setToken(data.token)
      setStoredUser(data.user)
      notifyAuthChange(data.user)
      return data.user
    } catch {
      const users = readLocalUsers()
      if (users.find((user) => user.email === email)) {
        throw new Error('User already exists')
      }
      const localUser: User = { id: email, email, name, role: 'user' }
      users.push(localUser)
      writeLocalUsers(users)
      const token = createLocalToken(localUser)
      setToken(token)
      setStoredUser(localUser)
      notifyAuthChange(localUser)
      return localUser
    }
  },
  login: async ({ email, password }: { email: string; password: string }) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (!response.ok) throw new Error('Login failed')
      const data = await response.json()
      setToken(data.token)
      setStoredUser(data.user)
      notifyAuthChange(data.user)
      return data.user
    } catch {
      const users = readLocalUsers()
      const localUser = users.find((user) => user.email === email)
      if (!localUser) throw new Error('Login failed')
      const token = createLocalToken(localUser)
      setToken(token)
      setStoredUser(localUser)
      notifyAuthChange(localUser)
      return localUser
    }
  },
  logout: async () => {
    setToken(null)
    setStoredUser(null)
    notifyAuthChange(null)
    return true
  },
}

const integrations = {
  Core: {
    UploadFile: async ({ file }: { file: File }) => {
      return { file_url: URL.createObjectURL(file) }
    },
    InvokeLLM: async () => {
      return { tasks: [] }
    },
  },
}

export const base44 = {
  auth,
  entities: {
    Task: createEntity('Task'),
    StudySession: createEntity('StudySession'),
    UserPreferences: createEntity('UserPreferences'),
    Reward: createEntity('Reward'),
    Subscription: createEntity('Subscription'),
  },
  integrations,
}

export type { User }
