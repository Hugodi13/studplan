import { getSupabase, type SupaUser, type AuthSession, isSupabaseConfigured } from './supabaseClient'

const userKey = 'studyplan:user'
const tokenKey = 'studyplan:token'

const notifyAuth = (detail: AppUser | null) => {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent('studyplan:auth', { detail }))
}

export type AppUser = {
  id: string
  email: string
  name?: string
  role?: string
}

export const mapSupaUser = (u: SupaUser): AppUser => ({
  id: u.id,
  email: u.email || '',
  name: (u.user_metadata?.name as string) || (u.user_metadata?.full_name as string) || undefined,
  role: (u.app_metadata?.role as string) || (u.user_metadata?.role as string) || 'user',
})

/**
 * Gèle le user dans localStorage (même clé que l’ex-mode JWT) pour que getStoredUser / entités tournent.
 */
export const writeUserCache = (user: AppUser | null) => {
  if (typeof localStorage === 'undefined') return
  if (!user) {
    localStorage.removeItem(userKey)
    localStorage.removeItem(tokenKey)
    return
  }
  localStorage.setItem(userKey, JSON.stringify(user))
}

export const readUserCache = (): AppUser | null => {
  if (typeof localStorage === 'undefined') return null
  const r = localStorage.getItem(userKey)
  if (!r) return null
  try {
    return JSON.parse(r) as AppUser
  } catch {
    return null
  }
}

export const applySupabaseSession = (session: AuthSession | null) => {
  if (!session?.user) {
    writeUserCache(null)
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(tokenKey)
    }
    notifyAuth(null)
    return
  }
  writeUserCache(mapSupaUser(session.user))
  if (session.access_token && typeof localStorage !== 'undefined') {
    localStorage.setItem(tokenKey, session.access_token)
  }
  notifyAuth(mapSupaUser(session.user))
}

export const syncUserFromSession = (session: AuthSession | null) => {
  applySupabaseSession(session)
}

export const initSupabaseSessionListener = () => {
  if (!isSupabaseConfigured()) return () => {}
  const s = getSupabase()
  s.auth.getSession().then(({ data: { session } }) => {
    syncUserFromSession(session)
  })
  const { data: sub } = s.auth.onAuthStateChange((_, s2) => {
    applySupabaseSession(s2)
  })
  return () => {
    sub.unsubscribe()
  }
}

export const getAuthAccessToken = async () => {
  if (!isSupabaseConfigured()) return null
  const s = getSupabase()
  const { data: { session } } = await s.auth.getSession()
  return session?.access_token ?? null
}
