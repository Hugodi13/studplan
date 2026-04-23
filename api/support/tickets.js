const { json, methodNotAllowed, unauthorized } = require('../_lib/response')
const { verify } = require('../_lib/jwt')
const { withCors } = require('../_lib/withCors')

module.exports = withCors(async (req, res) => {
  if (!['GET', 'POST'].includes(req.method)) return methodNotAllowed(res, ['GET', 'POST'])

  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace('Bearer ', '')
  const payload = verify(token, process.env.AUTH_SECRET || 'dev-secret')
  if (!payload) return unauthorized(res)

  if (req.method === 'GET') {
    return json(res, 200, { tickets: [] })
  }

  return json(res, 201, { ticket: { id: Date.now().toString(), status: 'open' } })
})
