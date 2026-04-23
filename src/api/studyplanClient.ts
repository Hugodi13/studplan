/**
 * Client application StudyPlan : auth, entités locales, facturation, intégrations (Pronote, École Directe).
 * Aucun lien avec un service tiers portant le même nom.
 */
import { isSupabaseConfigured } from '@/lib/supabaseClient'
import {
  activatePaypalInSupabase,
  cancelSubInSupabase,
  getFounderSlotsInfo,
  getSubscriptionForCurrentUser,
} from '@/api/supabaseProfileBilling'
import type { User, RegisterResult } from './studyplanClientTypes'
export type { User, RegisterResult } from './studyplanClientTypes'

type EntityRecord = Record<string, unknown> & { id: string; created_by?: string }

/** Compte enregistré localement (mot de passe jamais exposé hors stockage navigateur). */
type LocalAccount = User & {
  password: string
  email_verified?: boolean
  verify_token?: string
  verify_expires?: string
  password_reset_token?: string
  password_reset_expires?: string
}

const storagePrefix = 'studyplan'
const userKey = `${storagePrefix}:user`
const tokenKey = `${storagePrefix}:token`
const usersKey = `${storagePrefix}:users`

/** Base de l’API hébergée ailleurs (ex. Vercel) : `https://xxx.vercel.app` — laisser vide = même origine. */
const rawApiBase =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL
    ? String(import.meta.env.VITE_API_BASE_URL).replace(/\/$/, '')
    : ''

/** Résout `/api/...` vers l’hôte API (Vercel) en prod si `VITE_API_BASE_URL` est défini. */
export function getStudyplanApiUrl(path: string) {
  const p = path.startsWith('/') ? path : `/${path}`
  return rawApiBase ? `${rawApiBase}${p}` : p
}

const stripPassword = (user: (User & { password?: string }) | null): User | null => {
  if (!user) return null
  const { password, ...safe } = user as User & { password?: string }
  void password
  return safe as User
}

const getStoredUser = (): User | null => {
  const raw = localStorage.getItem(userKey)
  if (!raw) return null
  try {
    return stripPassword(JSON.parse(raw) as User & { password?: string })
  } catch {
    return null
  }
}

const setStoredUser = (user: User | null) => {
  if (!user) {
    localStorage.removeItem(userKey)
    return
  }
  localStorage.setItem(userKey, JSON.stringify(stripPassword(user as User & { password?: string })))
}

const readLocalUsers = (): LocalAccount[] => {
  const raw = localStorage.getItem(usersKey)
  if (!raw) return []
  try {
    return JSON.parse(raw) as LocalAccount[]
  } catch {
    return []
  }
}

const writeLocalUsers = (users: LocalAccount[]) => {
  localStorage.setItem(usersKey, JSON.stringify(users))
}

const createLocalToken = (user: User) => {
  const payload = btoa(JSON.stringify({ sub: user.id, email: user.email, name: user.name, role: user.role }))
  return `local.${payload}.token`
}

const normalizeEmail = (email: string) => email.trim().toLowerCase()

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

const founderIndexKey = `${storagePrefix}:founderGlobalIndex`

const incrementFounderIndex = (): number => {
  const n = (parseInt(localStorage.getItem(founderIndexKey) || '0', 10) || 0) + 1
  localStorage.setItem(founderIndexKey, String(n))
  return n
}

