const crypto = require('crypto')
const { OAuth2Client } = require('google-auth-library')
const { json, methodNotAllowed } = require('../_lib/response')
const { hashPassword } = require('../_lib/crypto')
const { readUsers, writeUsers } = require('../_lib/usersStore')
const { sign } = require('../_lib/jwt')
const { withCors } = require('../_lib/withCors')

const oAuth2Client = new OAuth2Client()

const parseBody = (req) =>
  new Promise((resolve) => {
    let data = ''
    req.on('data', (chunk) => (data += chunk))
    req.on('end', () => resolve(data ? JSON.parse(data) : {}))
  })

const issueForUser = (res, user) => {
  const isAdmin =
    process.env.ADMIN_EMAIL &&
    String(user.email || '').toLowerCase() === String(process.env.ADMIN_EMAIL).toLowerCase()
  const role = isAdmin ? 'admin' : user.role
  const token = sign(
    { sub: user.id, email: user.email, role },
    process.env.AUTH_SECRET || 'dev-secret',
  )
  return json(res, 200, {
    token,
    user: { id: user.id, email: user.email, name: user.name, role },
  })
}

/**
 * Post { credential } = ID token (JWT) renvoyé par Google Identity (Sign in with Google).
 * Crée le compte si besoin, ou connecte le compte Google.
 */
module.exports = withCors(async (req, res) => {
  if (req.method !== 'POST') return methodNotAllowed(res)

  const body = await parseBody(req)
  const { credential: idToken } = body
  if (!idToken || typeof idToken !== 'string') {
    return json(res, 400, { error: 'Invalid google credential' })
  }

  const clientId = process.env.GOOGLE_CLIENT_ID
  if (!clientId) {
    return json(res, 500, { error: 'GOOGLE_NOT_CONFIGURED' })
  }

  let ticket
  try {
    ticket = await oAuth2Client.verifyIdToken({
      idToken,
      audience: clientId,
    })
  } catch {
    return json(res, 401, { error: 'Invalid Google token' })
  }

  const payload = ticket.getPayload()
  if (!payload?.email) {
    return json(res, 400, { error: 'No email from Google' })
  }
  if (payload.email_verified !== true) {
    return json(res, 403, { error: 'EMAIL_NOT_VERIFIED' })
  }

  const emailNorm = String(payload.email).trim().toLowerCase()
  const name = payload.name || (emailNorm.split('@')[0] || null) || 'Élève'
  const sub = String(payload.sub || '')

  const users = readUsers()
  const idx = users.findIndex((u) => (u.email || '').toLowerCase() === emailNorm)

  if (idx >= 0) {
    const u = users[idx]
    if (!u.auth_provider || u.auth_provider === 'password') {
      return json(res, 409, { error: 'ACCOUNT_USES_PASSWORD' })
    }
    if (u.auth_provider === 'google') {
      const updated = {
        ...u,
        name: u.name || name,
        email_verified: true,
        google_sub: u.google_sub || sub,
      }
      users[idx] = updated
      writeUsers(users)
      return issueForUser(res, updated)
    }
    return json(res, 409, { error: 'ACCOUNT_CONFLICT' })
  }

  const randomPwd = crypto.randomBytes(32).toString('hex')
  const { salt, hash } = hashPassword(randomPwd)
  const isAdmin = process.env.ADMIN_EMAIL && emailNorm === String(process.env.ADMIN_EMAIL).toLowerCase()
  const newUser = {
    id: emailNorm,
    email: emailNorm,
    name,
    role: isAdmin ? 'admin' : 'user',
    password_hash: hash,
    password_salt: salt,
    created_at: new Date().toISOString(),
    email_verified: true,
    auth_provider: 'google',
    google_sub: sub,
    verify_token: null,
    verify_expires: null,
  }
  users.push(newUser)
  writeUsers(users)
  return issueForUser(res, newUser)
})
