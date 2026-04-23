const { json, methodNotAllowed } = require('../../_lib/response')
const { withCors } = require('../../_lib/withCors')

module.exports = withCors(async (req, res) => {
  if (req.method !== 'POST') return methodNotAllowed(res, ['POST'])

  return json(res, 200, {
    token: 'oauth-google-dev',
    user: { id: 'google-dev', email: 'google-user@studyplan.local', role: 'user' },
  })
})
