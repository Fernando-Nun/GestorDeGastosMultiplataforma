import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Expense } from '@/lib/types'
import { getUrgency, getDaysUntil, useExpenses } from '@/contexts/ExpensesContext'
import { UrgencyBadge } from '@/components/ui/UrgencyBadge'
import { formatMXN, formatUSD } from '@/lib/currency'

type ServiceIconName =
  | 'film'
  | 'castle'
  | 'music'
  | 'package'
  | 'play'
  | 'tv'
  | 'apple'
  | 'window'
  | 'palette'
  | 'cloud'
  | 'search'
  | 'folder'
  | 'receipt'

const SERVICE_ICONS: Record<string, ServiceIconName> = {
  netflix: 'film',
  disney: 'castle',
  spotify: 'music',
  amazon: 'package',
  youtube: 'play',
  hbo: 'tv',
  apple: 'apple',
  microsoft: 'window',
  adobe: 'palette',
  icloud: 'cloud',
  google: 'search',
  dropbox: 'folder',
}

function getServiceIcon(name: string): ServiceIconName {
  const lower = name.toLowerCase()
  for (const [key, icon] of Object.entries(SERVICE_ICONS)) {
    if (lower.includes(key)) return icon
  }
  return 'receipt'
}

function ServiceIcon({ name }: { name: ServiceIconName }) {
  const common = {
    width: 21,
    height: 21,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }

  switch (name) {
    case 'film':
      return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M7 3v18M17 3v18M3 8h4M17 8h4M3 16h4M17 16h4" /></svg>
    case 'castle':
      return <svg {...common}><path d="M3 21h18M5 21V9l3-3 4 3 4-3 3 3v12M8 21v-5h3v5M15 21v-5h3v5M12 9V5M10 5h4" /></svg>
    case 'music':
      return <svg {...common}><path d="M9 18V5l10-2v13M9 9l10-2" /><circle cx="6" cy="18" r="3" /><circle cx="16" cy="16" r="3" /></svg>
    case 'package':
      return <svg {...common}><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" /><path d="m4.5 7.5 7.5 4 7.5-4M12 12v9M8 5l8 4.5" /></svg>
    case 'play':
      return <svg {...common}><rect x="3" y="4" width="18" height="16" rx="3" /><path d="m10 8 5 4-5 4V8Z" /></svg>
    case 'tv':
      return <svg {...common}><rect x="3" y="5" width="18" height="13" rx="2" /><path d="m8 2 4 3 4-3M8 21h8" /></svg>
    case 'apple':
      return <svg {...common}><path d="M15.5 7.5c1.7 0 3.5 1.7 3.5 4.3 0 3.2-2.6 7.2-4.6 7.2-1 0-1.4-.7-2.9-.7s-2 .7-3 .7c-2 0-4.5-3.8-4.5-7.1 0-3.2 2-4.9 3.9-4.9 1.2 0 2.3.8 3.1.8s1.9-.8 3-.8h1.5Z" /><path d="M14 4c.7-.9 1.8-1.5 2.9-1.5.1 1.2-.3 2.3-1 3.1-.7.8-1.8 1.4-2.9 1.3-.1-1.1.4-2.2 1-2.9Z" /></svg>
    case 'window':
      return <svg {...common}><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M12 3v18M3 12h18" /></svg>
    case 'palette':
      return <svg {...common}><path d="M12 3a9 9 0 0 0 0 18h1.5a1.5 1.5 0 0 0 0-3H12a1.5 1.5 0 0 1 0-3h1.5a7.5 7.5 0 0 0-1.5-15Z" /><circle cx="7.5" cy="10" r=".8" fill="currentColor" /><circle cx="9" cy="6.5" r=".8" fill="currentColor" /><circle cx="14" cy="6.5" r=".8" fill="currentColor" /></svg>
    case 'cloud':
      return <svg {...common}><path d="M17.5 19H8a5 5 0 1 1 1.1-9.9A6 6 0 0 1 20 11a4 4 0 0 1-2.5 8Z" /></svg>
    case 'search':
      return <svg {...common}><circle cx="10.8" cy="10.8" r="6.8" /><path d="m16 16 5 5" /></svg>
    case 'folder':
      return <svg {...common}><path d="M3 6.5A2.5 2.5 0 0 1 5.5 4H10l2 2h6.5A2.5 2.5 0 0 1 21 8.5v8A2.5 2.5 0 0 1 18.5 19h-13A2.5 2.5 0 0 1 3 16.5v-10Z" /></svg>
    default:
      return <svg {...common}><path d="M6 3h9l3 3v15H6zM15 3v4h4M9 12h6M9 16h6" /></svg>
  }
}

