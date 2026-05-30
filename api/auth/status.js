import jwt from 'jsonwebtoken'

function parseCookies(req) {
  const out = {}
  const header = req.headers?.cookie || ''
  header.split(';').forEach(part => {
    const [k, ...v] = part.split('=')
    if (k?.trim()) out[k.trim()] = v.join('=').trim()
  })
  return out
}

export default function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store')
  const cookies = parseCookies(req)
  const token = cookies.li_session
  if (!token) return res.json({ connected: false })
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    res.json({ connected: true, name: payload.name })
  } catch {
    res.json({ connected: false })
  }
}
