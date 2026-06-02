const url = process.env.KV_REST_API_URL
const token = process.env.KV_REST_API_TOKEN

async function cmd(...args) {
  const r = await fetch(url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(args),
  })
  const { result, error } = await r.json()
  if (error) throw new Error(error)
  return result
}

export async function get(key) {
  const raw = await cmd('GET', key)
  return raw ? JSON.parse(raw) : null
}

export async function set(key, value) {
  await cmd('SET', key, JSON.stringify(value))
}

export async function incr(key) {
  return await cmd('INCR', key)
}

export async function getRaw(key) {
  return await cmd('GET', key)
}
