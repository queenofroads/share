import { Redis } from '@upstash/redis'
const kv = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })

export default async function handler(req, res) {
  const { slug, key } = req.query

  if (req.method === 'GET') {
    const record = await kv.get(`event:${slug}`)
    if (!record) return res.status(404).json({ error: 'Event not found' })
    return res.json({ config: record.config })
  }

  if (req.method === 'PUT') {
    const record = await kv.get(`event:${slug}`)
    if (!record) return res.status(404).json({ error: 'Event not found' })
    if (!key || key !== record.setupKey) return res.status(403).json({ error: 'Invalid setup key' })

    const { config } = req.body
    if (!config) return res.status(400).json({ error: 'Missing config' })

    await kv.set(`event:${slug}`, { ...record, config })
    return res.json({ success: true })
  }

  res.status(405).end()
}
