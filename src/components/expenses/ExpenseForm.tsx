import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { GlassInput, GlassSelect } from '@/components/ui/GlassInput'
import { GlassButton } from '@/components/ui/GlassButton'
import { GlassCard } from '@/components/ui/GlassCard'
import { useExpenses } from '@/contexts/ExpensesContext'
import { formatMXN, formatUSD } from '@/lib/currency'
import type { Expense, ExpenseInsert } from '@/lib/supabase'

interface ExpenseFormProps {
  expense: Expense | null
  mxnRate: number | null
  onClose: () => void
}

const DAYS = Array.from({ length: 31 }, (_, i) => ({ value: String(i + 1), label: `Día ${i + 1}` }))
const CURRENCIES = [
  { value: 'MXN', label: '🇲🇽 MXN — Pesos mexicanos' },
  { value: 'USD', label: '🇺🇸 USD — Dólares' },
]

export function ExpenseForm({ expense, mxnRate, onClose }: ExpenseFormProps) {
  const { addExpense, updateExpense } = useExpenses()
  const isEditing = !!expense

  const [serviceName, setServiceName] = useState(expense?.service_name ?? '')
  const [paymentDay, setPaymentDay] = useState(String(expense?.payment_day ?? 1))
  const [cardLabel, setCardLabel] = useState(expense?.card_label ?? '')
  const [amount, setAmount] = useState(String(expense?.amount ?? ''))
  const [currency, setCurrency] = useState<'MXN' | 'USD'>(expense?.currency ?? 'MXN')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const amountNum = parseFloat(amount) || 0
  const convertedMXN = currency === 'USD' && mxnRate ? amountNum * mxnRate : null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!serviceName.trim()) { setError('El nombre del servicio es requerido'); return }
    if (!amount || amountNum <= 0) { setError('Ingresa un monto válido'); return }

    setLoading(true)
    setError('')

    const data: ExpenseInsert = {
      service_name: serviceName.trim(),
      payment_day: parseInt(paymentDay),
      card_label: cardLabel.trim() || null,
      amount: amountNum,
      currency,
    }

    const err = isEditing
      ? await updateExpense(expense.id, data)
      : await addExpense(data)

    if (err) {
      setError(err)
      setLoading(false)
      return
    }

    setSuccess(true)
    setTimeout(() => {
      onClose()
    }, 900)
    setLoading(false)
  }

  return (
    <motion.div
      className="fixed inset-0 flex items-end justify-center"
      style={{ zIndex: 200 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0"
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(4px)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      />

      {/* Sheet */}
      <motion.div
        className="relative w-full max-w-[430px]"
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
        transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      >
        <div
          className="glass-strong rounded-t-3xl pt-2 pb-safe"
          style={{ maxHeight: '90dvh', overflowY: 'auto', paddingBottom: 'env(safe-area-inset-bottom, 24px)' }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-2 pb-4">
            <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border-strong)' }} />
          </div>

          <div className="px-6 pb-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <h2
                className="text-xl font-bold"
                style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}
              >
                {isEditing ? 'Editar suscripción' : 'Nueva suscripción'}
              </h2>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full glass flex items-center justify-center transition-all active:scale-90"
                style={{ color: 'var(--text-secondary)' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>

            {/* Success state */}
            <AnimatePresence>
              {success && (
                <motion.div
                  className="flex flex-col items-center gap-3 py-8 text-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                >
                  <motion.div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
                    style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)' }}
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.3, 1] }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  >
                    ✓
                  </motion.div>
                  <p className="font-semibold" style={{ color: '#34d399' }}>
                    {isEditing ? '¡Suscripción actualizada!' : '¡Suscripción añadida!'}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {!success && (
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Service name */}
                <GlassInput
                  label="Nombre del servicio"
                  type="text"
                  placeholder="Netflix, Disney+, Spotify..."
                  value={serviceName}
                  onChange={e => setServiceName(e.target.value)}
                  icon={
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                  }
                />

                {/* Payment day */}
                <GlassSelect
                  label="Día de pago (cada mes)"
                  value={paymentDay}
                  onChange={e => setPaymentDay(e.target.value)}
                  options={DAYS}
                />

                {/* Card label */}
                <GlassInput
                  label="Tarjeta o método de pago (opcional)"
                  type="text"
                  placeholder="Tarjeta azul, efectivo, OXXO..."
                  value={cardLabel}
                  onChange={e => setCardLabel(e.target.value)}
                  icon={
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                      <line x1="1" y1="10" x2="23" y2="10" />
                    </svg>
                  }
                />

                {/* Amount + currency */}
                <div className="flex gap-3">
                  <div className="flex-1">
                    <GlassInput
                      label="Monto"
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      min="0"
                      step="0.01"
                      suffix={currency}
                    />
                  </div>
                  <div className="w-28">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
                        Moneda
                      </label>
                      <select
                        value={currency}
                        onChange={e => setCurrency(e.target.value as 'MXN' | 'USD')}
                        className="w-full rounded-[12px] px-3 py-3 text-sm font-semibold appearance-none text-center"
                        style={{
                          background: 'var(--input-bg)',
                          border: '1px solid var(--input-border)',
                          color: 'var(--text-primary)',
                        }}
                      >
                        <option value="MXN">🇲🇽 MXN</option>
                        <option value="USD">🇺🇸 USD</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* USD → MXN conversion preview */}
                <AnimatePresence>
                  {currency === 'USD' && amountNum > 0 && (
                    <motion.div
                      className="rounded-2xl p-3 flex items-center justify-between"
                      style={{ background: 'rgba(124,92,252,0.08)', border: '1px solid rgba(124,92,252,0.15)' }}
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div>
                        <p className="text-xs font-medium" style={{ color: 'var(--text-tertiary)' }}>
                          Equivalente en pesos
                        </p>
                        <p className="text-base font-bold mt-0.5" style={{ color: 'var(--accent)', fontFamily: 'Outfit, sans-serif' }}>
                          {convertedMXN ? formatMXN(convertedMXN) : '—'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
                          {formatUSD(amountNum)} ×
                        </p>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>
                          {mxnRate ? `$${mxnRate.toFixed(2)}` : '…'}
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Reminder info */}
                <div
                  className="rounded-2xl p-3"
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}
                >
                  <p className="text-xs font-medium mb-2" style={{ color: 'var(--text-tertiary)' }}>
                    Recibirás recordatorios automáticos:
                  </p>
                  <div className="flex flex-col gap-1">
                    {[
                      { color: '#34d399', label: '7 días antes — Aviso temprano' },
                      { color: '#fbbf24', label: '3 días antes — Atención' },
                      { color: '#f87171', label: '1 día antes — Urgente' },
                    ].map(({ color, label }) => (
                      <div key={label} className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: color }} />
                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {error && (
                  <motion.p
                    className="text-sm px-3 py-2 rounded-xl font-medium"
                    style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    {error}
                  </motion.p>
                )}

                <div className="flex gap-3 mt-2">
                  <GlassButton type="button" variant="ghost" onClick={onClose} className="flex-1">
                    Cancelar
                  </GlassButton>
                  <GlassButton type="submit" fullWidth loading={loading} className="flex-1">
                    {isEditing ? 'Guardar cambios' : 'Añadir gasto'}
                  </GlassButton>
                </div>
              </form>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
