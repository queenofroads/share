import * as kv from './kv.js'

export const version = 'v4-upstash-direct'

const DEFAULT_CONFIG = {
  eventName: '',
  tagline: '',
  date: '',
  location: '',
  hashtags: '',
  mention: '',
  logoUrl: null,
  captionAttending: "Excited to be joining {eventName} in {location}. {mention} {hashtags}",
  captionSpeaking: "Excited to be speaking at {eventName} in {location}. {mention} {hashtags}",
  captionPartner: "Proud to be a partner at {eventName} in {location}. {mention} {hashtags}",
  primaryColor: '#0066FF',
  bgColor: '#0A0F1E',
  fontFamily: 'Inter',
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  try {
    if (!process.env.KV_REST_API_URL) {
      return res.status(500).json({ error: 'Storage not connected. KV_REST_API_URL is missing from environment variables.' })
    }

    const { slug, eventName, email } = req.body || {}
    if (!slug || !eventName || !email) {
      return res.status(400).json({ error: 'Event name, slug and email are all required.' })
    }

    const slugClean = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
    if (!slugClean) return res.status(400).json({ error: 'Invalid slug.' })

    const existing = await kv.get(`event:${slugClean}`)
    if (existing) return res.status(409).json({ error: 'That event URL is already taken. Choose a different one.' })

    const setupKey = crypto.randomUUID()
    await kv.set(`event:${slugClean}`, {
      config: { ...DEFAULT_CONFIG, eventName },
      setupKey,
      ownerEmail: email,
      createdAt: new Date().toISOString(),
    })

    const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'https://shareevent.vercel.app'

    res.json({
      slug: slugClean,
      eventName,
      attendeeUrl: `${baseUrl}/e/${slugClean}`,
      setupUrl: `${baseUrl}/e/${slugClean}/setup?key=${setupKey}`,
    })
  } catch (err) {
    console.error('Create event error:', err)
    res.status(500).json({ error: err.message || 'Server error — please try again.' })
  }
}
