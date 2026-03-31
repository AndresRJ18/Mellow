import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { getArtist, getArtistTopTracks, getRelatedArtists } from '../api/client'
import WaveformBars from './WaveformBars'
import { playAudio, stopAudio } from '../utils/audioManager'

const VALID_MARKETS = new Set(['AD','AE','AG','AL','AM','AO','AR','AT','AU','AZ','BA','BB','BD','BE','BF','BG','BH','BI','BJ','BN','BO','BR','BS','BT','BW','BY','BZ','CA','CD','CG','CH','CI','CL','CM','CO','CR','CV','CW','CY','CZ','DE','DJ','DK','DM','DO','DZ','EC','EE','EG','ES','ET','FI','FJ','FM','FR','GA','GB','GD','GE','GH','GM','GN','GQ','GR','GT','GW','GY','HK','HN','HR','HT','HU','ID','IE','IL','IN','IQ','IS','IT','JM','JO','JP','KE','KG','KH','KI','KM','KN','KR','KW','KZ','LA','LB','LC','LI','LK','LR','LS','LT','LU','LV','LY','MA','MC','MD','ME','MG','MH','MK','ML','MN','MO','MR','MT','MU','MV','MW','MX','MY','MZ','NA','NE','NG','NI','NL','NO','NP','NR','NZ','OM','PA','PE','PG','PH','PK','PL','PS','PT','PW','PY','QA','RO','RS','RW','SA','SB','SC','SE','SG','SI','SK','SL','SM','SN','SR','ST','SV','SZ','TD','TG','TH','TJ','TL','TM','TN','TO','TR','TT','TV','TZ','UA','UG','US','UY','UZ','VC','VE','VN','VU','WS','XK','ZA','ZM','ZW'])

function resolveMarket() {
  const lang = navigator.language || ''
  const tag = lang.split('-')[1]?.toUpperCase()
  if (tag && VALID_MARKETS.has(tag)) return tag
  const primary = lang.split('-')[0]?.toLowerCase()
  const fallbacks = { es: 'MX', pt: 'BR', fr: 'FR', de: 'DE', ja: 'JP', ko: 'KR', zh: 'TW' }
  return fallbacks[primary] || 'US'
}

function formatFollowers(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M oyentes`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K oyentes`
  return `${n} oyentes`
}

