import * as kv from '../kv.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const { slug, key } = req.query
  if (!slug) return res.status(400).json({ error: 'Missing slug' })

  try {
    const [viewsRaw, downloadsRaw] = await Promise.all([
      kv.getRaw(`stats:${slug}:views`),
      kv.getRaw(`stats:${slug}:downloads`),
    ])

    const downloads = parseInt(downloadsRaw || '0')
    const views = parseInt(viewsRaw || '0')

    // Public: only return download count (no key required)
    if (!key) {
      return res.json({ downloads })
    }

    // Organizer: verify setup key
    const record = await kv.get(`event:${slug}`)
    if (!record) return res.status(404).json({ error: 'Event not found' })
    if (key !== record.setupKey) return res.status(403).json({ error: 'Invalid key' })

    // Gather last 14 days of daily data
    const byDay = {}
    const today = new Date()
    for (let i = 13; i >= 0; i--) {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      const day = d.toISOString().slice(0, 10)
      const [dv, dd] = await Promise.all([
        kv.getRaw(`stats:${slug}:day:${day}:views`),
        kv.getRaw(`stats:${slug}:day:${day}:downloads`),
      ])
      byDay[day] = { views: parseInt(dv || '0'), downloads: parseInt(dd || '0') }
    }

    res.json({
      views,
      downloads,
      conversionPct: views > 0 ? Math.round((downloads / views) * 100) : 0,
      impressionsEst: downloads * 2500,
      byDay,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