const urgencyBorderColor = {
  green: '#34d399',
  yellow: '#fbbf24',
  red: '#f87171',
}

interface ExpenseCardProps {
  expense: Expense
  onEdit: (expense: Expense) => void
  mxnRate: number | null
}

export function ExpenseCard({ expense, onEdit, mxnRate }: ExpenseCardProps) {
  const { deleteExpense } = useExpenses()
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [removed, setRemoved] = useState(false)

  const urgency = getUrgency(expense.payment_day)
  const daysUntil = getDaysUntil(expense.payment_day)
  const icon = getServiceIcon(expense.service_name)

  const amountMXN =
    expense.currency === 'USD' && mxnRate ? expense.amount * mxnRate : expense.amount

  const handleDelete = async () => {
    setDeleting(true)
    await deleteExpense(expense.id)
    setRemoved(true)
  }

  if (removed) return null

  return (
    <AnimatePresence>
      <motion.div
        layout
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, x: 60, scale: 0.95, transition: { duration: 0.28 } }}
        transition={{ duration: 0.35, ease: [0.34, 1.2, 0.64, 1] }}
        className="relative overflow-hidden"
      >
        <div
          className="glass rounded-2xl overflow-hidden"
          style={{
            borderLeft: `3px solid ${urgencyBorderColor[urgency]}`,
          }}
        >
          {urgency === 'red' && (
            <motion.div
              className="absolute inset-0 rounded-2xl pointer-events-none"
              style={{ background: 'rgba(248,113,113,0.04)' }}
              animate={{ opacity: [0, 1, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            />
          )}

          <div className="p-4">
            <div className="flex items-start justify-between gap-3">
              {/* Left: icon + info */}
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                  style={{ background: 'rgba(124,92,252,0.1)', border: '1px solid rgba(124,92,252,0.15)' }}
                >
                  <ServiceIcon name={icon} />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
                    {expense.service_name}
                  </p>
                  {expense.card_label && (
                    <p className="text-xs mt-0.5 flex items-center gap-1 truncate" style={{ color: 'var(--text-tertiary)' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="2" y="5" width="20" height="14" rx="2" />
                        <path d="M2 10h20" />
                      </svg>
                      {expense.card_label}
                    </p>
                  )}
                  <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                    Día {expense.payment_day} de cada mes
                  </p>
                </div>
              </div>

              {/* Right: amount + badge */}
              <div className="flex flex-col items-end gap-1.5 shrink-0">
                <div className="text-right">
                  <p className="font-bold text-base" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
                    {formatMXN(amountMXN)}
                  </p>
                  {expense.currency === 'USD' && (
                    <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                      {formatUSD(expense.amount)} USD
                    </p>
                  )}
                </div>
                <UrgencyBadge urgency={urgency} daysUntil={daysUntil} />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--border)' }}>
              <button
                onClick={() => onEdit(expense)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 hover:bg-white/10 active:scale-95"
                style={{ color: 'var(--accent)' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
                Editar
              </button>
              <button
                onClick={() => setShowConfirmDelete(true)}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all duration-150 hover:bg-red-500/10 active:scale-95"
                style={{ color: '#f87171' }}
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="3 6 5 6 21 6" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                </svg>
                Cancelar
              </button>
            </div>
          </div>
        </div>

        {/* Confirm delete overlay */}
        <AnimatePresence>
          {showConfirmDelete && (
            <motion.div
              className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center gap-4 p-5 text-center"
              style={{ background: 'rgba(10,5,20,0.92)', backdropFilter: 'blur(8px)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <p className="font-semibold text-sm" style={{ color: 'var(--text-primary)' }}>
                ¿Cancelar <span style={{ color: '#f87171' }}>{expense.service_name}</span>?
              </p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                Se eliminará de tu lista de suscripciones.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowConfirmDelete(false)}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold glass transition-all active:scale-95"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  No
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', color: 'white' }}
                >
                  {deleting ? '...' : 'Sí, cancelar'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  )
}
