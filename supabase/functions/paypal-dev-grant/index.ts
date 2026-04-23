// Émule Premium (dev) — déploye uniquement sur un projet où ALLOW_PAYPAL_DEV_GRANT=true
// Ne pas activer en prod.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1"

const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), {
    status: s,
    headers: { "Content-Type": "application/json" },
  })

Deno.serve(async (req) => {
  if (req.method !== "POST" && req.method !== "GET") {
    return new Response("Method Not Allowed", { status: 405 })
  }
  if (Deno.env.get("ALLOW_PAYPAL_DEV_GRANT") !== "true") {
    return new Response("Not found", { status: 404 })
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!
  const anon = Deno.env.get("SUPABASE_ANON_KEY")!
  const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  const authH = req.headers.get("Authorization")
  if (!authH) return json({ error: "no_auth" }, 401)

  const uclient = createClient(supabaseUrl, anon, {
    global: { headers: { Authorization: authH } },
  })
  const {
    data: { user },
    error: uerr,
  } = await uclient.auth.getUser()
  if (uerr || !user) return json({ error: "invalid_session" }, 401)

  const admin = createClient(supabaseUrl, service)
  const end = new Date()
  end.setMonth(end.getMonth() + 1)
  const { error } = await admin
    .from("profiles")
    .update({
      is_premium: true,
      is_subscription_active: true,
      payment_provider: "paypal",
      paypal_order_id: "dev_test",
      subscription_start_date: new Date().toISOString().slice(0, 10),
      subscription_end_date: end.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)

  if (error) return json({ error: error.message }, 500)
  return json({ ok: true })
})
