import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import UserMenu from '../components/UserMenu'
import imagen1 from '../img/imagen1.png'

const spring = { type: 'spring', stiffness: 80, damping: 22 }

export default function Landing() {
  const navigate = useNavigate()
  const { user, loading, signInWithGoogle } = useAuth()

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 relative overflow-hidden">

      {/* Blob orgánico superior-izquierda — acento verde pastel */}
      <svg
        className="absolute top-[-80px] left-[-80px] w-[420px] h-[420px] opacity-50 pointer-events-none"
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          fill="#93f57b"
          d="M47.6,-61.3C59.3,-50.6,64.8,-33.3,67.2,-16.2C69.5,0.9,68.7,17.8,61.4,31.1C54.1,44.3,40.3,53.9,25.2,59.8C10.1,65.7,-6.3,67.9,-22.4,63.4C-38.6,58.9,-54.5,47.7,-63.3,32.5C-72.1,17.3,-73.7,-1.9,-68.2,-18.5C-62.8,-35.1,-50.3,-49.1,-36.3,-59.3C-22.3,-69.5,-6.9,-75.9,8.4,-74.2C23.7,-72.5,35.9,-71.9,47.6,-61.3Z"
          transform="translate(100 100)"
        />
      </svg>

      {/* Blob orgánico inferior-derecha */}
      <svg
        className="absolute bottom-[-60px] right-[-60px] w-[360px] h-[360px] opacity-30 pointer-events-none"
        viewBox="0 0 200 200"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          fill="#93f57b"
          d="M38.9,-48.2C52.5,-37.3,67.1,-26.4,70.3,-12.4C73.5,1.6,65.4,18.6,55.1,32.1C44.8,45.6,32.4,55.6,17.8,61.2C3.2,66.7,-13.7,67.8,-27.9,61.8C-42.1,55.7,-53.5,42.5,-60.3,27.1C-67.1,11.7,-69.2,-5.9,-63.6,-20.6C-58,-35.3,-44.6,-47,-30.6,-57.8C-16.5,-68.7,-1.9,-78.6,11.2,-77.2C24.3,-75.8,25.3,-59.1,38.9,-48.2Z"
          transform="translate(100 100)"
        />
      </svg>

      {/* UserMenu top-right */}
      <div className="absolute top-6 right-6 z-20">
        <UserMenu />
      </div>

      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 text-center">

        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...spring, delay: 0.1 }}
          className="mb-8"
        >
          <h1 className="font-display italic text-zinc-100 text-6xl md:text-8xl tracking-tight">
            mellow
          </h1>
        </motion.div>

        {/*
          Placeholder continuous line art — reemplazar el <svg> interior
          con la ilustración real cuando esté lista.
          El blob verde detrás da profundidad sin sobrecargar.
        */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ ...spring, delay: 0.25 }}
          className="relative w-56 h-56 md:w-64 md:h-64 mx-auto mb-10"
        >
          {/* Blob de acento detrás de la ilustración */}
          <div className="absolute inset-0 rounded-full bg-primary/35 blur-2xl" />
          {/* Imagen circular */}
          <div className="relative w-full h-full rounded-full overflow-hidden border-2 border-zinc-700">
            <img
              src={imagen1}
              alt="mellow"
              className="w-full h-full object-cover"
            />
          </div>
        </motion.div>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ ...spring, delay: 0.35 }}
          className="flex flex-col gap-3 mb-12 max-w-lg"
        >
          <h2 className="font-sans text-zinc-100/80 font-light text-2xl md:text-3xl leading-snug">
            Encuentra la música que eres{' '}
            <span className="font-display italic text-zinc-100">ahora mismo</span>
          </h2>
          <p className="text-zinc-500 text-xs uppercase tracking-[0.25em] font-medium">
            No lo que escuchabas. Lo que eres.
          </p>
        </motion.div>

        {/* CTAs */}
        {!loading && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ ...spring, delay: 0.5 }}
            className="flex flex-col items-center gap-4"
          >
            {user ? (
              <button
                onClick={() => navigate('/onboarding')}
                className="btn-filled px-16"
              >
                Comenzar
              </button>
            ) : (
              <button
                onClick={signInWithGoogle}
                className="group flex items-center gap-3 px-10 py-4 bg-white rounded-full border-2 border-black text-black text-sm font-black uppercase tracking-[0.12em] transition-all duration-200 shadow-[3px_3px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-px active:scale-95 active:shadow-none"
              >
                <svg width="16" height="16" viewBox="0 0 18 18" aria-hidden="true">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332C2.438 15.983 5.482 18 9 18z"/>
                  <path fill="#FBBC05" d="M3.964 10.706c-.18-.54-.282-1.117-.282-1.706s.102-1.166.282-1.706V4.962H.957C.347 6.175 0 7.55 0 9s.348 2.825.957 4.038l3.007-2.332z"/>
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0 5.482 0 2.438 2.017.957 4.962L3.964 7.294C4.672 5.167 6.656 3.58 9 3.58z"/>
                </svg>
                Acceder con Google
              </button>
            )}
          </motion.div>
        )}
      </main>
    </div>
  )
}
