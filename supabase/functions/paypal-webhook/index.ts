// Webhook PayPal (Subscriptions v1) : active / désactive Premium côté Supabase (service role)
//
// Secrets Supabase (Function) :
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  (fournis par l’hôte)
//   PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET
//   PAYPAL_WEBHOOK_ID          (id du webhook dans l’espace dev PayPal)
//   PAYPAL_API_BASE            optionnel, défaut https://api-m.paypal.com
//   PAYPAL_ALLOWED_PLAN_IDS    ex: P-1YC555706H685240MNHUNJFQ (séparateur virgule / espace)
//
// Enregistre l’URL : https://<projet>.supabase.co/functions/v1/paypal-webhook
// (verify_jwt = false dans config.toml)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1"

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 })
  }

  const bodyText = await req.text()
  type Ev = { id?: string; event_type?: string; resource?: { id?: string; [k: string]: unknown } }
  let event: Ev
  try {
    event = JSON.parse(bodyText) as Ev
  } catch {
    return new Response("invalid json", { status: 400 })
  }

  const base = (Deno.env.get("PAYPAL_API_BASE") || "https://api-m.paypal.com").replace(
    /\/$/,
    "",
  )
  const clientId = Deno.env.get("PAYPAL_CLIENT_ID")
  const clientSecret = Deno.env.get("PAYPAL_CLIENT_SECRET")
  const webhookId = Deno.env.get("PAYPAL_WEBHOOK_ID")
  const supaUrl = Deno.env.get("SUPABASE_URL")
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

  if (!clientId || !clientSecret || !webhookId || !supaUrl || !serviceKey) {
    console.error("paypal-webhook: missing required env (PayPal or Supabase)")
    return new Response("ok", { status: 200 })
  }

  const token = await getPaypalAccessToken(base, clientId, clientSecret)
  if (!token) {
    return new Response("ok", { status: 200 })
  }

  const ver = await verifyPaypalWebhook(
    base,
    token,
    webhookId,
    event,
    req,
  )
  if (!ver) {
    return new Response("unverified", { status: 400 })
  }

  const supabase = createClient(supaUrl, serviceKey)

  if (event.id) {
    const { error: insE } = await supabase
      .from("paypal_webhook_events")
      .insert({ id: event.id, event_type: event.event_type || "unknown" })
    if (insE) {
      if (insE.code === "23505" || /duplicate|unique/i.test(String(insE.message || ""))) {
        return new Response("ok", { status: 200 })
      }
      console.error("paypal_webhook_events", insE)
      return new Response("db", { status: 500 })
    }
  }

  const t = event.event_type || ""
  const resId = event.resource?.id
  if (!resId) {
    return new Response("ok", { status: 200 })
  }

  if (
    t === "BILLING.SUBSCRIPTION.ACTIVATED" ||
    t === "BILLING.SUBSCRIPTION.UPDATED" ||
    t === "BILLING.SUBSCRIPTION.CREATED"
  ) {
    if (t === "BILLING.SUBSCRIPTION.UPDATED" || t === "BILLING.SUBSCRIPTION.CREATED") {
      const st = (event.resource as { status?: string })?.status
      if (st && st !== "ACTIVE") {
        return new Response("ok", { status: 200 })
      }
    }
    await applySubscriptionActive(supabase, base, token, resId)
  } else if (
    t === "BILLING.SUBSCRIPTION.CANCELLED" ||
    t === "BILLING.SUBSCRIPTION.SUSPENDED" ||
    t === "BILLING.SUBSCRIPTION.EXPIRED"
  ) {
    await applySubscriptionCancelled(supabase, resId)
  }

  return new Response("ok", { status: 200 })
})

function getHeader(req: Request, n: string) {
  return req.headers.get(n) || req.headers.get(n.toLowerCase()) || ""
}

