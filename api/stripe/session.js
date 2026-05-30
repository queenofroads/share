import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

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

    // Fetch the setupKey from KV
    const { kv } = await import('@vercel/kv')
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
