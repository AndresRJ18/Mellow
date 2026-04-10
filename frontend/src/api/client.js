const BASE = import.meta.env.VITE_API_URL || ''

async function request(path, options = {}, token = null) {
  const headers = { 'Content-Type': 'application/json', ...options.headers }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${BASE}${path}`, { ...options, headers })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    // Throw the raw detail object so callers can inspect error codes
    throw err.detail || `HTTP ${res.status}`
  }
  return res.json()
}

export function analyze(body, token) {
  return request('/analyze', { method: 'POST', body: JSON.stringify(body) }, token)
}

export function refine(body) {
  return request('/refine', { method: 'POST', body: JSON.stringify(body) })
}

export function getArtist(artistId) {
  return request(`/artists/${artistId}`)
}

export function getArtistTopTracks(artistId, market = 'US', artistName = '') {
  const name = artistName ? `&artist_name=${encodeURIComponent(artistName)}` : ''
  return request(`/artists/${artistId}/top-tracks?market=${market}${name}`)
}

export function getRelatedArtists(artistId) {
  return request(`/artists/${artistId}/related-artists`)
}

// body must include: { track_uris, mood_label, access_token }
export function exportPlaylist(body) {
  return request('/playlist/export', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}