async function verifyPaypalWebhook(
  base: string,
  accessToken: string,
  webhookId: string,
  webhookEvent: object,
  req: Request,
): Promise<boolean> {
  const r = await fetch(`${base}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_algo: getHeader(req, "PAYPAL-AUTH-ALGO"),
      cert_url: getHeader(req, "PAYPAL-CERT-URL"),
      transmission_id: getHeader(req, "PAYPAL-TRANSMISSION-ID"),
      transmission_time: getHeader(req, "PAYPAL-TRANSMISSION-TIME"),
      transmission_sig: getHeader(req, "PAYPAL-TRANSMISSION-SIG"),
      webhook_id: webhookId,
      webhook_event: webhookEvent,
    }),
  })
  const d = (await r.json().catch(() => ({}))) as { verification_status?: string }
  return d.verification_status === "SUCCESS"
}

async function getPaypalAccessToken(
  base: string,
  clientId: string,
  clientSecret: string,
): Promise<string | null> {
  const b = btoa(`${clientId}:${clientSecret}`)
  const r = await fetch(`${base}/v1/oauth2/token`, {
    method: "POST",
    headers: { Authorization: `Basic ${b}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: "grant_type=client_credentials",
  })
  if (!r.ok) {
    console.error("paypal token", await r.text())
    return null
  }
  const j = (await r.json()) as { access_token?: string }
  return j.access_token || null
}

type SubApi = {
  id?: string
  plan_id?: string
  status?: string
  subscriber?: { email_address?: string; name?: { given_name?: string; surname?: string } }
}

async function applySubscriptionActive(
  supabase: ReturnType<typeof createClient>,
  base: string,
  accessToken: string,
  subscriptionId: string,
) {
  const r = await fetch(`${base}/v1/billing/subscriptions/${subscriptionId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!r.ok) {
    console.error("paypal fetch sub", await r.text())
    return
  }
  const j = (await r.json()) as SubApi
  if (j.status && j.status !== "ACTIVE") return

  const planAllow = (Deno.env.get("PAYPAL_ALLOWED_PLAN_IDS") || Deno.env.get("PAYPAL_PLAN_ID") || "P-1YC555706H685240MNHUNJFQ")
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
  if (planAllow.length && j.plan_id && !planAllow.includes(j.plan_id)) {
    console.warn("paypal: plan_id not allowed", j.plan_id)
    return
  }

  const email = j.subscriber?.email_address
  if (!email) {
    console.error("paypal: no subscriber email for sub", subscriptionId)
    return
  }

  const { data: uid, error: pe } = await supabase.rpc("auth_user_id_by_email", {
    lookup_email: email,
  })
  if (pe || !uid) {
    console.error("paypal: no user for email", email, pe)
    return
  }

  const { data: prof, error: readE } = await supabase
    .from("profiles")
    .select("is_founder, id")
    .eq("id", uid)
    .maybeSingle()
  if (readE || !prof) {
    console.error("paypal: profile", readE)
    return
  }
  if ((prof as { is_founder?: boolean }).is_founder) return

  const end = new Date()
  end.setMonth(end.getMonth() + 1)

  const { error: up } = await supabase
    .from("profiles")
    .update({
      is_premium: true,
      is_subscription_active: true,
      payment_provider: "paypal",
      paypal_subscription_id: subscriptionId,
      subscription_start_date: new Date().toISOString().slice(0, 10),
      subscription_end_date: end.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", uid)
  if (up) {
    console.error("paypal: profile update", up)
  }
}

async function applySubscriptionCancelled(
  supabase: ReturnType<typeof createClient>,
  subscriptionId: string,
) {
  const { data: rows, error: qe } = await supabase
    .from("profiles")
    .select("id, is_founder, paypal_subscription_id")
    .eq("paypal_subscription_id", subscriptionId)
  if (qe) {
    console.error("paypal cancel query", qe)
    return
  }
  const row = (rows || [])[0] as { id?: string; is_founder?: boolean } | undefined
  if (!row?.id || row.is_founder) return
  const { error: up } = await supabase
    .from("profiles")
    .update({
      is_premium: false,
      is_subscription_active: false,
      payment_provider: null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", row.id)
  if (up) {
    console.error("paypal: cancel update", up)
  }
}
