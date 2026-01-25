const json = (res, status, data) => {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(data))
}

const methodNotAllowed = (res, methods = ['POST']) => {
  res.setHeader('Allow', methods.join(', '))
  return json(res, 405, { error: 'Method not allowed' })
}

const unauthorized = (res) => json(res, 401, { error: 'Unauthorized' })

module.exports = { json, methodNotAllowed, unauthorized }
