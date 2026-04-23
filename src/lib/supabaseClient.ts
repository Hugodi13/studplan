import { createClient, type User as SupaUser, type AuthSession } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isSupabaseConfigured = () => Boolean(url && key)

let client: ReturnType<typeof createClient> | null = null

export const getSupabase = () => {
  if (!url || !key) {
    throw new Error('Supabase: définis VITE_SUPABASE_URL et VITE_SUPABASE_ANON_KEY')
  }
  if (!client) {
    client = createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } })
  }
  return client
}

export type { SupaUser, AuthSession }
