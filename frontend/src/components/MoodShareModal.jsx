import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { toPng } from 'html-to-image'
import MoodShareCard from './MoodShareCard'

const canNativeShare = typeof navigator.share === 'function'

export default function MoodShareModal({ mood_label, lectura, paleta, likedTracks, onClose }) {
  const cardRef = useRef(null)
  const [capturing, setCapturing] = useState(false)

  const capture = async () => {
    setCapturing(true)
    try {
      const dataUrl = await toPng(cardRef.current, {
        width: 360,
        height: 640,
        pixelRatio: 2,
        style: { transform: 'none' },
      })
      return dataUrl
    } finally {
      setCapturing(false)
    }
  }

  const handleDownload = async () => {
    const dataUrl = await capture()
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `mellow-${(mood_label || 'mood').toLowerCase().replace(/\s+/g, '-')}.png`
    a.click()
  }

  const handleShare = async () => {
    const dataUrl = await capture()
    try {
      const blob = await (await fetch(dataUrl)).blob()
      const file = new File([blob], `mellow-${mood_label}.png`, { type: 'image/png' })
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Mi mood: ${mood_label}`,
          text: `Estoy escuchando ${mood_label} en mellow`,
        })
      } else {
        handleDownload()
      }
    } catch (err) {
      if (err.name !== 'AbortError') console.error(err)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex flex-col items-center justify-end sm:justify-center">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 120, damping: 20 }}
        className="relative z-[61] w-full sm:w-auto bg-zinc-950 rounded-t-3xl sm:rounded-3xl border border-zinc-800 shadow-2xl flex flex-col items-center pb-8 pt-6 px-6 gap-5"
      >
        {/* Drag handle */}
        <div className="w-10 h-1 rounded-full bg-zinc-700 sm:hidden -mt-2 mb-1" />

        <p className="label-caps text-zinc-500 self-start">Tu tarjeta de mood</p>

        {/* Card preview — scaled down visually, full size for capture */}
        <div style={{ transform: 'scale(0.82)', transformOrigin: 'top center', height: '525px', width: '360px' }}>
          <MoodShareCard
            ref={cardRef}
            mood_label={mood_label}
            lectura={lectura}
            paleta={paleta}
            likedTracks={likedTracks}
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 w-full">
          <button
            onClick={handleDownload}
            disabled={capturing}
            className="flex-1 flex items-center justify-center gap-2 rounded-full px-6 py-3.5 text-xs font-black uppercase tracking-[0.15em] border border-zinc-700 text-zinc-300 hover:bg-zinc-800 transition-all disabled:opacity-40"
          >
            {capturing ? (
              <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-sm">download</span>
            )}
            Descargar
          </button>

          {canNativeShare && (
            <button
              onClick={handleShare}
              disabled={capturing}
              className="flex-1 btn-filled flex items-center justify-center gap-2 disabled:opacity-40 disabled:shadow-none disabled:cursor-not-allowed"
            >
              {capturing ? (
                <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-sm">ios_share</span>
              )}
              Compartir
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
