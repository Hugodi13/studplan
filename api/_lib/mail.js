const { getPublicAppUrl } = require('./appUrl')

/**
 * Envoie un e-mail via l’API Resend (https://resend.com).
 * Variables : RESEND_API_KEY, EMAIL_FROM (ex. "StudyPlan <onboarding@resend.dev>")
 * Sans clé, rien n’est envoyé (l’inscription côté API gère l’absence d’e-mail, voir register).
 */
const sendResend = async ({ to, subject, html, text }) => {
  const key = process.env.RESEND_API_KEY
  const from = process.env.EMAIL_FROM
  if (!key || !from) {
    return { ok: false, reason: 'RESEND or EMAIL_FROM missing' }
  }
  const body = {
    from,
    to: [to],
    subject,
  }
  if (html) body.html = html
  if (text) body.text = text

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) {
    return { ok: false, reason: j.message || r.status }
  }
  return { ok: true, id: j.id }
}

const canSendEmail = () => Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM)

const sendVerifyEmail = async (to, verifyToken) => {
  const base = getPublicAppUrl()
  if (!base) {
    return { ok: false, reason: 'PUBLIC_APP_URL (or VERCEL_URL) not set' }
  }
  const link = `${base}/verify-email?token=${encodeURIComponent(verifyToken)}`
  return sendResend({
    to,
    subject: 'Confirme ton compte StudyPlan',
    html: `<p>Bonjour,</p><p>Clique sur ce lien pour confirmer ton adresse e-mail :</p><p><a href="${link}">Confirmer</a></p><p><small>${link}</small></p>`,
    text: `Confirme ton compte : ${link}`,
  })
}

const sendPasswordReset = async (to, resetToken) => {
  const base = getPublicAppUrl()
  if (!base) {
    return { ok: false, reason: 'PUBLIC_APP_URL (or VERCEL_URL) not set' }
  }
  const link = `${base}/reset-password?token=${encodeURIComponent(resetToken)}`
  return sendResend({
    to,
    subject: 'Réinitialisation de ton mot de passe — StudyPlan',
    html: `<p>Bonjour,</p><p>Clique pour choisir un nouveau mot de passe (valide 2 h) :</p><p><a href="${link}">Réinitialiser</a></p><p><small>${link}</small></p>`,
    text: `Lien de réinitialisation : ${link}`,
  })
}

module.exports = { sendResend, canSendEmail, sendVerifyEmail, sendPasswordReset }
