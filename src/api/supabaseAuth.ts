import { getSupabase, isSupabaseConfigured } from '@/lib/supabaseClient'
import { mapSupaUser, applySupabaseSession, readUserCache, writeUserCache } from '@/lib/supabaseUserSync'
import { tryClaimFounder } from '@/api/supabaseProfileBilling'
import type { RegisterResult, User } from './studyplanClientTypes'

export { isSupabaseConfigured }

const appOrigin = () => (typeof window !== 'undefined' ? window.location.origin : '')

export const refreshSupabaseSession = async (): Promise<User | null> => {
  if (!isSupabaseConfigured()) return null
  const s = getSupabase()
  const { data: { session } } = await s.auth.getSession()
  applySupabaseSession(session)
  if (session?.user) {
    await tryClaimFounder()
  }
  return (readUserCache() as User) ?? null
}

export const supaGetCurrentUser = (): User | null => (readUserCache() as User) ?? null

export const supaMe = async (): Promise<User | null> => {
  if (!isSupabaseConfigured()) return null
  const s = getSupabase()
  const { data: { user }, error } = await s.auth.getUser()
  if (error || !user) {
    await refreshSupabaseSession()
    return readUserCache() as User | null
  }
  const u = mapSupaUser(user)
  const { data: { session } } = await s.auth.getSession()
  if (session) {
    applySupabaseSession(session)
  } else {
    writeUserCache(u)
  }
  await tryClaimFounder()
  return (readUserCache() as User) ?? u
}

export const supaRegister = async (args: {
  email: string
  password: string
  name?: string
}): Promise<RegisterResult> => {
  if (args.password.length < 8) {
    throw new Error('Password must be at least 8 characters.')
  }
  const s = getSupabase()
  const email = args.email.trim().toLowerCase()
  const name = (args.name || email.split('@')[0] || 'Élève').trim()
  const { data, error } = await s.auth.signUp({
    email,
    password: args.password,
    options: { data: { name, full_name: name } },
  })
  if (error) {
    const msg = error.message || ''
    if (msg.toLowerCase().includes('registered') || msg.toLowerCase().includes('exists')) {
      throw new Error('User already exists')
    }
    if (msg.toLowerCase().includes('8')) {
      throw new Error('Password must be at least 8 characters.')
    }
    throw new Error(msg)
  }
  if (data.session) {
    applySupabaseSession(data.session)
    await tryClaimFounder()
    return { kind: 'session' as const, user: (readUserCache() as User)! }
  }
  return { kind: 'verify' as const, email, devToken: undefined }
}

export const supaLogin = async (args: { email: string; password: string }): Promise<User> => {
  const s = getSupabase()
  const { data, error } = await s.auth.signInWithPassword({
    email: args.email.trim().toLowerCase(),
    password: args.password,
  })
  if (error) {
    if (error.message.toLowerCase().includes('confirm')) {
      throw new Error('EMAIL_NOT_VERIFIED')
    }
    throw new Error('Login failed')
  }
  if (!data.session) throw new Error('Login failed')
  applySupabaseSession(data.session)
  await tryClaimFounder()
  return (readUserCache() as User) ?? mapSupaUser(data.session.user)
}

export const supaLogout = async () => {
  if (!isSupabaseConfigured()) return
  const s = getSupabase()
  await s.auth.signOut()
  applySupabaseSession(null)
}

export const supaForgot = async (email: string) => {
  const s = getSupabase()
  const redirect = `${appOrigin()}/reset-password`
  const { error } = await s.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
    redirectTo: redirect,
  })
  if (error) throw new Error(error.message)
  return { devToken: undefined, emailSent: true as const }
}

export const supaResetPassword = async (newPassword: string) => {
  const s = getSupabase()
  const { data: { session } } = await s.auth.getSession()
  if (!session) throw new Error('Lien invalide ou expiré')
  const { error } = await s.auth.updateUser({ password: newPassword })
  if (error) throw new Error(error.message || 'Réinitialisation impossible')
  return true
}

export const supaVerifyFromUrl = async (): Promise<boolean> => {
  const s = getSupabase()
  if (typeof window !== 'undefined') {
    const u = new URL(window.location.href)
    const tokenHash = u.searchParams.get('token_hash')
    const type = u.searchParams.get('type')
    const code = u.searchParams.get('code')
    if (tokenHash && type) {
      const { data, error } = await s.auth.verifyOtp({
        token_hash: tokenHash,
        type: type as 'signup' | 'recovery' | 'invite' | 'email_change' | 'email',
      })
      if (!error && data.session) {
        applySupabaseSession(data.session)
        await tryClaimFounder()
        return true
      }
    }
    if (code) {
      const { data, error } = await s.auth.exchangeCodeForSession(code)
      if (!error && data.session) {
        applySupabaseSession(data.session)
        await tryClaimFounder()
        return true
      }
    }
  }
  const { data: { session } } = await s.auth.getSession()
  if (session) {
    applySupabaseSession(session)
    await tryClaimFounder()
    return true
  }
  return false
}

export const supaLoginWithGoogle = async (credential: string) => {
  if (isSupabaseConfigured()) {
    const s = getSupabase()
    const { data, error } = await s.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${appOrigin()}/` },
    })
    if (error) throw new Error(error.message || 'GOOGLE_FAILED')
    if (data.url) {
      window.location.assign(data.url)
    }
    return
  }
  if (!credential) throw new Error('No google credential')
  throw new Error('GOOGLE_OFFLINE')
}
