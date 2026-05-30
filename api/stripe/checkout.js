import Stripe from 'stripe'
import { kv } from '@vercel/kv'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { slug, eventName, email } = req.body || {}

  if (!slug || !eventName || !email) {
    return res.status(400).json({ error: 'slug, eventName and email are required' })
  }

  const slugClean = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '')
  if (!slugClean) return res.status(400).json({ error: 'Invalid slug' })

  const existing = await kv.get(`event:${slugClean}`)
  if (existing) return res.status(409).json({ error: 'That event URL is already taken. Choose a different one.' })

  const baseUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'https://shareevent.vercel.app'

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
    metadata: { slug: slugClean, eventName, email },
    customer_email: email,
    success_url: `${baseUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/buy`,
  })

  res.json({ url: session.url })
}
