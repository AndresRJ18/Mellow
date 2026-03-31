import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from '../context/SessionContext'
import MoodShareModal from './MoodShareModal'

export default function LikedPanel({ likedTracks, onRemove, onClose }) {
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const { analyzeResult } = useSession()
  const mood_label = analyzeResult?.mood_label
  const lectura = analyzeResult?.lectura
  const paleta = analyzeResult?.paleta || ['#8eff71', '#0a0a0a', '#1a1919']

  return (
    <>
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 100, damping: 24 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-zinc-950 rounded-t-3xl border-t border-zinc-800 shadow-[0_-4px_24px_rgba(0,0,0,0.5)] flex flex-col"
        style={{ maxHeight: '82vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 shrink-0">
          <div className="flex items-center gap-3">
            <span
              className="material-symbols-outlined text-primary text-xl"
              style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
            >
              favorite
            </span>
            <div>
              <h2 className="text-zinc-100 font-bold text-sm leading-tight">Canciones guardadas</h2>
              <p className="text-zinc-400 text-[10px] uppercase tracking-wider mt-0.5">
                {likedTracks.length} canción{likedTracks.length !== 1 ? 'es' : ''}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-100 transition-colors rounded-full hover:bg-zinc-800 p-1">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        {/* Track list */}
        <div className="flex-1 overflow-y-auto px-4 py-2">
          {likedTracks.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 gap-2 text-zinc-600">
              <span className="material-symbols-outlined text-4xl">favorite_border</span>
              <p className="text-[10px] uppercase tracking-widest text-center">Dale like a canciones para agregarlas aquí</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {likedTracks.map((track) => (
                <div key={track.id} className="group flex items-center gap-3 px-4 py-3 bg-zinc-900 rounded-2xl border border-white/[0.08] hover:bg-zinc-800 hover:border-white/20 transition-all">
                  {track.image_url
                    ? <img src={track.image_url} alt="" className="w-10 h-10 object-cover shrink-0 rounded-lg grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300" />
                    : <div className="w-10 h-10 bg-zinc-800 shrink-0 rounded-lg flex items-center justify-center"><span className="material-symbols-outlined text-zinc-500 text-sm">music_note</span></div>
                  }
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate text-zinc-100">{track.name}</p>
                    <p className="text-zinc-400 text-xs truncate mt-0.5">
                      {track.artists?.[0]?.name}{track.release_year ? ` · ${track.release_year}` : ''}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {track.spotify_url && (
                      <a
                        href={track.spotify_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-zinc-500 hover:text-[#1DB954] transition-colors rounded-full hover:bg-zinc-700 p-1.5"
                        title="Abrir en Spotify"
                      >
                        <span className="material-symbols-outlined text-base">open_in_new</span>
                      </a>
                    )}
                    <button onClick={() => onRemove(track.id)} className="text-zinc-500 hover:text-error transition-colors rounded-full hover:bg-zinc-800 p-1.5">
                      <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-5 border-t border-zinc-800 shrink-0">
          <p className="text-zinc-500 text-[10px] uppercase tracking-wider mb-3">
            Comparte tu estado de ánimo
          </p>
          <button
            onClick={() => setShareModalOpen(true)}
            disabled={!mood_label}
            className={`btn-filled w-full flex items-center justify-center gap-2 ${!mood_label ? 'opacity-30 cursor-not-allowed shadow-none' : ''}`}
          >
            <span className="material-symbols-outlined text-sm">ios_share</span>
            Compartir mood
          </button>
        </div>
      </motion.div>

      <AnimatePresence>
        {shareModalOpen && (
          <MoodShareModal
            mood_label={mood_label}
            lectura={lectura}
            paleta={paleta}
            likedTracks={likedTracks}
            onClose={() => setShareModalOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
