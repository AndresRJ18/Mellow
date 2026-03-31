import { useState, useRef, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'

export default function UserMenu() {
  const { user, loading, signInWithGoogle, signOut } = useAuth()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  if (loading) return null

  if (!user) {
    return (
      <button
        onClick={signInWithGoogle}
        className="flex items-center gap-2 text-on-surface-variant hover:text-on-surface transition-colors text-xs font-bold uppercase tracking-widest rounded-full border border-black/20 hover:border-black/50 px-4 py-2"
      >
        <svg width="14" height="14" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.32C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Iniciar sesión
      </button>
    )
  }

  const initials = user.email?.charAt(0).toUpperCase() || '?'
  const name = user.user_metadata?.full_name || user.email

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-9 h-9 rounded-full border-2 border-black/15 hover:border-black/40 overflow-hidden flex items-center justify-center bg-surface-container text-on-surface text-xs font-black transition-all"
      >
        {user.user_metadata?.avatar_url
          ? <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full object-cover" />
          : initials}
      </button>

      {open && (
        /* Dropdown editorial — blanco, redondeado, sombra sólida */
        <div className="absolute right-0 top-11 w-52 bg-white rounded-2xl border border-black/8 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.08)] z-50 overflow-hidden">
          <div className="px-4 py-3 border-b border-black/8">
            <p className="text-on-surface text-xs font-bold truncate">{name}</p>
            <p className="text-on-surface-variant text-[10px] truncate mt-0.5">{user.email}</p>
          </div>
          <button
            onClick={() => { signOut(); setOpen(false) }}
            className="w-full flex items-center gap-2 px-4 py-3 text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors text-xs uppercase tracking-widest font-bold"
          >
            <span className="material-symbols-outlined text-sm">logout</span>
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}
