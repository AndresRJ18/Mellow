import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from '../context/SessionContext'
import { useAuth } from '../context/AuthContext'
import TrackCard from '../components/TrackCard'
import ArtistPanel from '../components/ArtistPanel'
import LikedPanel from '../components/LikedPanel'
import UserMenu from '../components/UserMenu'
import ArtistsTab from '../components/tabs/ArtistsTab'
import LibraryTab from '../components/tabs/LibraryTab'
import MoodsTab from '../components/tabs/MoodsTab'
import Toast from '../components/Toast'
import { refine } from '../api/client'
import { saveMoodSession, saveLikedTrack, removeLikedTrack } from '../services/supabaseData'

export default function Results() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    analyzeResult,
    currentTracks,
    rounds, setRounds,
    currentTargets,
    allShownIds,
    refinementCount,
    currentLiftTracks,
    currentLiftLabel,
    currentLiftLectura,
    applyRefineResult,
    emotionalText,
  } = useSession()

  const [playingId, setPlayingId] = useState(null)
  const [likedIds, setLikedIds] = useState(new Set())           // per-round: drives card UI + refine signal
  const [allLikedTracks, setAllLikedTracks] = useState(new Map()) // persistent across rounds: id → track
  const [activeTab, setActiveTab] = useState('discover')
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1024)
  const [artistPanel, setArtistPanel] = useState(null)
  const [likedPanelOpen, setLikedPanelOpen] = useState(false)
  const [toast, setToast] = useState(null)
  const [refining, setRefining] = useState(false)
  const [moodSessionId, setMoodSessionId] = useState(null)
  const toastTimer = useRef(null)
  const moodSavedRef = useRef(null) // tracks last saved key to prevent double-save (StrictMode)
  const sessionIdRef = useRef(crypto.randomUUID())  // unique per page load

  // Track likes per artist for toast trigger
  const artistLikes = useRef({})

  // Redirect if no data
  useEffect(() => {
    if (!analyzeResult) navigate('/')
  }, [analyzeResult])

  // Save mood session to Supabase once per analyze result (if logged in)
  useEffect(() => {
    if (!analyzeResult || !user) return
    const key = `${user.id}:${analyzeResult.mood_label}:${emotionalText}`
    if (moodSavedRef.current === key) return
    moodSavedRef.current = key
    saveMoodSession(user, {
      mood_label: analyzeResult.mood_label,
      lectura: analyzeResult.lectura,
      paleta: analyzeResult.paleta,
      emotional_text: emotionalText,
    }).then((row) => { if (row) setMoodSessionId(row.id) })
  }, [analyzeResult?.mood_label, user?.id])

  if (!analyzeResult) return null

  const { lectura, mood_label, paleta = ['#8eff71', '#0a0a0a', '#1a1919'] } = analyzeResult
  const canRefine = likedIds.size > 0

  const handlePlay = useCallback((id) => {
    setPlayingId((cur) => (cur === id ? null : id))
  }, [])

  // Used by audioManager callbacks (onStop / onEnded) — sets directly to null
  // instead of toggling, so it's safe regardless of what playingId is at that moment.
  const handleClearPlay = useCallback(() => setPlayingId(null), [])

  const handleLike = useCallback((trackId) => {
    const track = [...currentTracks, ...(currentLiftTracks || [])].find((t) => t.id === trackId)
    const isCurrentlyLiked = likedIds.has(trackId)

    setLikedIds((prev) => {
      const next = new Set(prev)
      if (next.has(trackId)) next.delete(trackId)
      else next.add(trackId)
      return next
    })

    // Persist liked track objects across rounds
    if (isCurrentlyLiked) {
      setAllLikedTracks((prev) => { const m = new Map(prev); m.delete(trackId); return m })
      if (user) removeLikedTrack(user, trackId)
    } else if (track) {
      setAllLikedTracks((prev) => new Map(prev).set(trackId, track))
      if (user) saveLikedTrack(user, track)
    }

    // Toast: trigger when 2 likes from same artist
    if (track && !isCurrentlyLiked) {
      const artistId = track.artists?.[0]?.id
      const artistName = track.artists?.[0]?.name
      if (artistId) {
        artistLikes.current[artistId] = (artistLikes.current[artistId] || 0) + 1
        if (artistLikes.current[artistId] === 2 && !artistPanel) {
          showToast(
            `You seem to like ${artistName} — explore more?`,
            () => { setArtistPanel({ artist: track.artists[0], becauseLiked: track.name }); clearToast() },
          )
        }
      }
    }

    // Update current round liked_ids for refine payload
    setRounds((prev) => {
      if (!prev.length) return prev
      const updated = [...prev]
      const last = { ...updated[updated.length - 1] }
      last.liked_ids = isCurrentlyLiked
        ? last.liked_ids.filter((id) => id !== trackId)
        : [...(last.liked_ids || []), trackId]
      updated[updated.length - 1] = last
      return updated
    })
  }, [currentTracks, analyzeResult, likedIds, artistPanel])

  const handleRemoveLike = (trackId) => {
    setLikedIds((prev) => { const s = new Set(prev); s.delete(trackId); return s })
    setAllLikedTracks((prev) => { const m = new Map(prev); m.delete(trackId); return m })
    if (user) removeLikedTrack(user, trackId)
  }

  const showToast = (message, onConfirm) => {
    clearToast()
    const id = Date.now()
    setToast({ id, message, onConfirm })
    toastTimer.current = setTimeout(clearToast, 5000)
  }

  const clearToast = () => {
    setToast(null)
    if (toastTimer.current) clearTimeout(toastTimer.current)
  }

  const handleRefine = async () => {
    if (!canRefine || refining) return
    setRefining(true)

    const payload = {
      session_state: {
        session_id: sessionIdRef.current,
        original_targets: analyzeResult.current_targets,
        current_targets: currentTargets,
        spotify_searches: analyzeResult.spotify_searches,
        lift_searches: analyzeResult.lift_searches || [],
        popularity: analyzeResult.popularity,
        rounds: rounds.map((r, i) => ({
          ...r,
          // Include lift tracks in round 1 so backend can find liked lift tracks by ID
          tracks: i === 0
            ? [...r.tracks, ...(currentLiftTracks || [])]
            : r.tracks,
          liked_features: [],
          disliked_features: [],
        })),
        all_shown_ids: [...allShownIds],
        refinement_count: refinementCount,
      },
    }

    try {
      const result = await refine(payload)
      applyRefineResult(result)
      setLikedIds(new Set())   // reset per-round likes; allLikedTracks persists
      setPlayingId(null)
      artistLikes.current = {}
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      console.error(err)
    } finally {
      setRefining(false)
    }
  }

  // Liked tracks for the panel — persistent across all rounds
  const likedTracks = [...allLikedTracks.values()]

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Gradiente de paleta dinámica — más visible para que el mood tenga presencia */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background: `radial-gradient(ellipse at 15% 15%, ${paleta[0]}18, transparent 55%),
                       radial-gradient(ellipse at 85% 75%, ${paleta[1] || paleta[0]}12, transparent 55%),
                       radial-gradient(ellipse at 50% 100%, ${paleta[2] || paleta[0]}08, transparent 50%)`,
        }}
      />

      {/* Top bar */}
      <header className="bg-zinc-950 sticky top-0 z-40 flex justify-between items-center px-6 py-4 border-b border-zinc-800">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen((o) => !o)}
            className="text-zinc-400 hover:text-zinc-100 transition-colors p-1 rounded-lg hover:bg-zinc-800"
            aria-label="Toggle menu"
          >
            <span className="material-symbols-outlined text-2xl">
              {sidebarOpen ? 'close' : 'menu'}
            </span>
          </button>
          <div
            className="font-display italic text-zinc-100 text-2xl cursor-pointer"
            onClick={() => navigate('/')}
          >
            mellow
          </div>
        </div>
        <div className="flex items-center gap-4">
          <UserMenu />
        </div>
      </header>

      <div className="flex relative z-10">
        {/* Mobile overlay when sidebar open */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 z-30 bg-black/30"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar drawer — toggleable, default open */}
        <aside
          className={`flex flex-col w-64 fixed left-0 top-[57px] h-[calc(100vh-57px)] bg-zinc-900 border-r border-zinc-800 z-40 transition-transform duration-300
            ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
        >
          <nav className="flex flex-col px-3 gap-1 pt-6">
            {[
              { id: 'discover', icon: 'explore', label: 'Descubrir' },
              { id: 'artists', icon: 'person_search', label: 'Artistas' },
              { id: 'library', icon: 'library_music', label: 'Biblioteca' },
              { id: 'moods', icon: 'palette', label: 'Moods' },
            ].map(({ id, icon, label }) => (
              <button
                key={id}
                onClick={() => { setActiveTab(id); if (window.innerWidth < 1024) setSidebarOpen(false) }}
                className={`flex items-center gap-3 px-5 py-3 text-sm font-medium tracking-wide cursor-pointer transition-colors text-left
                  ${activeTab === id
                    ? 'text-primary'
                    : 'text-zinc-500 hover:text-zinc-300'
                  }`}
              >
                <span className="material-symbols-outlined text-lg"
                  style={activeTab === id ? { fontVariationSettings: "'FILL' 1" } : undefined}
                >{icon}</span>
                <span>{label}</span>
                {id === 'library' && allLikedTracks.size > 0 && (
                  <span className={`ml-auto text-[10px] font-black px-1.5 py-0.5 rounded-full ${activeTab === id ? 'text-primary' : 'text-zinc-500'}`}>
                    {allLikedTracks.size}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Refinar + Guardados al fondo del drawer */}
          <div className="mt-auto px-4 pb-8 flex flex-col gap-3">
            <div className="border-t border-white/10 pt-4 flex flex-col gap-3">
              <button
                onClick={handleRefine}
                disabled={!canRefine || refining}
                className={`w-full flex items-center justify-center gap-2 py-3.5 text-xs font-black uppercase tracking-widest rounded-full border-2 transition-all
                  ${canRefine
                    ? 'border-zinc-600 text-zinc-100 hover:bg-zinc-700 active:scale-[0.98]'
                    : 'border-zinc-700 text-zinc-600 cursor-not-allowed'
                  }`}
              >
                <span className="material-symbols-outlined text-sm">tune</span>
                {refining ? 'Refinando...' : 'Refinar'}
              </button>
              <button
                onClick={() => setLikedPanelOpen(true)}
                className="w-full flex items-center justify-center gap-2 py-3.5 text-xs font-black uppercase tracking-widest bg-primary text-on-primary rounded-full shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,0.85)] hover:-translate-y-px active:scale-[0.98] active:shadow-none transition-all relative"
              >
                {allLikedTracks.size > 0 && (
                  <span className="absolute top-1.5 right-3 bg-on-primary text-primary text-[10px] font-black w-4 h-4 flex items-center justify-center rounded-full">
                    {allLikedTracks.size}
                  </span>
                )}
                <span
                  className="material-symbols-outlined text-sm"
                  style={allLikedTracks.size > 0
                    ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }
                    : undefined}
                >favorite</span>
                {allLikedTracks.size > 0 ? 'Compartir' : 'Likes'}
              </button>
            </div>
          </div>
        </aside>

        {/* Main content */}
        <main className={`flex justify-center pb-32 lg:pb-8 w-full transition-all duration-300 ${sidebarOpen ? 'lg:ml-64' : 'lg:ml-0'}`}>
          <div className="w-full max-w-[640px] px-4 sm:px-6">

            {/* DISCOVER TAB */}
            {activeTab === 'discover' && (
              <>
                <div className="pt-16 pb-12">
                  <p className="label-caps text-primary/60 mb-4">Perfil de estado activo</p>
                  {/* DM Serif Display italic — el mood_label como título de poema */}
                  <h1 className="font-display italic text-zinc-100 text-5xl sm:text-6xl md:text-8xl leading-none mb-6"
                      style={{ color: paleta[0] }}>
                    {mood_label || 'Tu Estado'}
                  </h1>
                  {lectura && (
                    <p className="text-zinc-400 text-base max-w-md leading-relaxed font-light">
                      {lectura}
                    </p>
                  )}
                </div>
                <section className="space-y-1">
                  {currentTracks.map((track, i) => (
                    <TrackCard
                      key={`${track.id}-${refinementCount}`}
                      track={track}
                      index={i}
                      isPlaying={playingId === track.id}
                      isLiked={likedIds.has(track.id)}
                      onPlay={handlePlay}
                      onClearPlay={handleClearPlay}
                      onLike={handleLike}
                      onExplore={(artist) => artist && setArtistPanel({ artist, becauseLiked: track.name })}
                      accentColor={paleta[0]}
                    />
                  ))}
                </section>
                {currentLiftTracks?.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="mt-14 pt-8 border-t border-zinc-800"
                  >
                    <p className="label-caps text-primary mb-2">
                      {currentLiftLabel || 'Cuando estés listo'}
                    </p>
                    <p className="text-zinc-400 text-sm mb-6 max-w-md leading-relaxed">
                      {currentLiftLectura}
                    </p>
                    <div className="space-y-1">
                      {currentLiftTracks.map((track, i) => (
                        <TrackCard
                          key={`lift-${track.id}-${refinementCount}`}
                          track={track}
                          index={i + 10}
                          isPlaying={playingId === track.id}
                          isLiked={likedIds.has(track.id)}
                          onPlay={handlePlay}
                          onClearPlay={handleClearPlay}
                          onLike={handleLike}
                          onExplore={(artist) => artist && setArtistPanel({ artist, becauseLiked: track.name })}
                          accentColor={paleta[0]}
                        />
                      ))}
                    </div>
                  </motion.div>
                )}
                <div className="h-28" />
              </>
            )}

            {/* ARTISTS TAB */}
            {activeTab === 'artists' && (
              <ArtistsTab
                currentTracks={currentTracks}
                liftTracks={currentLiftTracks}
                onExplore={({ artist, becauseLiked }) => setArtistPanel({ artist, becauseLiked })}
              />
            )}

            {/* LIBRARY TAB */}
            {activeTab === 'library' && (
              <LibraryTab
                likedTracks={likedTracks}
                onRemove={handleRemoveLike}
              />
            )}

            {/* MOODS TAB */}
            {activeTab === 'moods' && (
              <MoodsTab
                moodLabel={mood_label}
                lectura={lectura}
                paleta={paleta}
              />
            )}

          </div>
        </main>
      </div>

      {/* Mobile bottom action bar — Refinar + Guardados always accessible on small screens */}
      <div className={`lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-zinc-950/95 backdrop-blur-sm border-t border-zinc-800 px-4 py-3 flex gap-3 transition-transform duration-300 ${sidebarOpen ? 'translate-y-full' : 'translate-y-0'}`}>
        <button
          onClick={handleRefine}
          disabled={!canRefine || refining}
          className={`flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-widest rounded-full border-2 transition-all
            ${canRefine
              ? 'border-zinc-600 text-zinc-100 active:scale-[0.98]'
              : 'border-zinc-700 text-zinc-600 cursor-not-allowed'
            }`}
        >
          <span className="material-symbols-outlined text-sm">tune</span>
          {refining ? 'Refinando...' : 'Refinar'}
        </button>
        <button
          onClick={() => setLikedPanelOpen(true)}
          className="flex-1 flex items-center justify-center gap-2 py-3 text-xs font-black uppercase tracking-widest bg-primary text-on-primary rounded-full shadow-[3px_3px_0px_0px_rgba(0,0,0,0.85)] active:scale-[0.98] active:shadow-none transition-all relative"
        >
          {allLikedTracks.size > 0 && (
            <span className="absolute top-1.5 right-3 bg-on-primary text-primary text-[10px] font-black w-4 h-4 flex items-center justify-center rounded-full">
              {allLikedTracks.size}
            </span>
          )}
          <span
            className="material-symbols-outlined text-sm"
            style={allLikedTracks.size > 0
              ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }
              : undefined}
          >favorite</span>
          {allLikedTracks.size > 0 ? 'Compartir' : 'Likes'}
        </button>
      </div>

      {/* Artist panel + backdrop */}
      {artistPanel && (
        <div
          className="fixed inset-0 z-40 backdrop-blur-sm"
          onClick={() => setArtistPanel(null)}
        />
      )}
      {artistPanel && (
        <ArtistPanel
          artist={artistPanel.artist}
          becauseLiked={artistPanel.becauseLiked}
          onClose={() => setArtistPanel(null)}
          onLikeTrack={() => {}}
          onTakeoverAudio={handleClearPlay}
          accentColor={paleta[0]}
        />
      )}

      {/* Liked panel + backdrop */}
      <AnimatePresence>
        {likedPanelOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 backdrop-blur-sm"
              onClick={() => setLikedPanelOpen(false)}
            />
            <LikedPanel
              likedTracks={likedTracks}
              onRemove={handleRemoveLike}
              onClose={() => setLikedPanelOpen(false)}
            />
          </>
        )}
      </AnimatePresence>

      {/* Toast */}
      <Toast
        toast={toast}
        onConfirm={toast?.onConfirm}
        onDismiss={clearToast}
      />
    </div>
  )
}