/** 100 premiers inscrits (sur cet appareil / index local) = Premium à vie. */
const maybeGrantFounderSubscription = (user: User) => {
  const rank = incrementFounderIndex()
  if (rank > 100) return
  const subId = `sub_founder_${user.id}`
  const rec: EntityRecord = {
    id: subId,
    plan: 'premium',
    is_active: true,
    is_lifetime: true,
    is_founder: true,
    founder_rank: rank,
    created_by: user.email,
    created_date: new Date().toISOString(),
  }
  const list = readEntity('Subscription', user.id).filter((r) => r.id !== subId)
  writeEntity('Subscription', user.id, [rec, ...list])
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
    const ent = createEntity(entity) as {
      create: (item: Record<string, unknown>) => Promise<EntityRecord>
    }
    const created: EntityRecord[] = []
    for (const item of data) {
      created.push(await ent.create(item))
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
  /** Au démarrage : supprime un token orphelin / illisible pour forcer l’écran de connexion. */
  validateSession: (): User | null => {
    if (isSupabaseConfigured()) {
      return getStoredUser() ?? parseToken(getToken())
    }
    const token = getToken()
    const user = getStoredUser() ?? (token ? parseToken(token) : null)
    if (token && !user) {
      setToken(null)
      setStoredUser(null)
      notifyAuthChange(null)
      return null
    }
    if (token && user && !getStoredUser()) {
      setStoredUser(user)
      notifyAuthChange(user)
    }
    return getStoredUser() ?? parseToken(getToken())
  },
  me: async () => {
    if (isSupabaseConfigured()) {
      const s = await import('./supabaseAuth')
      return s.supaMe()
    }
    const token = getToken()
    if (!token) return getStoredUser()
    if (token.startsWith('local.')) {
      return getStoredUser() ?? parseToken(token)
    }
    try {
      const response = await fetch(getStudyplanApiUrl('/api/auth/me'), {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!response.ok) throw new Error('Auth failed')
      const data = await response.json()
      return data.user
    } catch {
      return getStoredUser() ?? parseToken(token)
    }
  },
  register: async ({
    email,
    password,
    name,
  }: {
    email: string
    password: string
    name?: string
  }): Promise<RegisterResult> => {
    if (isSupabaseConfigured()) {
      const s = await import('./supabaseAuth')
      return s.supaRegister({ email, password, name })
    }
    const localRegister = (): RegisterResult => {
      if (password.length < 8) {
        throw new Error('Password must be at least 8 characters.')
      }
      const emailNorm = normalizeEmail(email)
      const users = readLocalUsers()
      if (users.some((user) => normalizeEmail(user.email) === emailNorm)) {
        throw new Error('User already exists')
      }
      const displayName = (name || emailNorm.split('@')[0] || 'Élève').trim()
      /** Compte 100 % navigateur : pas d’e-mail, on considère l’e-mail vérifié et on ouvre la session. */
      const account: LocalAccount = {
        id: emailNorm,
        email: emailNorm,
        name: displayName,
        role: 'user',
        password,
        email_verified: true,
      }
      users.push(account)
      writeLocalUsers(users)
      const sessionUser = stripPassword(account) as User
      const tok = createLocalToken(sessionUser)
      setToken(tok)
      setStoredUser(sessionUser)
      notifyAuthChange(sessionUser)
      if (readEntity('Subscription', sessionUser.id).length === 0) {
        maybeGrantFounderSubscription(sessionUser)
      }
      return { kind: 'session', user: sessionUser }
    }

    let response: Response
    try {
      response = await fetch(getStudyplanApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })
    } catch {
      return localRegister()
    }

    const raw = await response.text()
    const looksLikeHtml =
      /^\s*<[\s!]/i.test(raw) || raw.includes('<!DOCTYPE') || raw.toLowerCase().includes('<html')
    let data = {} as {
      error?: string
      verificationRequired?: boolean
      token?: string
      user?: User
      __devVerifyToken?: string
    }
    try {
      if (raw.trim()) {
        data = JSON.parse(raw) as typeof data
      }
    } catch {
      data = {}
    }

    /** Hébergeur statique (ex. Cloudflare) : /api renvoie souvent la page HTML au lieu de l’API. */
    if (looksLikeHtml) {
      return localRegister()
    }
    if (!response.ok) {
      if (response.status === 404) {
        return localRegister()
      }
      const msg = data.error
      if (msg) {
        if (msg.toLowerCase().includes('exists')) {
          throw new Error('User already exists')
        }
        if (msg.toLowerCase().includes('at least 8')) {
          throw new Error('Password must be at least 8 characters.')
        }
        throw new Error(msg)
      }
      if (response.status === 405) {
        return localRegister()
      }
      if (!data.error && response.status >= 500) {
        return localRegister()
      }
      throw new Error(`INSCRIPTION_SERVEUR_${response.status}`)
    }
    if (data.verificationRequired) {
      return { kind: 'verify', email: data.user?.email || '', devToken: data.__devVerifyToken }
    }
    if (data.token && data.user) {
      setToken(data.token)
      setStoredUser(data.user)
      notifyAuthChange(data.user)
      return { kind: 'session', user: data.user }
    }
    return localRegister()
  },
  verifyEmail: async (token: string) => {
    if (isSupabaseConfigured()) {
      const s = await import('./supabaseAuth')
      const ok = await s.supaVerifyFromUrl()
      if (!ok) throw new Error('Lien invalide ou expiré')
      return true
    }
    if (!token) throw new Error('Token manquant')
    const doLocal = () => {
      const users = readLocalUsers()
      const idx = users.findIndex((u) => (u as LocalAccount).verify_token === token)
      if (idx < 0) throw new Error('Lien invalide ou expiré')
      const u = users[idx] as LocalAccount
      if (u.verify_expires) {
        const t = new Date(u.verify_expires)
        if (Date.now() > t.getTime()) throw new Error('Lien expiré')
      }
      users[idx] = { ...u, email_verified: true, verify_token: undefined, verify_expires: undefined }
      writeLocalUsers(users)
      return true
    }
    let response: Response
    try {
      response = await fetch(
        getStudyplanApiUrl('/api/auth/verify-email?token=' + encodeURIComponent(token)),
        { method: 'GET' },
      )
    } catch {
      return doLocal()
    }
    const data = (await response.json().catch(() => ({}))) as { error?: string; ok?: boolean }
    if (response.ok) return true
    if (response.status === 404) return doLocal()
    throw new Error(data.error || 'Vérification impossible')
  },
  forgotPassword: async (email: string) => {
    if (isSupabaseConfigured()) {
      const s = await import('./supabaseAuth')
      return s.supaForgot(email)
    }
    const em = normalizeEmail(email)
    const doLocal = () => {
      const users = readLocalUsers()
      const idx = users.findIndex((u) => normalizeEmail(u.email) === em)
      if (idx < 0) {
        return { devToken: undefined as string | undefined, emailSent: false as const }
      }
      const resetToken = createId() + createId()
      const expires = new Date(Date.now() + 2 * 3600 * 1000).toISOString()
      users[idx] = {
        ...(users[idx] as LocalAccount),
        password_reset_token: resetToken,
        password_reset_expires: expires,
      } as LocalAccount
      writeLocalUsers(users)
      return { devToken: resetToken, emailSent: false as const }
    }
    let response: Response
    try {
      response = await fetch(getStudyplanApiUrl('/api/auth/forgot-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: em }),
      })
    } catch {
      return doLocal()
    }
    const data = (await response.json().catch(() => ({}))) as {
      __devResetToken?: string
      emailSent?: boolean
    }
    if (response.ok) {
      return {
        devToken: data.__devResetToken,
        emailSent: data.emailSent !== false,
      }
    }
    if (response.status === 404) {
      return doLocal()
    }
    return { devToken: undefined, emailSent: false as const }
  },
  resetPassword: async ({ token, password }: { token: string; password: string }) => {
    if (isSupabaseConfigured()) {
      const s = await import('./supabaseAuth')
      return s.supaResetPassword(password)
    }
    const doLocal = () => {
      const users = readLocalUsers()
      const idx = users.findIndex((u) => (u as LocalAccount).password_reset_token === token)
      if (idx < 0) throw new Error('Lien invalide ou expiré')
      const u = users[idx] as LocalAccount
      if (u.password_reset_expires) {
        const t = new Date(u.password_reset_expires)
        if (Date.now() > t.getTime()) throw new Error('Lien expiré')
      }
      const acct: LocalAccount = { ...u, password, password_reset_token: undefined, password_reset_expires: undefined }
      users[idx] = acct
      writeLocalUsers(users)
      return true
    }
    let response: Response
    try {
      response = await fetch(getStudyplanApiUrl('/api/auth/reset-password'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
    } catch {
      return doLocal()
    }
    const data = (await response.json().catch(() => ({}))) as { error?: string }
    if (response.ok) {
      return true
    }
    if (response.status === 404) {
      return doLocal()
    }
    throw new Error(data.error || 'Réinitialisation impossible')
  },
  login: async ({ email, password }: { email: string; password: string }) => {
    if (isSupabaseConfigured()) {
      const s = await import('./supabaseAuth')
      return s.supaLogin({ email, password })
    }
    const doLocal = () => {
      const emailNorm = normalizeEmail(email)
      const users = readLocalUsers()
      const account = users.find((u) => normalizeEmail(u.email) === emailNorm) as LocalAccount | undefined
      if (!account || account.password !== password) {
        throw new Error('Login failed')
      }
      if (account.email_verified === false) {
        throw new Error('EMAIL_NOT_VERIFIED')
      }
      const sessionUser = stripPassword(account)!
      const tok = createLocalToken(sessionUser)
      setToken(tok)
      setStoredUser(sessionUser)
      notifyAuthChange(sessionUser)
      if (readEntity('Subscription', sessionUser.id).length === 0) {
        maybeGrantFounderSubscription(sessionUser)
      }
      return sessionUser
    }
    let response: Response
    try {
      response = await fetch(getStudyplanApiUrl('/api/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
    } catch {
      return doLocal()
    }
    const data = (await response.json().catch(() => ({}))) as { error?: string; token?: string; user?: User }
    if (response.status === 404) {
      return doLocal()
    }
    if (!response.ok) {
      if (data.error === 'EMAIL_NOT_VERIFIED') {
        throw new Error('EMAIL_NOT_VERIFIED')
      }
      if (data.error === 'USE_GOOGLE_SIGNIN') {
        throw new Error('USE_GOOGLE_SIGNIN')
      }
      throw new Error('Login failed')
    }
    if (data.token && data.user) {
      setToken(data.token)
      setStoredUser(data.user)
      notifyAuthChange(data.user)
      if (readEntity('Subscription', data.user.id).length === 0) {
        maybeGrantFounderSubscription(data.user)
      }
      return data.user
    }
    return doLocal()
  },
  logout: async () => {
    if (isSupabaseConfigured()) {
      const s = await import('./supabaseAuth')
      await s.supaLogout()
    } else {
      setToken(null)
      setStoredUser(null)
      notifyAuthChange(null)
    }
    return true
  },
  /** Connexion / inscription unifiée via le jeton Google (ID token). Nécessite l’API + GOOGLE_CLIENT_ID. */
  loginWithGoogle: async (credential: string) => {
    if (isSupabaseConfigured()) {
      const s = await import('./supabaseAuth')
      return s.supaLoginWithGoogle(credential)
    }
    if (!credential) {
      throw new Error('No google credential')
    }
    let response: Response
    try {
      response = await fetch(getStudyplanApiUrl('/api/auth/google'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential }),
      })
    } catch {
      throw new Error('GOOGLE_UNREACHABLE')
    }
    const data = (await response.json().catch(() => ({}))) as { error?: string; token?: string; user?: User }
    if (response.status === 404) {
      throw new Error('GOOGLE_OFFLINE')
    }
    if (!response.ok) {
      if (data.error === 'GOOGLE_NOT_CONFIGURED' || data.error === 'Invalid Google token') {
        throw new Error(data.error)
      }
      if (data.error) {
        throw new Error(String(data.error))
      }
      throw new Error('GOOGLE_FAILED')
    }
    if (data.token && data.user) {
      setToken(data.token)
      setStoredUser(data.user)
      notifyAuthChange(data.user)
      if (readEntity('Subscription', data.user.id).length === 0) {
        maybeGrantFounderSubscription(data.user)
      }
      return data.user
    }
    throw new Error('GOOGLE_FAILED')
  },
}

/** Active Premium (ex. retour PayPal) — stocke un abonnement côté client. */
const activatePaypalPremium = async (opts?: { orderId?: string; subscriptionId?: string }) => {
  const user = getStoredUser()
  if (!user) throw new Error('User not logged in')
  if (isSupabaseConfigured()) {
    await activatePaypalInSupabase(user, opts)
    return
  }
  const planId = 'sub_premium_paypal'
  const list = readEntity('Subscription', user.id).filter(
    (r) => r.id !== planId,
  ) as (EntityRecord & { plan?: string; is_active?: boolean })[]
  const end = new Date()
  end.setMonth(end.getMonth() + 1)
  const rec: EntityRecord & Record<string, unknown> = {
    id: planId,
    plan: 'premium',
    is_active: true,
    payment_provider: 'paypal',
    paypal_order_id: opts?.orderId,
    paypal_subscription_id: opts?.subscriptionId,
    subscription_start_date: new Date().toISOString().slice(0, 10),
    subscription_end_date: end.toISOString().slice(0, 10),
    created_by: user.email,
    created_date: new Date().toISOString(),
  }
  writeEntity('Subscription', user.id, [rec, ...list])
  return rec
}

/** Passe l’abonnement payant (non-fondateur) en inactif — côté client. */
const cancelActiveSubscription = async () => {
  const user = getStoredUser()
  if (!user) throw new Error('User not logged in')
  if (isSupabaseConfigured()) {
    await cancelSubInSupabase(user)
    return
  }
  const recs = readEntity('Subscription', user.id) as (EntityRecord & { is_founder?: boolean; plan?: string })[]
  const next = recs.map((r) => {
    if (r.is_founder) return r
    if (r.plan === 'premium' && (r as { payment_provider?: string }).payment_provider) {
      return { ...r, is_active: false, plan: 'free', subscription_cancelled_at: new Date().toISOString() } as EntityRecord
    }
    if (r.plan === 'premium') {
      return { ...r, is_active: false, plan: 'free', subscription_cancelled_at: new Date().toISOString() } as EntityRecord
    }
    return r
  })
  writeEntity('Subscription', user.id, next)
}

type SchoolTaskPayload = {
  title: string
  subject?: string
  description?: string
  difficulty?: string
  estimated_minutes?: number
  due_date?: string
}

export type SchoolSyncResult = {
  tasks?: SchoolTaskPayload[]
  mock?: boolean
  error?: string
}

const withAuthHeaders = async () => {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (isSupabaseConfigured()) {
    const { getAuthAccessToken } = await import('@/lib/supabaseUserSync')
    const token = await getAuthAccessToken()
    if (token) headers.Authorization = `Bearer ${token}`
    return headers
  }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  return headers
}

const fetchWithTimeout = async (input: RequestInfo | URL, init: RequestInit = {}, timeoutMs = 20000) => {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  try {
    return await fetch(input, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
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
  SchoolSync: {
    syncPronote: async (args: {
      url: string
      username: string
      password: string
      cas?: string
    }): Promise<SchoolSyncResult> => {
      let response: Response
      try {
        response = await fetchWithTimeout(
          getStudyplanApiUrl('/api/integrations/pronote'),
          {
            method: 'POST',
            headers: await withAuthHeaders(),
            body: JSON.stringify({
              url: args.url,
              username: args.username,
              password: args.password,
              cas: args.cas,
            }),
          },
          70000,
        )
      } catch (error) {
        if ((error as Error)?.name === 'AbortError') {
          throw new Error('Connexion Pronote trop longue. Vérifie URL/CAS puis réessaie.')
        }
        if ((error as Error)?.message?.includes('Failed to fetch')) {
          throw new Error('Backend indisponible (réseau). Réessaie dans quelques secondes.')
        }
        throw error
      }
      const data = (await response.json().catch(() => ({}))) as SchoolSyncResult & { error?: string; details?: string }
      if (!response.ok) {
        if (response.status === 404 || response.status === 405) {
          throw new Error(
            'Sync Pronote indisponible sur cet hébergement (backend non branché). Configure VITE_API_BASE_URL vers ton API.',
          )
        }
        if (response.status === 429) {
          throw new Error(
            data.error ||
              data.details ||
              'Pronote bloque temporairement la connexion. Attends quelques minutes puis réessaie.',
          )
        }
        throw new Error(
          data.details || data.error || `Sync Pronote impossible (${response.status})`,
        )
      }
      return data
    },
    syncEcoleDirecte: async (args: {
      username: string
      password: string
      horizonDays?: number
    }): Promise<SchoolSyncResult> => {
      let response: Response
      try {
        response = await fetchWithTimeout(
          getStudyplanApiUrl('/api/integrations/ecoledirecte'),
          {
            method: 'POST',
            headers: await withAuthHeaders(),
            body: JSON.stringify({
              username: args.username,
              password: args.password,
              horizonDays: args.horizonDays ?? 14,
            }),
          },
          70000,
        )
      } catch (error) {
        if ((error as Error)?.name === 'AbortError') {
          throw new Error('Connexion École Directe trop longue. Vérifie tes infos puis réessaie.')
        }
        if ((error as Error)?.message?.includes('Failed to fetch')) {
          throw new Error('Backend indisponible (réseau). Réessaie dans quelques secondes.')
        }
        throw error
      }
      const data = (await response.json().catch(() => ({}))) as SchoolSyncResult & { error?: string; details?: string }
      if (!response.ok) {
        if (response.status === 404 || response.status === 405) {
          throw new Error(
            'Sync École Directe indisponible sur cet hébergement (backend non branché). Configure VITE_API_BASE_URL vers ton API.',
          )
        }
        if (response.status === 429) {
          throw new Error(
            data.error ||
              data.details ||
              'École Directe bloque temporairement la connexion. Attends quelques minutes puis réessaie.',
          )
        }
        throw new Error(
          data.details || data.error || `Sync École Directe impossible (${response.status})`,
        )
      }
      return data
    },
  },
}

export const initAuthSession = async () => {
  if (!isSupabaseConfigured()) return
  const s = await import('./supabaseAuth')
  await s.refreshSupabaseSession()
}

export const studyplanApi = {
  auth,
  billing: {
    activatePaypalPremium,
    cancelActiveSubscription,
    getCurrentSubscription: (email: string) => getSubscriptionForCurrentUser(email),
    getFounderSlotsInfo,
  },
  entities: {
    Task: createEntity('Task'),
    StudySession: createEntity('StudySession'),
    UserPreferences: createEntity('UserPreferences'),
    Reward: createEntity('Reward'),
    Subscription: createEntity('Subscription'),
  },
  integrations,
}
