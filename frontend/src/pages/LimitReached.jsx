import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'

const spring = { type: 'spring', stiffness: 80, damping: 22 }

export default function LimitReached() {
  const navigate = useNavigate()

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center px-6 text-center relative overflow-hidden">

      {/* Blob decorativo */}
      <svg
        className="absolute top-[-80px] left-[-80px] w-[320px] h-[320px] opacity-20 pointer-events-none"
        viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
      >
        <path fill="#93f57b" d="M47.6,-61.3C59.3,-50.6,64.8,-33.3,67.2,-16.2C69.5,0.9,68.7,17.8,61.4,31.1C54.1,44.3,40.3,53.9,25.2,59.8C10.1,65.7,-6.3,67.9,-22.4,63.4C-38.6,58.9,-54.5,47.7,-63.3,32.5C-72.1,17.3,-73.7,-1.9,-68.2,-18.5C-62.8,-35.1,-50.3,-49.1,-36.3,-59.3C-22.3,-69.5,-6.9,-75.9,8.4,-74.2C23.7,-72.5,35.9,-71.9,47.6,-61.3Z" transform="translate(100 100)" />
      </svg>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ ...spring, delay: 0.1 }}
        className="relative z-10 max-w-sm flex flex-col items-center gap-6"
      >
        <h1 className="font-display italic text-zinc-100 text-5xl tracking-tight">mellow</h1>

        <span className="material-symbols-outlined text-primary text-5xl">bedtime</span>

        <div className="space-y-2">
          <h2 className="text-zinc-100 text-xl font-bold">Ya usaste tus 5 búsquedas de hoy</h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Vuelve mañana para seguir descubriendo música que va contigo.
          </p>
        </div>

        <button
          onClick={() => navigate('/')}
          className="mt-2 px-10 py-3 rounded-full border-2 border-zinc-700 text-zinc-300 text-sm font-black uppercase tracking-[0.12em] transition-all duration-200 hover:border-zinc-400 hover:text-zinc-100 active:scale-95"
        >
          Volver al inicio
        </button>
      </motion.div>
    </div>
  )
}
