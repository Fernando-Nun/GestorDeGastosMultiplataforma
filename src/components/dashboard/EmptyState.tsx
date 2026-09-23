import { motion } from 'framer-motion'

interface EmptyStateProps {
  onAdd: () => void
}

export function EmptyState({ onAdd }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-6 py-16 px-8 text-center">
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
      >
        <div
          className="w-20 h-20 rounded-3xl flex items-center justify-center text-3xl"
          style={{
            background: 'rgba(124,92,252,0.1)',
            border: '1px solid rgba(124,92,252,0.2)',
            boxShadow: '0 8px 24px rgba(124,92,252,0.1)',
          }}
        >
          💳
        </div>
      </motion.div>

      <div>
        <h3 className="text-lg font-bold mb-2" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
          Sin suscripciones aún
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          Agrega tus servicios y suscripciones para recibir recordatorios de pago.
        </p>
      </div>

      <button
        onClick={onAdd}
        className="flex items-center gap-2 px-6 py-3 rounded-[14px] font-semibold text-sm text-white transition-all duration-200 active:scale-95"
        style={{ background: 'linear-gradient(135deg, #7c5cfc, #5a3de8)', boxShadow: '0 4px 20px rgba(124,92,252,0.4)' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="12" y1="5" x2="12" y2="19" />
          <line x1="5" y1="12" x2="19" y2="12" />
        </svg>
        Añadir suscripción
      </button>
    </div>
  )
}
