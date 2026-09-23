import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { Expense, ExpenseInsert } from '@/lib/types'
import { useAuth } from './AuthContext'

interface ExpensesContextValue {
  expenses: Expense[]
  loading: boolean
  addExpense: (data: ExpenseInsert) => Promise<string | null>
  updateExpense: (id: string, data: Partial<ExpenseInsert>) => Promise<string | null>
  deleteExpense: (id: string) => Promise<string | null>
  refresh: () => Promise<void>
}

const ExpensesContext = createContext<ExpensesContextValue | null>(null)

export function ExpensesProvider({ children }: { children: React.ReactNode }) {
  const { user, session } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(false)

  const fetchExpenses = useCallback(async () => {
    if (!user || !session) {
      setExpenses([])
      return
    }
    setLoading(true)
    try {
      const response = await fetch('/api/expenses', {
        credentials: 'same-origin',
      })
      if (response.ok) {
        const data = (await response.json()) as Expense[]
        setExpenses(data)
      }
    } finally {
      setLoading(false)
    }
  }, [session, user])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  const addExpense = async (data: ExpenseInsert): Promise<string | null> => {
    if (!session) return 'No autenticado'
    const response = await fetch('/api/expenses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
      body: JSON.stringify(data),
    })
    if (!response.ok) return ((await response.json()) as { error?: string }).error ?? 'No se pudo guardar el gasto'
    await fetchExpenses()
    return null
  }

  const updateExpense = async (id: string, data: Partial<ExpenseInsert>): Promise<string | null> => {
    if (!session) return 'No autenticado'
    const response = await fetch(`/api/expenses/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
      body: JSON.stringify(data),
    })
    if (!response.ok) return ((await response.json()) as { error?: string }).error ?? 'No se pudo actualizar el gasto'
    await fetchExpenses()
    return null
  }

  const deleteExpense = async (id: string): Promise<string | null> => {
    if (!session) return 'No autenticado'
    const response = await fetch(`/api/expenses/${id}`, {
      method: 'DELETE',
      credentials: 'same-origin',
    })
    if (!response.ok) return ((await response.json()) as { error?: string }).error ?? 'No se pudo cancelar el gasto'
    setExpenses(prev => prev.filter(e => e.id !== id))
    return null
  }

  return (
    <ExpensesContext.Provider
      value={{ expenses, loading, addExpense, updateExpense, deleteExpense, refresh: fetchExpenses }}
    >
      {children}
    </ExpensesContext.Provider>
  )
}

export function useExpenses() {
  const ctx = useContext(ExpensesContext)
  if (!ctx) throw new Error('useExpenses must be used inside ExpensesProvider')
  return ctx
}

export function getUrgency(paymentDay: number): 'green' | 'yellow' | 'red' {
  const today = new Date()
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), paymentDay)
  if (thisMonth <= today) thisMonth.setMonth(thisMonth.getMonth() + 1)
  const daysUntil = Math.ceil((thisMonth.getTime() - today.getTime()) / 86_400_000)
  if (daysUntil <= 1) return 'red'
  if (daysUntil <= 3) return 'yellow'
  return 'green'
}

export function getDaysUntil(paymentDay: number): number {
  const today = new Date()
  const thisMonth = new Date(today.getFullYear(), today.getMonth(), paymentDay)
  if (thisMonth <= today) thisMonth.setMonth(thisMonth.getMonth() + 1)
  return Math.ceil((thisMonth.getTime() - today.getTime()) / 86_400_000)
}
