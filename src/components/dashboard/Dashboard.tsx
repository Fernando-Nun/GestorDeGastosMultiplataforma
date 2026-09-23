import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useExpenses, getUrgency } from '@/contexts/ExpensesContext'
import { useAuth } from '@/contexts/AuthContext'
import { LogoPlaceholder } from '@/components/ui/LogoPlaceholder'
import { ExpenseCard } from './ExpenseCard'
import { EmptyState } from './EmptyState'
import { ExpenseForm } from '@/components/expenses/ExpenseForm'
import type { Expense } from '@/lib/supabase'
import { fetchUSDtoMXN } from '@/lib/currency'

const urgencyOrder = { red: 0, yellow: 1, green: 2 }

export function Dashboard() {
  const { expenses, loading } = useExpenses()
  const { user } = useAuth()
  const [showForm, setShowForm] = useState(false)
  const [editExpense, setEditExpense] = useState<Expense | null>(null)
  const [mxnRate, setMxnRate] = useState<number | null>(null)
  const didFetch = useRef(false)

  useEffect(() => {
    if (didFetch.current) return
    didFetch.current = true
    fetchUSDtoMXN().then(setMxnRate)
  }, [])

  const sorted = [...expenses].sort(
    (a, b) => urgencyOrder[getUrgency(a.payment_day)] - urgencyOrder[getUrgency(b.payment_day)]
  )

  const today = new Date()
  const monthName = today.toLocaleDateString('es-MX', { month: 'long' })
  const totalMXN = expenses.reduce((sum, e) => {
    if (e.currency === 'USD' && mxnRate) return sum + e.amount * mxnRate
    return sum + e.amount
  }, 0)

  return (
    <div className="min-h-dvh app-bg mobile-container flex flex-col pb-28">
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <div className="flex items-center justify-between mb-6">
          <LogoPlaceholder size="sm" showName />
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center glass text-sm font-bold"
            style={{ color: 'var(--accent)' }}
          >
            {user?.email?.[0]?.toUpperCase() ?? 'U'}
          </div>
        </div>

        {/* Summary card */}
        <motion.div
          className="glass-strong rounded-3xl p-5 mb-1"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <p className="text-xs font-medium uppercase tracking-wider mb-1 capitalize" style={{ color: 'var(--text-tertiary)' }}>
            Total {monthName}
          </p>
          <div className="flex items-end justify-between">
            <div>
              <p
                className="text-3xl font-bold leading-tight"
                style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}
              >
                {mxnRate
                  ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(totalMXN)
                  : '—'}
              </p>
              <p className="text-xs mt-1" style={{ color: 'var(--text-tertiary)' }}>
                {expenses.length} {expenses.length === 1 ? 'suscripción' : 'suscripciones'}
              </p>
            </div>
            <div className="flex gap-2">
              {['green', 'yellow', 'red'].map(u => {
                const count = expenses.filter(e => getUrgency(e.payment_day) === u).length
                if (!count) return null
                const colors: Record<string, string> = { green: '#34d399', yellow: '#fbbf24', red: '#f87171' }
                return (
                  <div key={u} className="flex flex-col items-center gap-0.5">
                    <span className="text-lg font-bold" style={{ color: colors[u], fontFamily: 'Outfit, sans-serif' }}>
                      {count}
                    </span>
                    <span className="w-2 h-2 rounded-full" style={{ background: colors[u] }} />
                  </div>
                )
              })}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Expense list */}
      <div className="flex-1 px-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
            Mis suscripciones
          </h2>
          <motion.button
            onClick={() => { setEditExpense(null); setShowForm(true) }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #7c5cfc, #5a3de8)' }}
            whileTap={{ scale: 0.92 }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            Añadir
          </motion.button>
        </div>

        {loading ? (
          <div className="flex flex-col gap-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="glass rounded-2xl h-24 animate-pulse" style={{ opacity: 0.4 }} />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <EmptyState onAdd={() => { setEditExpense(null); setShowForm(true) }} />
        ) : (
          <motion.div className="flex flex-col gap-3" layout>
            <AnimatePresence>
              {sorted.map(expense => (
                <ExpenseCard
                  key={expense.id}
                  expense={expense}
                  onEdit={e => { setEditExpense(e); setShowForm(true) }}
                  mxnRate={mxnRate}
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Add/Edit expense modal */}
      <AnimatePresence>
        {showForm && (
          <ExpenseForm
            expense={editExpense}
            mxnRate={mxnRate}
            onClose={() => { setShowForm(false); setEditExpense(null) }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
