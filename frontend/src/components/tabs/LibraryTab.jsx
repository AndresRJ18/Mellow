import { useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useSession } from '../../context/SessionContext'
import MoodShareModal from '../MoodShareModal'

export default function LibraryTab({ likedTracks, onRemove }) {
  const [shareModalOpen, setShareModalOpen] = useState(false)
  const { analyzeResult } = useSession()
  const mood_label = analyzeResult?.mood_label
  const lectura = analyzeResult?.lectura
  const paleta = analyzeResult?.paleta || ['#8eff71', '#0a0a0a', '#1a1919']

  if (likedTracks.length === 0) {
    return (
      <div className="pt-16 pb-12 flex flex-col items-center justify-center gap-4 text-center">
        <span className="material-symbols-outlined text-zinc-700 text-6xl">
          favorite_border
        </span>
        <p className="text-zinc-600 text-xs uppercase tracking-widest">
          Dale like a canciones para construir tu biblioteca
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="pt-10 pb-12">
        <div className="flex items-center justify-between mb-6">
          <p className="label-caps text-zinc-500">
            {likedTracks.length} canción{likedTracks.length !== 1 ? 'es' : ''} guardada{likedTracks.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="space-y-2 mb-8">
          {likedTracks.map((track) => (
            <div
              key={track.id}
              className="group flex items-center gap-3 p-3 bg-zinc-900 rounded-2xl border border-white/[0.08] hover:bg-zinc-800 hover:border-white/20 transition-all"
            >
              {track.image_url ? (
                <img src={track.image_url} alt="" className="w-10 h-10 object-cover shrink-0 rounded-lg grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300" />
              ) : (
                <div className="w-10 h-10 bg-zinc-800 shrink-0 rounded-lg flex items-center justify-center">
                  <span className="material-symbols-outlined text-zinc-500 text-sm">music_note</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate text-zinc-100">{track.name}</p>
                <p className="text-zinc-400 text-xs truncate">
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
                <button
                  onClick={() => onRemove(track.id)}
                  className="text-zinc-500 hover:text-red-400 transition-colors shrink-0 rounded-full hover:bg-zinc-700 p-1.5"
                >
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={() => setShareModalOpen(true)}
          disabled={!mood_label}
          className={`btn-filled w-full flex items-center justify-center gap-2 ${!mood_label ? 'opacity-30 cursor-not-allowed shadow-none' : ''}`}
        >
          <span className="material-symbols-outlined text-sm">ios_share</span>
          Compartir mood
        </button>
      </div>

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
