import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Expense = {
  id: string
  user_id: string
  service_name: string
  payment_day: number
  card_label: string | null
  amount: number
  currency: 'MXN' | 'USD'
  created_at: string
  updated_at: string
}

export type ExpenseInsert = Omit<Expense, 'id' | 'user_id' | 'created_at' | 'updated_at'>
