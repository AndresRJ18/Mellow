import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from '../context/SessionContext'
import { analyze } from '../api/client'
import { supabase } from '../lib/supabase'

const MESSAGES = [
  { icon: 'terminal', text: 'Conectando con secure_node_alpha...' },
  { icon: 'check_circle', text: 'Autenticación completada.' },
  { icon: 'sync', text: 'Analizando señal emocional...' },
  { icon: 'psychology', text: 'Generando perfil de estado...' },
  { icon: 'queue_music', text: 'Sincronizando metadatos artísticos...' },
]

export default function Loading() {
  const navigate = useNavigate()
  const { emotionalText, musicTasteText, sliderTempo, sliderLyrics, sliderFamiliarity, initFromAnalyze } = useSession()

  const [visibleMessages, setVisibleMessages] = useState([])
  const [typewriterText, setTypewriterText] = useState('')
  const [error, setError] = useState(null)
  const hasCalled = useRef(false)

  useEffect(() => {
    if (visibleMessages.length === 0) return
    const msg = MESSAGES[visibleMessages.length - 1]?.text || ''
    let i = 0
    setTypewriterText('')
    const id = setInterval(() => {
      i++
      setTypewriterText(msg.slice(0, i))
      if (i >= msg.length) clearInterval(id)
    }, 30)
    return () => clearInterval(id)
  }, [visibleMessages.length])

  useEffect(() => {
    if (hasCalled.current) return
    hasCalled.current = true

    if (!emotionalText || emotionalText.trim().split(/\s+/).length < 5) {
      navigate('/onboarding')
      return
    }

    const showMessages = async () => {
      for (let i = 0; i < MESSAGES.length - 1; i++) {
        await delay(600)
        setVisibleMessages((p) => [...p, i])
      }
      try {
        const result = await analyze({
          emotional_text: emotionalText,
          music_taste_text: musicTasteText || null,
          slider_tempo: sliderTempo,
          slider_lyrics: sliderLyrics,
          slider_familiarity: sliderFamiliarity,
        })
        await delay(400)
        setVisibleMessages((p) => [...p, MESSAGES.length - 1])
        await delay(1000)
        initFromAnalyze(result)
        supabase.auth.getUser().then(({ data: { user } }) => {
          if (user) {
            supabase.from('mood_sessions').insert({
              user_id: user.id,
              mood_label: result.mood_label,
              lectura: result.lectura,
              paleta: result.paleta || [],
              emotional_text: emotionalText,
            })
          }
        })
        navigate('/results')
      } catch (err) {
        setError(err.message || 'Something went wrong. Please try again.')
      }
    }
    showMessages()
  }, [])

  return (
    <div className="min-h-screen bg-zinc-950 relative overflow-hidden flex flex-col items-center justify-center">

      {/* Blob decorativo fondo */}
      <svg
        className="absolute bottom-[-60px] left-[-60px] w-[300px] h-[300px] opacity-20 pointer-events-none"
        viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
      >
        <path fill="#93f57b" d="M38.9,-48.2C52.5,-37.3,67.1,-26.4,70.3,-12.4C73.5,1.6,65.4,18.6,55.1,32.1C44.8,45.6,32.4,55.6,17.8,61.2C3.2,66.7,-13.7,67.8,-27.9,61.8C-42.1,55.7,-53.5,42.5,-60.3,27.1C-67.1,11.7,-69.2,-5.9,-63.6,-20.6C-58,-35.3,-44.6,-47,-30.6,-57.8C-16.5,-68.7,-1.9,-78.6,11.2,-77.2C24.3,-75.8,25.3,-59.1,38.9,-48.2Z" transform="translate(100 100)" />
      </svg>

      <main className="relative z-10 w-full max-w-sm px-6 flex flex-col items-center">
        {/* Branding */}
        <motion.div
          initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 80, damping: 20 }}
          className="mb-12 text-center"
        >
          <h1 className="font-display italic text-zinc-100 text-4xl mb-1">mellow</h1>
          <p className="text-[0.6rem] font-bold text-zinc-600 uppercase tracking-[0.25em]">
            Procesando tu estado
          </p>
        </motion.div>

        {error ? (
          <div className="text-center space-y-4">
            <span className="material-symbols-outlined text-error text-4xl">error</span>
            <p className="text-error text-sm font-mono">{error}</p>
            <button onClick={() => navigate('/onboarding')} className="border-2 border-zinc-600 text-zinc-100 rounded-full px-8 py-3 text-xs font-black uppercase tracking-widest transition-all hover:border-zinc-400 hover:bg-zinc-800 mt-4">
              Intentar de nuevo
            </button>
          </div>
        ) : (
          /* Panel blanco redondeado — sin glass, sin glow */
          <div className="w-full bg-zinc-900 rounded-3xl border border-zinc-800 px-8 py-7">
            <div className="flex flex-col space-y-4 font-mono">
              <AnimatePresence>
                {MESSAGES.map((msg, i) => {
                  const visible = visibleMessages.includes(i)
                  const isLast = i === visibleMessages.length - 1
                  if (!visible) return null
                  const done = i < visibleMessages.length - 1
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                      transition={{ type: 'spring', stiffness: 120, damping: 20 }}
                      className="flex items-start gap-3"
                    >
                      <span className={`shrink-0 mt-0.5 ${done ? 'text-zinc-700' : 'text-primary'}`}>
                        <span className="material-symbols-outlined !text-[14px]">{msg.icon}</span>
                      </span>
                      <p className={`text-sm tracking-tight ${done ? 'text-zinc-600' : 'text-zinc-300'}`}>
                        {isLast ? (
                          <>
                            {typewriterText}
                            <span className="animate-cursor border-r border-zinc-300 ml-0.5">&nbsp;</span>
                          </>
                        ) : msg.text}
                      </p>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

function delay(ms) { return new Promise((r) => setTimeout(r, ms)) }
