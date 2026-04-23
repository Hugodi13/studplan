import { getSupabase, isSupabaseConfigured } from '@/lib/supabaseClient'
import { readUserCache, type AppUser } from '@/lib/supabaseUserSync'

/** Même clés que `studyplanClient` (entités locales en fallback) */
const storagePrefix = 'studyplan'
const getEntityKey = (entity: string, userId: string) =>
  `${storagePrefix}:entity:${userId}:${entity}`

type Row = {
  is_premium?: boolean
  is_founder?: boolean
  founder_rank?: number | null
  payment_provider?: string | null
  paypal_order_id?: string | null
  is_subscription_active?: boolean | null
  subscription_end_date?: string | null
  subscription_start_date?: string | null
}

const readEntityLocal = (entity: string, userId: string) => {
  const raw = localStorage.getItem(getEntityKey(entity, userId))
  if (!raw) return [] as { id: string; [k: string]: unknown }[]
  try {
    return JSON.parse(raw) as { id: string; [k: string]: unknown }[]
  } catch {
    return []
  }
}

const writeEntityLocal = (entity: string, userId: string, data: { id: string; [k: string]: unknown }[]) => {
  localStorage.setItem(getEntityKey(entity, userId), JSON.stringify(data))
}

const mapRowToSubscriptionShape = (r: Row) => {
  if (!r) return null
  const isFounder = Boolean(r.is_founder || (typeof r.founder_rank === 'number' && r.founder_rank > 0))
  return {
    id: 'db_profile',
    plan: (r.is_premium || isFounder) ? 'premium' : 'free',
    is_active: Boolean(
      (r.is_subscription_active && (r.is_premium || isFounder)) || isFounder,
    ),
    is_founder: isFounder,
    payment_provider: r.payment_provider,
    is_founder_rank: r.founder_rank,
    __fromSupabase: true,
  } as { plan?: string; is_active?: boolean; is_founder?: boolean; payment_provider?: string; is_founder_rank?: number; [k: string]: unknown }
}

/** Pour Home / le quota premium : profil Supabase, sinon 1ʳᵉ entrée `Subscription` locale. */
export const getSubscriptionForCurrentUser = async (email: string) => {
  const u = readUserCache()
  if (isSupabaseConfigured() && u) {
    const s = getSupabase()
    const { data, error } = await s
      .from('profiles')
      .select('is_premium, is_founder, founder_rank, payment_provider, paypal_order_id, is_subscription_active, subscription_start_date, subscription_end_date')
      .eq('id', u.id)
      .maybeSingle()
    if (error) {
      console.warn('Supabase profile:', error.message)
    } else if (data) {
      const m = mapRowToSubscriptionShape(data as Row)
      if (m) {
        return { ...m, created_by: email }
      }
    }
    // Fallback utile en prod: si le profil existe mais fondateur non attribué, on tente une claim puis on relit.
    await tryClaimFounder()
    const retry = await s
      .from('profiles')
      .select('is_premium, is_founder, founder_rank, payment_provider, paypal_order_id, is_subscription_active, subscription_start_date, subscription_end_date')
      .eq('id', u.id)
      .maybeSingle()
    if (!retry.error && retry.data) {
      const m2 = mapRowToSubscriptionShape(retry.data as Row)
      if (m2) return { ...m2, created_by: email }
    }
  }
  const id = u?.id
  if (!id) return null
  const list = readEntityLocal('Subscription', id) as { plan?: string; is_active?: boolean; created_by?: string; [k: string]: unknown }[]
  const forEmail = list.find((r) => r.created_by === email) || list[0]
  return (forEmail as { plan?: string; is_active?: boolean; [k: string]: unknown }) || null
}

type LocalUser = AppUser

export const activatePaypalInSupabase = async (user: LocalUser, opts?: { orderId?: string; subscriptionId?: string }) => {
  if (isSupabaseConfigured() && import.meta.env.DEV && opts?.orderId === 'dev_test') {
    const s = getSupabase()
    const { data: { session } } = await s.auth.getSession()
    if (!session) throw new Error('Session requise')
    const base = (import.meta.env.VITE_SUPABASE_URL as string).replace(/\/$/, '')
    const r = await fetch(`${base}/functions/v1/paypal-dev-grant`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    if (!r.ok) {
      const errBody = await r.text().catch(() => '')
      throw new Error(errBody || 'dev_premium')
    }
    return
  }
  if (isSupabaseConfigured()) {
    // Prod (et le reste) : le Premium PayPal n’est appliqué que par l’Edge Function (webhook PayPal).
    return
  }
  const planId = 'sub_premium_paypal'
  const list = readEntityLocal('Subscription', user.id).filter((r) => (r as { id?: string }).id !== planId)
  const end = new Date()
  end.setMonth(end.getMonth() + 1)
  const rec = {
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
  writeEntityLocal('Subscription', user.id, [rec, ...list])
  return rec
}

export const cancelSubInSupabase = async (user: LocalUser) => {
  if (isSupabaseConfigured()) {
    const s = getSupabase()
    const { data: prof } = await s.from('profiles').select('is_founder').eq('id', user.id).maybeSingle()
    if ((prof as { is_founder?: boolean } | null)?.is_founder) {
      return
    }
    const { error } = await s
      .from('profiles')
      .update({
        is_subscription_active: false,
        is_premium: false,
        updated_at: new Date().toISOString(),
        payment_provider: null,
      })
      .eq('id', user.id)
    if (!error) return
  }
  const recs = readEntityLocal('Subscription', user.id) as { is_founder?: boolean; plan?: string; [k: string]: unknown }[]
  const next = recs.map((r) => {
    if (r.is_founder) return r
    if (r.plan === 'premium' && (r as { payment_provider?: string }).payment_provider) {
      return { ...r, is_active: false, plan: 'free', subscription_cancelled_at: new Date().toISOString() }
    }
    if (r.plan === 'premium') {
      return { ...r, is_active: false, plan: 'free', subscription_cancelled_at: new Date().toISOString() }
    }
    return r
  })
  writeEntityLocal('Subscription', user.id, next)
}

export const tryClaimFounder = async () => {
  if (!isSupabaseConfigured()) return null
  const s = getSupabase()
  const { data, error } = await s.rpc('claim_founder')
  if (error) {
    console.debug('claim_founder:', error.message)
    return null
  }
  return data
}

export const getFounderSlotsInfo = async () => {
  if (isSupabaseConfigured()) {
    const s = getSupabase()
    const { data, error } = await s.rpc('get_founder_slots')
    if (!error && data) return data as { used_count: number; max_slots: number; remaining: number }
  }
  const raw = localStorage.getItem('studyplan:founderGlobalIndex')
  const used = Number.parseInt(raw || '0', 10) || 0
  const max = 100
  return { used_count: used, max_slots: max, remaining: Math.max(0, max - used) }
}
