const { json, methodNotAllowed, unauthorized } = require('../_lib/response')
const { verify } = require('../_lib/jwt')

module.exports = async (req, res) => {
  if (req.method !== 'POST') return methodNotAllowed(res)

  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace('Bearer ', '')
  const payload = verify(token, process.env.AUTH_SECRET || 'dev-secret')
  if (!payload) return unauthorized(res)

  return json(res, 202, { message: 'Agent plan generation queued.' })
}
