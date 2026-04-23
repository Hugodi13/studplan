/** URL du front (liens e-mail) — ex. `https://studyplan-c9w.pages.dev` (sans / final) */
const getPublicAppUrl = () => {
  if (process.env.PUBLIC_APP_URL) {
    return String(process.env.PUBLIC_APP_URL).replace(/\/$/, '')
  }
  if (process.env.VERCEL_URL) {
    return `https://${String(process.env.VERCEL_URL).replace(/\/$/, '')}`
  }
  return ''
}

module.exports = { getPublicAppUrl }
