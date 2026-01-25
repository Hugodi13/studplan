const { json, methodNotAllowed } = require('../_lib/response')
const { hashPassword } = require('../_lib/crypto')
const { readUsers, writeUsers } = require('../_lib/usersStore')
const { sign } = require('../_lib/jwt')

module.exports = async (req, res) => {
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

  const users = readUsers()
  if (users.find((user) => user.email === email)) {
    return json(res, 409, { error: 'User already exists.' })
  }

  const { salt, hash } = hashPassword(password)
  const isAdmin = process.env.ADMIN_EMAIL && email === process.env.ADMIN_EMAIL
  const newUser = {
    id: email,
    email,
    name: name || null,
    role: isAdmin ? 'admin' : 'user',
    password_hash: hash,
    password_salt: salt,
    created_at: new Date().toISOString(),
  }

  users.push(newUser)
  writeUsers(users)

  const token = sign(
    { sub: newUser.id, email: newUser.email, role: newUser.role },
    process.env.AUTH_SECRET || 'dev-secret',
  )
  return json(res, 201, {
    token,
    user: { id: newUser.id, email: newUser.email, name: newUser.name, role: newUser.role },
  })
}
