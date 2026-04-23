/**
 * CORS : requêtes du front hébergé ailleurs (ex. Cloudflare Pages) vers l’API (ex. Vercel).
 * CORS_ALLOW_ORIGIN=https://studyplan-c9w.pages.dev,http://localhost:5173
 * (séparateur virgule, pas d’espace requis)
 */
const getAllowOrigin = (req) => {
  const list = (process.env.CORS_ALLOW_ORIGIN || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const origin = req.headers && req.headers.origin
  if (list.length === 0) {
    return origin || '*'
  }
  if (origin && list.includes(origin)) {
    return origin
  }
  return list[0]
}

const applyCors = (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', getAllowOrigin(req))
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, DELETE, PATCH')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
  res.setHeader('Vary', 'Origin')
}

module.exports = { applyCors, getAllowOrigin }
