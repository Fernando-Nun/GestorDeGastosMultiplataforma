import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { supabase, type Expense, type ExpenseInsert } from '@/lib/supabase'
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
  const { user } = useAuth()
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(false)

  const fetchExpenses = useCallback(async () => {
    if (!user) {
      setExpenses([])
      return
    }
    setLoading(true)
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', user.id)
      .order('payment_day', { ascending: true })
    if (!error && data) setExpenses(data as Expense[])
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  const addExpense = async (data: ExpenseInsert): Promise<string | null> => {
    if (!user) return 'No autenticado'
    const { error } = await supabase
      .from('expenses')
      .insert({ ...data, user_id: user.id })
    if (error) return error.message
    await fetchExpenses()
    return null
  }

  const updateExpense = async (id: string, data: Partial<ExpenseInsert>): Promise<string | null> => {
    const { error } = await supabase
      .from('expenses')
      .update({ ...data, updated_at: new Date().toISOString() })
      .eq('id', id)
    if (error) return error.message
    await fetchExpenses()
    return null
  }

  const deleteExpense = async (id: string): Promise<string | null> => {
    const { error } = await supabase.from('expenses').delete().eq('id', id)
    if (error) return error.message
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
