export type User = {
  id: string;
  email: string;
};

export type Expense = {
  id: string;
  user_id: string;
  service_name: string;
  payment_day: number;
  card_label: string | null;
  amount: number;
  currency: 'MXN' | 'USD';
  created_at: string;
  updated_at: string;
};

export type ExpenseInput = Omit<
  Expense,
  'id' | 'user_id' | 'created_at' | 'updated_at'
>;