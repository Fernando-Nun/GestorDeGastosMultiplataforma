import * as SQLite from 'expo-sqlite';
import type { Expense, ExpenseInput } from './types';

const DATABASE_NAME = 'ember-local.db';
const SETTINGS_TABLE = 'app_settings';

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

function getDatabase() {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabaseAsync(DATABASE_NAME).then(async db => {
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS expenses (
          id TEXT PRIMARY KEY NOT NULL,
          service_name TEXT NOT NULL CHECK (length(trim(service_name)) > 0),
          payment_day INTEGER NOT NULL CHECK (payment_day BETWEEN 1 AND 31),
          card_label TEXT,
          amount REAL NOT NULL CHECK (amount > 0),
          currency TEXT NOT NULL CHECK (currency IN ('MXN', 'USD')),
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS expenses_payment_day_idx
          ON expenses(payment_day, created_at);
        CREATE TABLE IF NOT EXISTS ${SETTINGS_TABLE} (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL
        );
      `);
      return db;
    });
  }
  return databasePromise;
}

function createLocalId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

export async function listLocalExpenses() {
  const db = await getDatabase();
  return db.getAllAsync<Expense>(
    `SELECT id, service_name, payment_day, card_label, amount, currency,
            created_at, updated_at
     FROM expenses
     ORDER BY payment_day ASC, created_at ASC`,
  );
}

export async function createLocalExpense(input: ExpenseInput) {
  const db = await getDatabase();
  const now = new Date().toISOString();
  const expense: Expense = {
    id: createLocalId(),
    ...input,
    created_at: now,
    updated_at: now,
  };
  await db.runAsync(
    `INSERT INTO expenses
      (id, service_name, payment_day, card_label, amount, currency, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    expense.id,
    expense.service_name,
    expense.payment_day,
    expense.card_label,
    expense.amount,
    expense.currency,
    expense.created_at,
    expense.updated_at,
  );
  return expense;
}

export async function updateLocalExpense(
  id: string,
  input: Partial<ExpenseInput>,
) {
  const db = await getDatabase();
  const current = await db.getFirstAsync<Expense>(
    'SELECT * FROM expenses WHERE id = ?',
    id,
  );
  if (!current) throw new Error('No se encontró la suscripción local');

  const updated: Expense = {
    ...current,
    ...input,
    updated_at: new Date().toISOString(),
  };
  await db.runAsync(
    `UPDATE expenses
     SET service_name = ?, payment_day = ?, card_label = ?, amount = ?,
         currency = ?, updated_at = ?
     WHERE id = ?`,
    updated.service_name,
    updated.payment_day,
    updated.card_label,
    updated.amount,
    updated.currency,
    updated.updated_at,
    id,
  );
  return updated;
}

export async function deleteLocalExpense(id: string) {
  const db = await getDatabase();
  const result = await db.runAsync('DELETE FROM expenses WHERE id = ?', id);
  if (result.changes === 0) throw new Error('No se encontró la suscripción local');
}

export async function getLocalUsdMxnRate() {
  const db = await getDatabase();
  const setting = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM ${SETTINGS_TABLE} WHERE key = ?`,
    'usd_mxn_rate',
  );
  const rate = Number(setting?.value);
  return Number.isFinite(rate) && rate > 0 ? rate : null;
}

export async function setLocalUsdMxnRate(rate: number) {
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error('Ingresa un tipo de cambio mayor que cero');
  }
  const db = await getDatabase();
  await db.runAsync(
    `INSERT INTO ${SETTINGS_TABLE} (key, value)
     VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    'usd_mxn_rate',
    String(rate),
  );
}
