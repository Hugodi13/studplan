const { json, methodNotAllowed } = require('../../_lib/response')

module.exports = async (req, res) => {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST'])

  return json(res, 200, {
    token: 'oauth-apple-dev',
    user: { id: 'apple-dev', email: 'apple-user@studyplan.local', role: 'user' },
  })
}
