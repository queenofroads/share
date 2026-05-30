export default function handler(req, res) {
  const state = Math.random().toString(36).slice(2)
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.LINKEDIN_CLIENT_ID,
    redirect_uri: `${process.env.APP_URL}/api/auth/callback`,
    scope: 'openid profile w_member_social',
    state,
  })
  res.redirect(`https://www.linkedin.com/oauth/v2/authorization?${params}`)
}
