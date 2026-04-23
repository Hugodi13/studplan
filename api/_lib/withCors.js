const { applyCors } = require('./cors')

/** Enveloppe un handler Vercel pour OPTIONS + en-têtes CORS. */
const withCors = (handler) => async (req, res) => {
  if (req.method === 'OPTIONS') {
    applyCors(req, res)
    res.statusCode = 204
    return res.end()
  }
  applyCors(req, res)
  return handler(req, res)
}

module.exports = { withCors }
