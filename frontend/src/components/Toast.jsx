import { motion, AnimatePresence } from 'framer-motion'

export default function Toast({ toast, onConfirm, onDismiss }) {
  if (!toast) return null

  return (
    <AnimatePresence>
      <motion.div
        key={toast.id}
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 100, damping: 22 }}
        /* Pill oscuro — contrasta con el fondo beige de Results */
        className="fixed bottom-28 left-1/2 -translate-x-1/2 z-50 bg-zinc-900 text-white rounded-full px-6 py-3.5 flex items-center gap-5 shadow-[3px_3px_0px_0px_rgba(0,0,0,0.4)] max-w-sm w-auto"
      >
        <p className="text-sm font-medium flex-1 whitespace-nowrap">{toast.message}</p>
        <div className="flex gap-3 shrink-0">
          <button
            onClick={onConfirm}
            className="text-primary text-xs font-black uppercase tracking-widest hover:opacity-80 transition-opacity"
          >
            Explore
          </button>
          <button
            onClick={onDismiss}
            className="text-white/50 text-xs font-black uppercase tracking-widest hover:text-white/80 transition-colors"
          >
            Dismiss
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
