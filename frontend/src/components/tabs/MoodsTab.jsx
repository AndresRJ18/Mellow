import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabase'

function formatDate(iso) {
  const d = new Date(iso)
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })
}

export default function MoodsTab({ moodLabel, lectura, paleta }) {
  const navigate = useNavigate()
  const { user, signInWithGoogle } = useAuth()
  const [history, setHistory] = useState([])
  const [loadingHistory, setLoadingHistory] = useState(false)

  useEffect(() => {
    if (!user) return
    setLoadingHistory(true)
    supabase
      .from('mood_sessions')
      .select('id, mood_label, lectura, paleta, created_at')
      .order('created_at', { ascending: false })
      .limit(20)
      .then(({ data, error }) => {
        if (!error && data) setHistory(data)
        setLoadingHistory(false)
      })
  }, [user])

  return (
    <div className="pt-10 pb-12">
      {/* Current mood card */}
      <p className="label-caps text-zinc-500 mb-4">Estado actual</p>
      <div className="bg-zinc-900 rounded-3xl border border-white/[0.08] shadow-[2px_2px_0px_0px_rgba(0,0,0,0.3)] p-6 mb-10">
        {paleta?.length > 0 && (
          <div className="flex gap-2 mb-4">
            {paleta.map((color, i) => (
              <div key={i} className="w-5 h-5 rounded-full border border-white/20" style={{ backgroundColor: color }} />
            ))}
          </div>
        )}
        <h2 className="font-display italic text-4xl leading-none mb-3" style={{ color: paleta?.[0] || '#93f57b' }}>
          {moodLabel || 'Your Mood'}
        </h2>
        {lectura && (
          <p className="text-zinc-400 text-sm leading-relaxed mb-6 max-w-sm font-light">{lectura}</p>
        )}
        <button onClick={() => navigate('/onboarding')} className="border-2 border-zinc-600 text-zinc-100 rounded-full px-6 py-2.5 text-xs font-black uppercase tracking-widest transition-all hover:border-zinc-400 hover:bg-zinc-800 flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">refresh</span>
          Nueva búsqueda
        </button>
      </div>

      {/* History */}
      <p className="label-caps text-zinc-500 mb-4">Tu historial</p>
      {!user ? (
        <div className="bg-zinc-900 rounded-3xl border border-white/[0.08] p-6 flex flex-col items-center gap-4 text-center">
          <span className="material-symbols-outlined text-zinc-600 text-4xl">history</span>
          <p className="text-zinc-400 text-xs uppercase tracking-widest">Inicia sesión para ver tu historial</p>
          <button onClick={signInWithGoogle} className="border-2 border-zinc-600 text-zinc-100 rounded-full px-6 py-2.5 text-xs font-black uppercase tracking-widest transition-all hover:border-zinc-400 hover:bg-zinc-800 flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">login</span>
            Iniciar sesión con Google
          </button>
        </div>
      ) : loadingHistory ? (
        <div className="text-zinc-500 text-xs uppercase tracking-widest text-center py-8">Cargando...</div>
      ) : history.length === 0 ? (
        <p className="text-zinc-500 text-xs uppercase tracking-widest">Aún no hay sesiones anteriores</p>
      ) : (
        <div className="space-y-2">
          {history.map((session) => (
            <div
              key={session.id}
              className="flex items-start gap-4 p-4 bg-zinc-900 rounded-2xl border border-white/[0.08] hover:bg-zinc-800 hover:border-white/20 transition-all"
            >
              {session.paleta?.length > 0 && (
                <div className="flex flex-col gap-1.5 shrink-0 pt-1">
                  {session.paleta.slice(0, 3).map((color, i) => (
                    <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                  ))}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="font-display italic text-zinc-100 text-lg leading-tight">{session.mood_label}</p>
                  <p className="text-zinc-500 text-[10px] uppercase tracking-wider shrink-0">{formatDate(session.created_at)}</p>
                </div>
                {session.lectura && (
                  <p className="text-zinc-400 text-xs mt-1 leading-relaxed line-clamp-2 font-light">{session.lectura}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
