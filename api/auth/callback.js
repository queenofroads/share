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

  // Get user profile
  const profileRes = await fetch('https://api.linkedin.com/v2/userinfo', {
    headers: { Authorization: `Bearer ${access_token}` },
  })
  const profile = await profileRes.json()
  const sub = profile.sub
  const name = profile.name || profile.given_name || 'LinkedIn User'

  // Sign a session token (stores access_token server-side in signed cookie)
  const sessionToken = jwt.sign(
    { access_token, sub, name },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  )

  res.setHeader(
    'Set-Cookie',
    `li_session=${sessionToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`
  )

  // Redirect to oauth-success page (handles popup close or full-page redirect)
  const nameEncoded = encodeURIComponent(name)
  res.redirect(`${process.env.APP_URL}/oauth-success.html?name=${nameEncoded}`)
}
