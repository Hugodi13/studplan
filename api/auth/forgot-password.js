const crypto = require('crypto')
const { json, methodNotAllowed } = require('../_lib/response')
const { readUsers, writeUsers } = require('../_lib/usersStore')
const { withCors } = require('../_lib/withCors')
const { canSendEmail, sendPasswordReset } = require('../_lib/mail')
const { getPublicAppUrl } = require('../_lib/appUrl')

const EXPIRE_H = 2

module.exports = withCors(async (req, res) => {
  if (req.method !== 'POST') return methodNotAllowed(res)

  const body = await new Promise((resolve) => {
    let data = ''
    req.on('data', (chunk) => (data += chunk))
    req.on('end', () => resolve(data ? JSON.parse(data) : {}))
  })

  const { email } = body
  if (!email) {
    return json(res, 200, { ok: true, message: 'Si un compte existe, un email a été envoyé.' })
  }

  const users = readUsers()
  const norm = String(email).trim().toLowerCase()
  const idx = users.findIndex((u) => (u.email || '').toLowerCase() === norm)
  if (idx < 0) {
    return json(res, 200, { ok: true, message: 'Si un compte existe, un email a été envoyé.' })
  }

  const resetToken = crypto.randomBytes(32).toString('hex')
  const expires = new Date(Date.now() + EXPIRE_H * 3600 * 1000).toISOString()
  users[idx] = {
    ...users[idx],
    password_reset_token: resetToken,
    password_reset_expires: expires,
  }
  writeUsers(users)

  if (canSendEmail() && getPublicAppUrl()) {
    const sent = await sendPasswordReset(norm, resetToken)
    if (sent.ok) {
      return json(res, 200, {
        ok: true,
        message: 'Si un compte existe, un e-mail a été envoyé.',
        emailSent: true,
      })
    }
  }

  return json(res, 200, {
    ok: true,
    message:
      canSendEmail() && getPublicAppUrl()
        ? 'L’e-mail n’a pas pu être envoyé. Réessaie plus tard ou contacte le support.'
        : 'Aucun e-mail réel n’est configuré (Resend + PUBLIC_APP_URL). Le jeton n’est montré qu’en mode dev.',
    emailSent: false,
    __devResetToken: process.env.AUTH_EXPOSE_TOKENS === '1' ? resetToken : undefined,
  })
})
