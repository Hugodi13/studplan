const base64UrlEncode = (input) =>
  Buffer.from(JSON.stringify(input)).toString('base64url')

const base64UrlDecode = (input) =>
  JSON.parse(Buffer.from(input, 'base64url').toString('utf8'))

const sign = (payload, secret, expiresInSeconds = 60 * 60 * 24) => {
  const header = { alg: 'HS256', typ: 'JWT' }
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds
  const body = { ...payload, exp }
  const data = `${base64UrlEncode(header)}.${base64UrlEncode(body)}`
  const signature = require('crypto')
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64url')
  return `${data}.${signature}`
}

const verify = (token, secret) => {
  const [headerB64, payloadB64, signature] = token.split('.')
  if (!headerB64 || !payloadB64 || !signature) return null
  const data = `${headerB64}.${payloadB64}`
  const expected = require('crypto')
    .createHmac('sha256', secret)
    .update(data)
    .digest('base64url')
  if (expected !== signature) return null
  const payload = base64UrlDecode(payloadB64)
  if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null
  return payload
}

module.exports = { sign, verify }
