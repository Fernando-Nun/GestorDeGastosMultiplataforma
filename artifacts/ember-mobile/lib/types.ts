export type Expense = {
  id: string;
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
  'id' | 'created_at' | 'updated_at'
>;