const { json, methodNotAllowed } = require('../_lib/response')
const { verifyPassword } = require('../_lib/crypto')
const { readUsers } = require('../_lib/usersStore')
const { sign } = require('../_lib/jwt')
const { withCors } = require('../_lib/withCors')

module.exports = withCors(async (req, res) => {
  if (req.method !== 'POST') return methodNotAllowed(res)

  const body = await new Promise((resolve) => {
    let data = ''
    req.on('data', (chunk) => (data += chunk))
    req.on('end', () => resolve(data ? JSON.parse(data) : {}))
  })

  const { email, password } = body
  if (!email || !password) {
    return json(res, 400, { error: 'Email and password are required.' })
  }

  const emailNorm = String(email).trim().toLowerCase()
  const users = readUsers()
  const user = users.find((item) => (item.email || '').toLowerCase() === emailNorm)
  if (!user) {
    return json(res, 401, { error: 'Invalid credentials.' })
  }
  if (user.auth_provider === 'google') {
    return json(res, 403, { error: 'USE_GOOGLE_SIGNIN' })
  }

  const isValid = verifyPassword(password, user.password_salt, user.password_hash)
  if (!isValid) {
    return json(res, 401, { error: 'Invalid credentials.' })
  }

  if (user.email_verified === false) {
    return json(res, 403, { error: 'EMAIL_NOT_VERIFIED' })
  }
  // Comptes créés avant la vérif. email : champ absent = considéré vérifié

  const isAdmin = process.env.ADMIN_EMAIL && user.email === process.env.ADMIN_EMAIL
  const role = isAdmin ? 'admin' : user.role
  const token = sign(
    { sub: user.id, email: user.email, role },
    process.env.AUTH_SECRET || 'dev-secret',
  )
  return json(res, 200, {
    token,
    user: { id: user.id, email: user.email, name: user.name, role },
  })
})
