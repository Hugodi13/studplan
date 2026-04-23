const { json, methodNotAllowed, unauthorized } = require('../_lib/response')
const { verify } = require('../_lib/jwt')
const { readUsers } = require('../_lib/usersStore')
const { withCors } = require('../_lib/withCors')

module.exports = withCors(async (req, res) => {
  if (req.method !== 'GET') return methodNotAllowed(res, ['GET'])

  const authHeader = req.headers.authorization || ''
  const token = authHeader.replace('Bearer ', '')
  const payload = verify(token, process.env.AUTH_SECRET || 'dev-secret')
  if (!payload || payload.role !== 'admin') return unauthorized(res)

  const users = readUsers()
  return json(res, 200, {
    users: users.length,
    activeUsers: users.length,
    tasks: 0,
    sessions: 0,
    supportTickets: 0,
  })
})
