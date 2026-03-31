import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useSession } from '../context/SessionContext'
import { useAuth } from '../context/AuthContext'

// Nota UX: UserMenu eliminado del onboarding — auth solo en Landing y Results

const PLACEHOLDERS_1 = [
  "son las 2am y acabo de terminar algo difícil...",
  "me siento inquieto, no puedo quedarme quieto...",
  "domingo por la tarde, sin ningún plan...",
  "ansioso pero esperanzado, como antes de algo grande...",
  "agotado pero mi mente no para...",
]

const TEMPO_EMOJIS = ['🐢', '🚶', '🚴', '🏃', '⚡']
const LYRICS_EMOJIS = ['🎤', '🎤', '🎸', '🎹', '🎹']
const FAMILIAR_EMOJIS = ['❤️', '❤️', '🔀', '🔮', '🔮']

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? 50 : -50, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir) => ({ x: dir > 0 ? -50 : 50, opacity: 0 }),
}

const spring = { type: 'spring', stiffness: 90, damping: 22 }

const QUESTIONS = (name) => [
  [`¿Cómo estás`, `ahora mismo, ${name}?`],
  [`¿Qué sientes`, `en este momento, ${name}?`],
  [`¿Cómo llega`, `el día para ti, ${name}?`],
]

export default function Onboarding() {
  const navigate = useNavigate()
  const {
    emotionalText, setEmotionalText,
    musicTasteText, setMusicTasteText,
    sliderTempo, setSliderTempo,
    sliderLyrics, setSliderLyrics,
    sliderFamiliarity, setSliderFamiliarity,
  } = useSession()
  const { user } = useAuth()

  const firstName = user?.user_metadata?.full_name?.split(' ')[0]
                 ?? user?.user_metadata?.name?.split(' ')[0]
                 ?? null

  const [step, setStep] = useState(1)
  const [direction, setDirection] = useState(1)
  const [error, setError] = useState('')
  const [placeholderIdx, setPlaceholderIdx] = useState(0)
  const [questionIdx, setQuestionIdx] = useState(0)
  const textareaRef = useRef(null)

  useEffect(() => {
    const id = setInterval(() => setPlaceholderIdx((i) => (i + 1) % PLACEHOLDERS_1.length), 3000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    if (!firstName) return
    const id = setInterval(() => setQuestionIdx((i) => (i + 1) % 3), 10000)
    return () => clearInterval(id)
  }, [firstName])

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        if (step === 1) { e.preventDefault(); goNext() }
        if (step === 2) { e.preventDefault(); goNext() }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [step, emotionalText])

  const goNext = () => {
    if (step === 1) {
      const words = emotionalText.trim().split(/\s+/).filter(Boolean)
      if (words.length < 5) { setError('Cuéntame un poco más — al menos 5 palabras.'); return }
      setError('')
    }
    setDirection(1)
    setStep((s) => s + 1)
  }

  const goBack = () => { setDirection(-1); setStep((s) => s - 1) }
  const handleStart = () => navigate('/loading')

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 overflow-hidden relative">

      {/* Blob decorativo esquina superior derecha */}
      <svg
        className="absolute top-[-40px] right-[-40px] w-[280px] h-[280px] opacity-25 pointer-events-none"
        viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
      >
        <path fill="#93f57b" d="M47.6,-61.3C59.3,-50.6,64.8,-33.3,67.2,-16.2C69.5,0.9,68.7,17.8,61.4,31.1C54.1,44.3,40.3,53.9,25.2,59.8C10.1,65.7,-6.3,67.9,-22.4,63.4C-38.6,58.9,-54.5,47.7,-63.3,32.5C-72.1,17.3,-73.7,-1.9,-68.2,-18.5C-62.8,-35.1,-50.3,-49.1,-36.3,-59.3C-22.3,-69.5,-6.9,-75.9,8.4,-74.2C23.7,-72.5,35.9,-71.9,47.6,-61.3Z" transform="translate(100 100)" />
      </svg>

      <main className="relative z-10 min-h-screen flex flex-col max-w-5xl mx-auto px-6 lg:px-24">

        {/* Top bar */}
        <header className="w-full pt-8 pb-6 flex items-center justify-between">
          <div
            className="font-display italic text-zinc-100 text-2xl cursor-pointer hover:text-primary transition-colors"
            onClick={() => navigate('/')}
          >
            mellow
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2 items-center">
              {[1, 2, 3].map((s) => (
                <motion.div
                  key={s}
                  animate={{ width: s === step ? 28 : 8, opacity: s <= step ? 1 : 0.2 }}
                  transition={spring}
                  className={`h-[3px] rounded-full ${s <= step ? 'bg-zinc-100' : 'bg-zinc-700'}`}
                />
              ))}
            </div>
            <span className="label-caps text-zinc-500">
              {step === 1 ? 'Percepción' : step === 2 ? 'Universo' : 'Calibración'}
            </span>
          </div>
        </header>

        {/* Animated step content */}
        <section className="flex-grow flex flex-col justify-center">
          <AnimatePresence mode="wait" custom={direction}>
            {step === 1 && (
              <motion.div
                key="step1"
                custom={direction}
                variants={slideVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ type: 'spring', stiffness: 100, damping: 24 }}
                className="max-w-4xl"
              >
                <h1 className="font-display italic text-zinc-100 text-5xl md:text-7xl lg:text-8xl leading-[0.95] mb-10">
                  {firstName ? (
                    <AnimatePresence mode="wait">
                      <motion.span
                        key={questionIdx}
                        initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.35 }}
                        className="block"
                      >
                        {QUESTIONS(firstName)[questionIdx][0]}<br />
                        {/* Segunda línea sans-serif para contraste tipográfico */}
                        <span className="not-italic font-sans font-light text-zinc-500 text-3xl md:text-5xl lg:text-6xl">
                          {QUESTIONS(firstName)[questionIdx][1]}
                        </span>
                      </motion.span>
                    </AnimatePresence>
                  ) : (
                    <>
                      ¿Cómo estás<br />
                      <span className="not-italic font-sans font-light text-zinc-500 text-3xl md:text-5xl lg:text-6xl">ahora mismo?</span>
                    </>
                  )}
                </h1>

                {/* Input como zona de escritura — no formulario */}
                <div className="relative w-full group">
                  <textarea
                    ref={textareaRef}
                    value={emotionalText}
                    onChange={(e) => { setEmotionalText(e.target.value); setError('') }}
                    placeholder={PLACEHOLDERS_1[placeholderIdx]}
                    className="w-full border border-zinc-300 rounded-3xl bg-[#FAF9F6] px-7 py-6 text-xl md:text-2xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-500 transition-all duration-300 resize-none min-h-[140px] font-sans font-normal"
                    autoFocus
                  />
                </div>

                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
                    className="text-error text-xs uppercase tracking-widest mt-3 font-bold px-2"
                  >
                    {error}
                  </motion.p>
                )}
                <div className="mt-4 flex items-center gap-2 px-2">
                  <span className="material-symbols-outlined text-zinc-600 text-sm">info</span>
                  <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest">
                    No pienses. Solo escribe la energía de tu estado actual.
                  </p>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                custom={direction}
                variants={slideVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ type: 'spring', stiffness: 100, damping: 24 }}
                className="max-w-4xl"
              >
                <h1 className="font-display italic text-zinc-100 text-5xl md:text-7xl lg:text-8xl leading-[0.95] mb-10">
                  ¿Qué música<br />
                  <span className="not-italic font-sans font-light text-zinc-500 text-3xl md:text-5xl lg:text-6xl">es tuya?</span>
                </h1>
                <input
                  type="text"
                  value={musicTasteText}
                  onChange={(e) => setMusicTasteText(e.target.value)}
                  placeholder="kpop, lo-fi, 80s classics, reggaeton, anime OSTs..."
                  className="w-full border border-zinc-300 rounded-3xl bg-[#FAF9F6] px-7 py-6 text-xl md:text-2xl text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:border-zinc-500 transition-all duration-300 font-sans font-normal"
                  autoFocus
                />
                <div className="mt-4 flex items-center gap-2 px-2">
                  <span className="material-symbols-outlined text-zinc-600 text-sm">explore</span>
                  <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest">
                    Opcional — sáltala y deja que Mellow te sorprenda.
                  </p>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                custom={direction}
                variants={slideVariants}
                initial="enter" animate="center" exit="exit"
                transition={{ type: 'spring', stiffness: 100, damping: 24 }}
                className="max-w-4xl w-full"
              >
                <h1 className="font-display italic text-zinc-100 text-5xl md:text-7xl leading-[0.95] mb-14">
                  Ajusta<br />
                  <span className="not-italic font-sans font-light text-zinc-500 text-3xl md:text-5xl">el mood.</span>
                </h1>
                <div className="space-y-10 max-w-xl">
                  <SliderRow label="Tempo" leftLabel="lento" rightLabel="rápido" value={sliderTempo} onChange={setSliderTempo} />
                  <SliderRow label="Estilo" leftLabel="letras" rightLabel="instrumental" value={sliderLyrics} onChange={setSliderLyrics} />
                  <SliderRow label="Descubrimiento" leftLabel="conocida" rightLabel="nueva" value={sliderFamiliarity} onChange={setSliderFamiliarity} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* Footer navigation */}
        <footer className="w-full py-10 flex justify-end items-end">
          <div className="flex flex-col items-end gap-3 w-full lg:w-auto">
            <div className="flex gap-3 w-full lg:w-auto">
              {step > 1 && (
                <button
                  onClick={goBack}
                  className="shrink-0 rounded-full border-2 border-zinc-600 text-zinc-100 bg-transparent px-4 sm:px-8 py-4 text-xs font-black uppercase tracking-[0.15em] hover:bg-zinc-800 transition-all"
                >
                  <span className="sm:hidden">←</span>
                  <span className="hidden sm:inline">← Atrás</span>
                </button>
              )}
              {step === 2 && (
                <button
                  onClick={goNext}
                  className="shrink-0 rounded-full border-2 border-zinc-600 text-zinc-100 bg-transparent text-xs font-black uppercase tracking-[0.15em] px-4 sm:px-8 py-4 hover:bg-zinc-800 transition-all"
                >
                  <span className="sm:hidden">✦</span>
                  <span className="hidden sm:inline">Sorpréndeme</span>
                </button>
              )}
              {step < 3 ? (
                <button
                  onClick={goNext}
                  className="btn-filled flex-1 lg:flex-none flex items-center justify-center gap-3"
                >
                  Siguiente →
                </button>
              ) : (
                <button
                  onClick={handleStart}
                  className="btn-filled flex-1 lg:flex-none flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">bolt</span>
                  Buscar mi música
                </button>
              )}
            </div>
            {step < 3 && (
              <span className="label-caps text-zinc-600">
                Presiona Enter para continuar
              </span>
            )}
          </div>
        </footer>
      </main>
    </div>
  )
}

function SliderRow({ label, leftLabel, rightLabel, value, onChange }) {
  return (
    <div>
      <div className="flex justify-between items-center mb-3">
        <span className="label-caps text-zinc-500">{label}</span>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-zinc-500 text-[10px] sm:text-xs uppercase tracking-wider w-14 sm:w-20 text-right shrink-0">{leftLabel}</span>
        <input type="range" min="1" max="5" value={value} onChange={(e) => onChange(Number(e.target.value))} className="flex-1 min-w-0" />
        <span className="text-zinc-500 text-[10px] sm:text-xs uppercase tracking-wider w-14 sm:w-20 shrink-0">{rightLabel}</span>
      </div>
    </div>
  )
}
