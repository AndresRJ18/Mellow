import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSession } from '../context/SessionContext'
import { exchangeCode } from '../utils/spotifyPKCE'

export default function AuthCallback() {
  const navigate = useNavigate()
  const { setSpotifyToken } = useSession()

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const error = params.get('error')

    const send = (token, err) => {
      if (window.opener && !window.opener.closed) {
        const msg = token
          ? { type: 'spotify-token', token }
          : { type: 'spotify-error', error: err || 'unknown' }
        window.opener.postMessage(msg, window.location.origin)
        window.close()
      } else {
        if (token) setSpotifyToken(token)
        navigate('/results', { replace: true })
      }
    }

    if (error || !code) {
      send(null, error || 'no_code')
      return
    }

    exchangeCode(code)
      .then((token) => send(token, null))
      .catch((err) => {
        console.error('PKCE exchange failed:', err)
        send(null, err.message)
      })
  }, [])

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center">
      <div className="text-center">
        <p className="font-display italic text-on-surface text-2xl mb-2">mellow</p>
        <p className="text-on-surface-variant text-xs uppercase tracking-widest animate-pulse">
          Conectando con Spotify...
        </p>
      </div>
    </div>
  )
}
