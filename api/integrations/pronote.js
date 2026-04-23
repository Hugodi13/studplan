const { json, methodNotAllowed, unauthorized, badRequest } = require('../_lib/response')
const { verify } = require('../_lib/jwt')
const { withCors } = require('../_lib/withCors')

module.exports = withCors(async (req, res) => {
  if (req.method !== 'POST') return methodNotAllowed(res)

  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace('Bearer ', '')
  const payload = verify(token, process.env.AUTH_SECRET || 'dev-secret')
  if (!payload) return unauthorized(res)

  const { url, username, password } = req.body || {}
  if (!url || !username || !password) {
    return badRequest(res, 'Missing pronote credentials')
  }

  const today = new Date()
  const d1 = new Date(today.getTime() + 24 * 3600 * 1000)
  const d2 = new Date(today.getTime() + 48 * 3600 * 1000)
  const d3 = new Date(today.getTime() + 72 * 3600 * 1000)
  const fmt = (d) => d.toISOString().slice(0, 10)

  return json(res, 200, {
    mock: true,
    source: 'pronote',
    tasks: [
      {
        title: 'Exercices 3 a 6 page 142',
        subject: 'Mathématiques',
        description: 'Entrainement fonctions affines',
        difficulty: 'moyen',
        estimated_minutes: 35,
        due_date: fmt(d1),
      },
      {
        title: 'Reviser chapitre 4',
        subject: 'Histoire-Géographie',
        description: 'Fiche + dates importantes',
        difficulty: 'facile',
        estimated_minutes: 25,
        due_date: fmt(d2),
      },
      {
        title: 'Compte-rendu TP',
        subject: 'Physique-Chimie',
        description: 'Rediger le protocole et les conclusions',
        difficulty: 'difficile',
        estimated_minutes: 50,
        due_date: fmt(d3),
      },
    ],
  })
})
