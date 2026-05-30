import jwt from 'jsonwebtoken'

export const config = {
  api: { bodyParser: { sizeLimit: '10mb' } },
}

function parseCookies(req) {
  const out = {}
  const header = req.headers?.cookie || ''
  header.split(';').forEach(part => {
    const [k, ...v] = part.split('=')
    if (k?.trim()) out[k.trim()] = v.join('=').trim()
  })
  return out
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  // Verify session
  const cookies = parseCookies(req)
  const token = cookies.li_session
  if (!token) return res.status(401).json({ error: 'Not connected to LinkedIn' })

  let payload
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET)
  } catch {
    return res.status(401).json({ error: 'Session expired — please reconnect' })
  }

  const { access_token, sub } = payload
  const { imageDataUrl, caption } = req.body
  const personUrn = `urn:li:person:${sub}`
  const LI_VERSION = '202410'

  // 1. Initialize image upload
  const initRes = await fetch('https://api.linkedin.com/rest/images?action=initializeUpload', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
      'LinkedIn-Version': LI_VERSION,
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({ initializeUploadRequest: { owner: personUrn } }),
  })

  const initData = await initRes.json()
  if (!initData?.value?.uploadUrl) {
    const detail = JSON.stringify(initData)
    const msg = initData?.message || initData?.error || detail
    return res.status(500).json({ error: `Image upload failed: ${msg}` })
  }

  const { uploadUrl, image: imageUrn } = initData.value

  // 2. Upload image binary
  const base64 = imageDataUrl.split(',')[1]
  const imageBuffer = Buffer.from(base64, 'base64')

  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: imageBuffer,
  })

  if (!uploadRes.ok) {
    return res.status(500).json({ error: 'Failed to upload image', status: uploadRes.status })
  }

  // 3. Create post
  const postRes = await fetch('https://api.linkedin.com/rest/posts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
      'LinkedIn-Version': LI_VERSION,
      'X-Restli-Protocol-Version': '2.0.0',
    },
    body: JSON.stringify({
      author: personUrn,
      commentary: caption,
      visibility: 'PUBLIC',
      distribution: {
        feedDistribution: 'MAIN_FEED',
        targetEntities: [],
        thirdPartyDistributionChannels: [],
      },
      content: {
        media: {
          title: 'Event graphic',
          id: imageUrn,
        },
      },
      lifecycleState: 'PUBLISHED',
      isReshareDisabledByAuthor: false,
    }),
  })

  if (!postRes.ok) {
    const detail = await postRes.text()
    return res.status(500).json({ error: 'Failed to create post', detail })
  }

  res.json({ success: true })
}
