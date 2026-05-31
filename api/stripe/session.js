import Stripe from 'stripe'
import { Redis } from '@upstash/redis'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
const kv = new Redis({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN })

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).end()

  const { id } = req.query
  if (!id) return res.status(400).json({ error: 'Missing session_id' })

  try {
    const session = await stripe.checkout.sessions.retrieve(id)
    const { slug } = session.metadata || {}
    if (!slug) return res.status(404).json({ error: 'No event found for this session' })

    const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : 'https://shareevent.vercel.app'

    const record = await kv.get(`event:${slug}`)
    if (!record) return res.status(404).json({ error: 'Event record not found yet — please wait a moment and refresh' })

    res.json({
      slug,
      eventName: session.metadata.eventName,
      attendeeUrl: `${baseUrl}/e/${slug}`,
      setupUrl: `${baseUrl}/e/${slug}/setup?key=${record.setupKey}`,
    })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
