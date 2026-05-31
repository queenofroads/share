import Stripe from 'stripe'
import { Redis } from '@upstash/redis'
const kv = new Redis({ url: process.env.KV_REST_API_URL, token: process.env.KV_REST_API_TOKEN })

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

export const config = { api: { bodyParser: false } }

async function getRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', c => chunks.push(c))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const rawBody = await getRawBody(req)
  const sig = req.headers['stripe-signature']

  let event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET)
  } catch (err) {
    return res.status(400).json({ error: `Webhook error: ${err.message}` })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object
    const { slug, eventName, email } = session.metadata || {}
    if (!slug) return res.status(200).end()

    const setupKey = crypto.randomUUID()

    const DEFAULT_CONFIG = {
      eventName: eventName || 'Your Event',
      tagline: '',
      date: '',
      location: '',
      hashtags: '',
      mention: '',
      logoUrl: null,
      captionAttending: `Excited to be joining ${eventName}. See you there!`,
      captionSpeaking: `Excited to be speaking at ${eventName}. Come find me!`,
      captionPartner: `Proud to be a partner at ${eventName}. See you there!`,
      primaryColor: '#0066FF',
      bgColor: '#0A0F1E',
      fontFamily: 'Inter',
    }

    await kv.set(`event:${slug}`, {
      config: DEFAULT_CONFIG,
      setupKey,
      ownerEmail: email,
      createdAt: new Date().toISOString(),
    })
  }

  res.status(200).json({ received: true })
}
