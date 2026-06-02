import * as kv from '../kv.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { slug } = req.query
  const { event } = req.query // 'view' or 'download'

  if (!slug || !['view', 'download'].includes(event)) {
    return res.status(400).json({ error: 'Invalid request' })
  }

  try {
    const day = new Date().toISOString().slice(0, 10)
    await Promise.all([
      kv.incr(`stats:${slug}:${event}s`),
      kv.incr(`stats:${slug}:day:${day}:${event}s`),
    ])
    res.json({ ok: true })
  } catch {
    res.json({ ok: false })
  }
}