export default function ArtistPanel({ artist, becauseLiked, onClose, onLikeTrack, onTakeoverAudio, accentColor = '#93f57b' }) {
  const [topTracks, setTopTracks] = useState([])
  const [relatedArtists, setRelatedArtists] = useState([])
  const [artistDetail, setArtistDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [playingId, setPlayingId] = useState(null)
  const [likedIds, setLikedIds] = useState(new Set())
  const [history, setHistory] = useState([])
  const [currentArtist, setCurrentArtist] = useState(artist)
  const audioRef = useRef(null)

  const loadArtist = useCallback(async (a) => {
    setLoading(true)
    if (audioRef.current) { stopAudio(audioRef.current); audioRef.current = null }
    setPlayingId(null)
    setArtistDetail(null)
    try {
      const [detailResult, tracksResult, relatedResult] = await Promise.allSettled([
        getArtist(a.id),
        getArtistTopTracks(a.id, resolveMarket(), a.name),
        getRelatedArtists(a.id),
      ])
      if (detailResult.status === 'fulfilled') setArtistDetail(detailResult.value)
      if (tracksResult.status === 'fulfilled') setTopTracks(tracksResult.value.tracks || [])
      if (relatedResult.status === 'fulfilled') setRelatedArtists(relatedResult.value.artists || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { setCurrentArtist(artist); setHistory([]); loadArtist(artist) }, [artist.id])
  useEffect(() => { return () => { if (audioRef.current) { stopAudio(audioRef.current); audioRef.current = null } } }, [])

  const navigateTo = (related) => { setHistory((h) => [...h, currentArtist]); setCurrentArtist(related); loadArtist(related) }
  const navigateBack = () => {
    const prev = history[history.length - 1]
    if (prev) { setHistory((h) => h.slice(0, -1)); setCurrentArtist(prev); loadArtist(prev) }
  }

  const togglePlay = (track) => {
    if (!track.preview_url) return
    if (playingId === track.id) {
      if (audioRef.current) { stopAudio(audioRef.current); audioRef.current = null }
      setPlayingId(null)
      return
    }
    if (onTakeoverAudio) onTakeoverAudio()
    audioRef.current = playAudio(track.preview_url, () => setPlayingId(null), () => setPlayingId(null))
    setPlayingId(track.id)
  }

  const toggleLike = (trackId) => {
    setLikedIds((prev) => { const next = new Set(prev); if (next.has(trackId)) next.delete(trackId); else next.add(trackId); return next })
    if (onLikeTrack) onLikeTrack(trackId)
  }

  return (
    <motion.div
      initial={{ x: '100%' }}
      animate={{ x: 0 }}
      exit={{ x: '100%' }}
      transition={{ type: 'spring', stiffness: 100, damping: 24 }}
      className="fixed top-0 right-0 h-full w-full sm:max-w-sm bg-zinc-950 border-l border-zinc-800 z-50 flex flex-col overflow-y-auto shadow-[-4px_0px_32px_rgba(0,0,0,0.5)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 sticky top-0 bg-zinc-950/95 backdrop-blur-sm z-10">
        <div className="flex items-center gap-3">
          {history.length > 0 && (
            <button onClick={navigateBack} className="text-zinc-400 hover:text-zinc-100 transition-colors rounded-full hover:bg-zinc-800 p-1">
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
          )}
          <div>
            <h2 className="text-zinc-100 font-bold tracking-tight text-base leading-tight">{currentArtist.name}</h2>
            {becauseLiked && history.length === 0 && (
              <p className="text-zinc-500 text-[10px] mt-0.5 uppercase tracking-wider">
                Porque te gustó: <span className="text-primary font-bold">{becauseLiked}</span>
              </p>
            )}
          </div>
        </div>
        <button onClick={onClose} className="text-zinc-400 hover:text-zinc-100 transition-colors rounded-full hover:bg-zinc-800 p-1">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <WaveformBars playing={true} color={accentColor} />
        </div>
      ) : (
        <>
          {/* Artist image or placeholder */}
          <div className="relative w-full aspect-square overflow-hidden bg-zinc-900">
            {artistDetail?.image_url
              ? <img src={artistDetail.image_url} alt={currentArtist.name} className="w-full h-full object-cover" />
              : (
                <div className="w-full h-full flex items-center justify-center">
                  <span className="font-display italic text-zinc-700 text-8xl select-none">
                    {currentArtist.name?.[0] ?? '?'}
                  </span>
                </div>
              )
            }
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-6">
              <h3 className="text-zinc-100 font-display italic text-2xl">{currentArtist.name}</h3>
              {artistDetail?.followers > 0 && (
                <p className="text-zinc-400 text-xs mt-1 uppercase tracking-wider">
                  {formatFollowers(artistDetail.followers)}
                  {artistDetail.popularity > 0 && ` · ${artistDetail.popularity} popularity`}
                </p>
              )}
            </div>
          </div>

          {/* Genre chips — rounded-full */}
          {artistDetail?.genres?.length > 0 && (
            <div className="px-6 pt-4 pb-2 flex flex-wrap gap-2">
              {artistDetail.genres.slice(0, 4).map((g) => (
                <span key={g} className="text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-full border border-zinc-700 bg-zinc-800 text-zinc-400">
                  {g}
                </span>
              ))}
            </div>
          )}

          {/* Top tracks */}
          <div className="px-6 pt-4 pb-2">
            <p className="label-caps text-zinc-500 mb-3">Canciones principales</p>
            <div className="space-y-2">
              {topTracks.map((track) => {
                const isPlaying = playingId === track.id
                const isLiked = likedIds.has(track.id)
                const hasPreview = Boolean(track.preview_url)
                return (
                  <div
                    key={track.id}
                    className={`group flex items-center gap-3 p-3 rounded-2xl border transition-all
                      ${hasPreview ? 'cursor-pointer' : 'cursor-default'}
                      ${isPlaying ? 'bg-zinc-800 border-white/30 shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)]' : 'bg-zinc-900 border-white/[0.08] hover:bg-zinc-800 hover:border-white/20'}`}
                    onClick={() => togglePlay(track)}
                  >
                    {track.image_url
                      ? <img src={track.image_url} alt="" className={`w-10 h-10 object-cover shrink-0 rounded-lg transition-all duration-500 ${isPlaying ? 'grayscale-0 opacity-100 scale-105' : 'grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-100'}`} />
                      : <div className="w-10 h-10 bg-zinc-800 rounded-lg shrink-0 flex items-center justify-center"><span className="material-symbols-outlined text-zinc-500 text-sm">music_note</span></div>
                    }
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isPlaying ? 'text-white' : 'text-zinc-100'}`}>{track.name}</p>
                      <p className="text-zinc-400 text-xs truncate">{track.artists?.[0]?.name}{track.release_year ? ` · ${track.release_year}` : ''}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {isPlaying && <WaveformBars playing={true} color={accentColor} />}
                      {!hasPreview && <span className="material-symbols-outlined text-zinc-300 text-sm">volume_off</span>}
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleLike(track.id) }}
                        className="transition-colors"
                        style={{ color: isLiked ? '#93f57b' : '#d4d0c8' }}
                      >
                        <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: isLiked ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" : undefined }}>favorite</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Related artists — chips rounded-full */}
          {relatedArtists.length > 0 && (
            <div className="px-6 py-4">
              <p className="label-caps text-zinc-500 mb-3">Artistas relacionados</p>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {relatedArtists.map((a) => (
                  <button
                    key={a.id}
                    onClick={() => navigateTo(a)}
                    className="group/chip shrink-0 flex flex-col items-center gap-2 px-3 py-3 rounded-2xl border border-zinc-800 bg-zinc-900 hover:border-zinc-600 hover:bg-zinc-800 transition-all min-w-[68px]"
                  >
                    {a.image_url
                      ? <img src={a.image_url} alt={a.name} className="w-10 h-10 object-cover rounded-full grayscale opacity-60 group-hover/chip:grayscale-0 group-hover/chip:opacity-100 transition-all duration-300" />
                      : <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center"><span className="material-symbols-outlined text-zinc-500 text-sm">person</span></div>
                    }
                    <span className="text-zinc-400 text-[9px] uppercase tracking-wider text-center w-full truncate">{a.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Add liked to playlist */}
          {likedIds.size > 0 && (
            <div className="px-6 pb-8 mt-2">
              <button className="btn-filled w-full flex items-center justify-center gap-2">
                <span className="material-symbols-outlined text-sm">playlist_add</span>
                Agregar {likedIds.size} guardadas a playlist
              </button>
            </div>
          )}
        </>
      )}
    </motion.div>
  )
}
