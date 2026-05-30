import jwt from 'jsonwebtoken'

export default async function handler(req, res) {
  const { code, error } = req.query

  if (error || !code) {
    return res.redirect(`${process.env.APP_URL}/?li_error=1`)
  }

  // Exchange code for access token
  const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: `${process.env.APP_URL}/api/auth/callback`,
      client_id: process.env.LINKEDIN_CLIENT_ID,
      client_secret: process.env.LINKEDIN_CLIENT_SECRET,
    }),
  })

  const tokenData = await tokenRes.json()
  if (!tokenData.access_token) {
    return res.redirect(`${process.env.APP_URL}/?li_error=1`)
  }

  const { access_token } = tokenData

  // Get display name from userinfo (OpenID)
  let name = 'LinkedIn User'
  let sub = null
  try {
    const uiRes = await fetch('https://api.linkedin.com/v2/userinfo', {
      headers: { Authorization: `Bearer ${access_token}` },
    })
    const ui = await uiRes.json()
    sub = ui.sub || null
    name = ui.name || ui.given_name || name
  } catch {}

  // Get the classic LinkedIn person ID via /v2/me — more reliable for REST API URN
  let personId = sub
  try {
    const meRes = await fetch('https://api.linkedin.com/v2/me', {
      headers: { Authorization: `Bearer ${access_token}` },
    })
    const me = await meRes.json()
    if (me.id) personId = me.id
  } catch {}

  if (!personId) {
    return res.redirect(`${process.env.APP_URL}/?li_error=1`)
  }

  const sessionToken = jwt.sign(
    { access_token, sub: personId, name },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  )

  res.setHeader(
    'Set-Cookie',
    `li_session=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`
  )

  res.redirect(`${process.env.APP_URL}/?li_connected=1`)
}
