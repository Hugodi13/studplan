const crypto = require('crypto')
const { json, methodNotAllowed } = require('../_lib/response')
const { hashPassword } = require('../_lib/crypto')
const { readUsers, writeUsers } = require('../_lib/usersStore')
const { sign } = require('../_lib/jwt')
const { withCors } = require('../_lib/withCors')
const { canSendEmail, sendVerifyEmail } = require('../_lib/mail')
const { getPublicAppUrl } = require('../_lib/appUrl')

const VERIFY_DAYS = 7
const MIN_PASSWORD_LEN = 8

const issueSession = (res, u) => {
  const token = sign(
    { sub: u.id, email: u.email, role: u.role },
    process.env.AUTH_SECRET || 'dev-secret',
  )
  return json(res, 201, {
    token,
    user: { id: u.id, email: u.email, name: u.name, role: u.role, email_verified: u.email_verified !== false },
    verificationRequired: false,
  })
}

module.exports = withCors(async (req, res) => {
  if (req.method !== 'POST') return methodNotAllowed(res)

  const body = await new Promise((resolve) => {
    let data = ''
    req.on('data', (chunk) => (data += chunk))
    req.on('end', () => resolve(data ? JSON.parse(data) : {}))
  })

  const { email, password, name } = body
  if (!email || !password) {
    return json(res, 400, { error: 'Email and password are required.' })
  }
  if (String(password).length < MIN_PASSWORD_LEN) {
    return json(res, 400, { error: 'Password must be at least 8 characters.' })
  }

  const emailNorm = String(email).trim().toLowerCase()
  const users = readUsers()
  if (users.find((user) => (user.email || '').toLowerCase() === emailNorm)) {
    return json(res, 409, { error: 'User already exists.' })
  }

  const { salt, hash } = hashPassword(password)
  const isAdmin = process.env.ADMIN_EMAIL && emailNorm === String(process.env.ADMIN_EMAIL).toLowerCase()
  const verifyToken = crypto.randomBytes(32).toString('hex')
  const verifyExpires = new Date(Date.now() + VERIFY_DAYS * 86400 * 1000).toISOString()
  const useEmailVerify = Boolean(canSendEmail() && getPublicAppUrl() && !isAdmin)
  const newUser = {
    id: emailNorm,
    email: emailNorm,
    name: name || null,
    role: isAdmin ? 'admin' : 'user',
    password_hash: hash,
    password_salt: salt,
    auth_provider: 'password',
    created_at: new Date().toISOString(),
    email_verified: isAdmin || !useEmailVerify,
    verify_token: useEmailVerify && !isAdmin ? verifyToken : null,
    verify_expires: useEmailVerify && !isAdmin ? verifyExpires : null,
  }

  users.push(newUser)
  writeUsers(users)

  if (isAdmin) {
    return issueSession(res, { ...newUser, email_verified: true })
  }

  if (useEmailVerify) {
    const sent = await sendVerifyEmail(emailNorm, verifyToken)
    if (sent.ok) {
      return json(res, 201, {
        verificationRequired: true,
        user: {
          id: newUser.id,
          email: newUser.email,
          name: newUser.name,
          role: newUser.role,
          email_verified: false,
        },
        __devVerifyToken: process.env.AUTH_EXPOSE_TOKENS === '1' ? verifyToken : undefined,
      })
    }
    const idx = users.findIndex((u) => (u.email || '').toLowerCase() === emailNorm)
    if (idx >= 0) {
      users[idx] = {
        ...users[idx],
        email_verified: true,
        verify_token: null,
        verify_expires: null,
      }
      writeUsers(users)
    }
    const updated = { ...newUser, email_verified: true, verify_token: null, verify_expires: null }
    return issueSession(res, updated)
  }

  return issueSession(res, { ...newUser, email_verified: true })
})
