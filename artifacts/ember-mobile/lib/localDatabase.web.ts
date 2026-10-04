import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Expense, ExpenseInput } from './types';

// The browser preview uses device-local storage because Expo SQLite's web
// worker needs a WASM asset that is not available in this monorepo template.
const EXPENSES_KEY = '@ember/web-preview/expenses';
const USD_MXN_RATE_KEY = '@ember/web-preview/usd-mxn-rate';

async function readExpenses(): Promise<Expense[]> {
  const serialized = await AsyncStorage.getItem(EXPENSES_KEY);
  if (!serialized) return [];
  try {
    const expenses: unknown = JSON.parse(serialized);
    if (!Array.isArray(expenses)) throw new Error();
    return expenses as Expense[];
  } catch {
    throw new Error('No se pudieron leer las suscripciones guardadas localmente');
  }
}

async function writeExpenses(expenses: Expense[]) {
  await AsyncStorage.setItem(EXPENSES_KEY, JSON.stringify(expenses));
}

function createLocalId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export async function listLocalExpenses() {
  const expenses = await readExpenses();
  return expenses.sort(
    (a, b) =>
      a.payment_day - b.payment_day ||
      a.created_at.localeCompare(b.created_at),
  );
}

export async function createLocalExpense(input: ExpenseInput) {
  const now = new Date().toISOString();
  const expense: Expense = {
    id: createLocalId(),
    ...input,
    created_at: now,
    updated_at: now,
  };
  const expenses = await readExpenses();
  await writeExpenses([...expenses, expense]);
  return expense;
}

export async function updateLocalExpense(
  id: string,
  input: Partial<ExpenseInput>,
) {
  const expenses = await readExpenses();
  const index = expenses.findIndex(expense => expense.id === id);
  if (index === -1) throw new Error('No se encontró la suscripción local');

  const updated: Expense = {
    ...expenses[index],
    ...input,
    updated_at: new Date().toISOString(),
  };
  expenses[index] = updated;
  await writeExpenses(expenses);
  return updated;
}

export async function deleteLocalExpense(id: string) {
  const expenses = await readExpenses();
  const remaining = expenses.filter(expense => expense.id !== id);
  if (remaining.length === expenses.length) {
    throw new Error('No se encontró la suscripción local');
  }
  await writeExpenses(remaining);
}

export async function getLocalUsdMxnRate() {
  const value = await AsyncStorage.getItem(USD_MXN_RATE_KEY);
  const rate = Number(value);
  return Number.isFinite(rate) && rate > 0 ? rate : null;
}

export async function setLocalUsdMxnRate(rate: number) {
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error('Ingresa un tipo de cambio mayor que cero');
  }
  await AsyncStorage.setItem(USD_MXN_RATE_KEY, String(rate));
}