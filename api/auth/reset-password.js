const { json, methodNotAllowed } = require('../_lib/response')
const { hashPassword } = require('../_lib/crypto')
const { readUsers, writeUsers } = require('../_lib/usersStore')
const { withCors } = require('../_lib/withCors')

module.exports = withCors(async (req, res) => {
  if (req.method !== 'POST') return methodNotAllowed(res)

  const body = await new Promise((resolve) => {
    let data = ''
    req.on('data', (chunk) => (data += chunk))
    req.on('end', () => resolve(data ? JSON.parse(data) : {}))
  })

  const { token, password } = body
  if (!token || !password || password.length < 8) {
    return json(res, 400, { error: 'Token et mot de passe (8 car. min.) requis.' })
  }

  const users = readUsers()
  const idx = users.findIndex((u) => u.password_reset_token === token)
  if (idx < 0) {
    return json(res, 400, { error: 'Lien invalide ou expiré.' })
  }

  const u = users[idx]
  if (u.password_reset_expires) {
    const t = new Date(u.password_reset_expires)
    if (Date.now() > t.getTime()) {
      return json(res, 400, { error: 'Lien expiré.' })
    }
  }

  const { salt, hash } = hashPassword(password)
  users[idx] = {
    ...u,
    password_salt: salt,
    password_hash: hash,
    password_reset_token: null,
    password_reset_expires: null,
  }
  writeUsers(users)
  return json(res, 200, { ok: true, message: 'Mot de passe mis à jour' })
})
