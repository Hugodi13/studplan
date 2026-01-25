const { json, methodNotAllowed } = require('../_lib/response')
const { verifyPassword } = require('../_lib/crypto')
const { readUsers } = require('../_lib/usersStore')
const { sign } = require('../_lib/jwt')

module.exports = async (req, res) => {
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

  const users = readUsers()
  const user = users.find((item) => item.email === email)
  if (!user) {
    return json(res, 401, { error: 'Invalid credentials.' })
  }

  const isValid = verifyPassword(password, user.password_salt, user.password_hash)
  if (!isValid) {
    return json(res, 401, { error: 'Invalid credentials.' })
  }

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
}
