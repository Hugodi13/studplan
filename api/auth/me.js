const { json, methodNotAllowed, unauthorized } = require('../_lib/response')
const { verify } = require('../_lib/jwt')
const { withCors } = require('../_lib/withCors')

module.exports = withCors(async (req, res) => {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET'])

  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace('Bearer ', '')
  if (!token) return unauthorized(res)

  const payload = verify(token, process.env.AUTH_SECRET || 'dev-secret')
  if (!payload) return unauthorized(res)

  return json(res, 200, {
    user: { id: payload.sub, email: payload.email, role: payload.role },
  })
})
