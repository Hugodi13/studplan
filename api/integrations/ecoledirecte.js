const { json, methodNotAllowed, unauthorized, badRequest } = require('../_lib/response')
const { verify } = require('../_lib/jwt')
const { withCors } = require('../_lib/withCors')

module.exports = withCors(async (req, res) => {
  if (req.method !== 'POST') return methodNotAllowed(res)

  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace('Bearer ', '')
  const payload = verify(token, process.env.AUTH_SECRET || 'dev-secret')
  if (!payload) return unauthorized(res)

  const { username, password } = req.body || {}
  if (!username || !password) {
    return badRequest(res, 'Missing Ecole Directe credentials')
  }

  const today = new Date()
  const d1 = new Date(today.getTime() + 24 * 3600 * 1000)
  const d2 = new Date(today.getTime() + 48 * 3600 * 1000)
  const fmt = (d) => d.toISOString().slice(0, 10)

  return json(res, 200, {
    mock: true,
    source: 'ecoledirecte',
    tasks: [
      {
        title: 'Commentaire de texte',
        subject: 'Français',
        description: 'Structure intro + 2 parties + conclusion',
        difficulty: 'moyen',
        estimated_minutes: 40,
        due_date: fmt(d1),
      },
      {
        title: 'Vocabulaire anglais unite 6',
        subject: 'Anglais',
        description: 'Apprendre 30 mots et expressions',
        difficulty: 'facile',
        estimated_minutes: 20,
        due_date: fmt(d2),
      },
    ],
  })
})
