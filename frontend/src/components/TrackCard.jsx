import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import WaveformBars from './WaveformBars'
import { playAudio, stopAudio } from '../utils/audioManager'

export default function TrackCard({
  track,
  index,
  isPlaying,
  isLiked,
  onPlay,
  onClearPlay,
  onLike,
  onExplore,
  accentColor = '#93f57b',
}) {
  const audioRef = useRef(null)

  useEffect(() => {
    if (isPlaying && track.preview_url) {
      audioRef.current = playAudio(track.preview_url, null, onClearPlay)
    } else {
      if (audioRef.current) { stopAudio(audioRef.current); audioRef.current = null }
    }
  }, [isPlaying, track.preview_url])

  useEffect(() => {
    return () => { if (audioRef.current) { stopAudio(audioRef.current); audioRef.current = null } }
  }, [])

  const artistName = track.artists?.[0]?.name || 'Unknown Artist'
  const hasPreview = Boolean(track.preview_url)

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      /* spring escalonado — cada card cae con su propio tiempo */
      transition={{ type: 'spring', stiffness: 90, damping: 20, delay: index * 0.05 }}
      className={`group flex items-center p-4 bg-zinc-900 rounded-2xl border cursor-pointer
        transition-all duration-200
        ${isPlaying
          ? 'border-white/30 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.3)]'
          : 'border-white/[0.08] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] hover:bg-zinc-800 hover:shadow-[3px_3px_0px_0px_rgba(0,0,0,0.4)] hover:border-white/20'
        }`}
      onClick={() => hasPreview && onPlay(track.id)}
    >
      {/* Album art */}
      {track.image_url ? (
        <img
          src={track.image_url}
          alt={track.album_name}
          className={`w-12 h-12 object-cover shrink-0 rounded-lg transition-all duration-400
            ${isPlaying ? 'grayscale-0 opacity-100' : 'grayscale opacity-50 group-hover:grayscale-0 group-hover:opacity-80'}`}
        />
      ) : (
        <div className="w-12 h-12 bg-zinc-800 rounded-lg flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-zinc-500 text-xl">music_note</span>
        </div>
      )}

      {/* Track info */}
      <div className="flex-1 ml-4 min-w-0">
        <h3 className={`font-medium text-sm truncate tracking-wide ${isPlaying ? 'text-white' : 'text-zinc-100'}`}>
          {track.name}
        </h3>
        <p className="text-zinc-400 text-xs tracking-wide mt-0.5 truncate">
          {artistName}{track.release_year ? ` · ${track.release_year}` : ''}
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1 ml-2 shrink-0">
        <div className="hidden sm:flex mr-1">
          {hasPreview
            ? <WaveformBars playing={isPlaying} color={isPlaying ? accentColor : '#d4d0c8'} />
            : <span className="material-symbols-outlined text-zinc-300 text-sm">volume_off</span>
          }
        </div>

        {/* Explore artist */}
        <button
          onClick={(e) => { e.stopPropagation(); onExplore(track.artists?.[0]) }}
          className="text-zinc-500 hover:text-zinc-200 transition-colors p-2 rounded-full hover:bg-zinc-700/50"
          title="Explorar artista"
        >
          <span className="material-symbols-outlined text-xl">person_search</span>
        </button>

        {/* Like — scale pop en 150ms */}
        <motion.button
          onClick={(e) => { e.stopPropagation(); onLike(track.id) }}
          animate={isLiked ? { scale: [1, 1.35, 1] } : { scale: 1 }}
          transition={{ duration: 0.15 }}
          className="transition-colors p-2 rounded-full hover:bg-zinc-700/50"
          style={{ color: isLiked ? accentColor : '#d4d0c8' }}
        >
          <span
            className="material-symbols-outlined text-xl"
            style={{ fontVariationSettings: isLiked ? "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" : undefined }}
          >
            favorite
          </span>
        </motion.button>
      </div>
    </motion.div>
  )
}
