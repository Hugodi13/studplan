const { json, methodNotAllowed } = require('../_lib/response')
const { readUsers, writeUsers } = require('../_lib/usersStore')
const { withCors } = require('../_lib/withCors')

module.exports = withCors(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'POST') return methodNotAllowed(res)

  let token
  if (req.method === 'GET') {
    const u = new URL(req.url || '', 'http://localhost')
    token = u.searchParams.get('token')
  } else {
    const body = await new Promise((resolve) => {
      let data = ''
      req.on('data', (chunk) => (data += chunk))
      req.on('end', () => resolve(data ? JSON.parse(data) : {}))
    })
    token = body.token
  }
  if (!token) {
    return json(res, 400, { error: 'Token requis' })
  }

  const users = readUsers()
  const idx = users.findIndex((u) => u.verify_token === token)
  if (idx < 0) {
    return json(res, 400, { error: 'Lien invalide ou expiré' })
  }

  const u = users[idx]
  if (u.verify_expires) {
    const t = new Date(u.verify_expires)
    if (Date.now() > t.getTime()) {
      return json(res, 400, { error: 'Lien expiré' })
    }
  }

  users[idx] = {
    ...u,
    email_verified: true,
    verify_token: null,
    verify_expires: null,
  }
  writeUsers(users)
  return json(res, 200, { ok: true, message: 'Email vérifié' })
})
