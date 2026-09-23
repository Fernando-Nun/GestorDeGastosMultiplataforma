import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Expense } from '@/lib/supabase'
import { getUrgency, getDaysUntil, useExpenses } from '@/contexts/ExpensesContext'
import { UrgencyBadge } from '@/components/ui/UrgencyBadge'
import { formatMXN, formatUSD } from '@/lib/currency'

const SERVICE_ICONS: Record<string, string> = {
  netflix: '🎬',
  disney: '🏰',
  spotify: '🎵',
  amazon: '📦',
  youtube: '▶️',
  hbo: '📺',
  apple: '🍎',
  microsoft: '🪟',
  adobe: '🎨',
  icloud: '☁️',
  google: '🔍',
  dropbox: '📁',
}

function getServiceIcon(name: string): string {
  const lower = name.toLowerCase()
  for (const [key, icon] of Object.entries(SERVICE_ICONS)) {
    if (lower.includes(key)) return icon
  }
  return '📋'
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
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0"
                  style={{ background: 'rgba(124,92,252,0.1)', border: '1px solid rgba(124,92,252,0.15)' }}
                >
                  {icon}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
                    {expense.service_name}
                  </p>
                  {expense.card_label && (
                    <p className="text-xs mt-0.5 flex items-center gap-1 truncate" style={{ color: 'var(--text-tertiary)' }}>
                      <span>💳</span>
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
