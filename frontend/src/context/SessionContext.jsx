import { createContext, useContext, useState, useCallback } from 'react'

const SessionContext = createContext(null)

export function SessionProvider({ children }) {
  // Onboarding inputs
  const [emotionalText, setEmotionalText] = useState('')
  const [musicTasteText, setMusicTasteText] = useState('')
  const [sliderTempo, setSliderTempo] = useState(3)
  const [sliderLyrics, setSliderLyrics] = useState(3)
  const [sliderFamiliarity, setSliderFamiliarity] = useState(3)

  // Analyze result (from backend)
  const [analyzeResult, setAnalyzeResult] = useState(null)

  // Refinement state
  const [rounds, setRounds] = useState([])
  const [currentTracks, setCurrentTracks] = useState([])
  const [currentTargets, setCurrentTargets] = useState(null)
  const [allShownIds, setAllShownIds] = useState(new Set())
  const [refinementCount, setRefinementCount] = useState(0)

  // Current lift — starts from analyzeResult, updated on each refine
  const [currentLiftTracks, setCurrentLiftTracks] = useState([])
  const [currentLiftLabel, setCurrentLiftLabel] = useState(null)
  const [currentLiftLectura, setCurrentLiftLectura] = useState(null)

  // Auth — persisted in localStorage so user doesn't re-auth on refresh
  const [spotifyToken, setSpotifyToken] = useState(
    () => localStorage.getItem('spotify_token') || null,
  )
  const [exportedPlaylist, setExportedPlaylist] = useState(null)

  const initFromAnalyze = useCallback((result) => {
    setAnalyzeResult(result)
    setCurrentTracks(result.tracks)
    setCurrentTargets(result.current_targets)
    setAllShownIds(new Set(result.tracks.map((t) => t.id)))
    setRounds([
      {
        round: 1,
        tracks: result.tracks,
        liked_ids: [],
        disliked_ids: [],
        more_like_this_id: null,
      },
    ])
    setRefinementCount(0)
    setCurrentLiftTracks(result.lift_tracks || [])
    setCurrentLiftLabel(result.lift_label || null)
    setCurrentLiftLectura(result.lift_lectura || null)
  }, [])

  const applyRefineResult = useCallback((result) => {
    setCurrentTracks(result.tracks)
    setCurrentTargets(result.new_targets)
    setAllShownIds((prev) => {
      const next = new Set(prev)
      result.tracks.forEach((t) => next.add(t.id))
      if (result.lift_tracks) result.lift_tracks.forEach((t) => next.add(t.id))
      return next
    })
    setRounds((prev) => [
      ...prev,
      {
        round: prev.length + 1,
        tracks: result.tracks,
        liked_ids: [],
        disliked_ids: [],
        more_like_this_id: null,
      },
    ])
    setRefinementCount((c) => c + 1)
    if (result.lift_tracks?.length > 0) {
      setCurrentLiftTracks(result.lift_tracks)
    }
    // lift_label and lift_lectura stay from original analysis (they're the emotional direction)
  }, [])

  const persistSpotifyToken = useCallback((token) => {
    if (token) localStorage.setItem('spotify_token', token)
    else localStorage.removeItem('spotify_token')
    setSpotifyToken(token)
  }, [])

  const value = {
    emotionalText, setEmotionalText,
    musicTasteText, setMusicTasteText,
    sliderTempo, setSliderTempo,
    sliderLyrics, setSliderLyrics,
    sliderFamiliarity, setSliderFamiliarity,
    analyzeResult,
    rounds, setRounds,
    currentTracks,
    currentTargets,
    allShownIds,
    refinementCount,
    currentLiftTracks,
    currentLiftLabel,
    currentLiftLectura,
    spotifyToken, setSpotifyToken: persistSpotifyToken,
    exportedPlaylist, setExportedPlaylist,
    initFromAnalyze,
    applyRefineResult,
  }

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be inside SessionProvider')
  return ctx
}
