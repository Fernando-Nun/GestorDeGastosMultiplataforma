import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Expense, ExpenseInput, User } from './types';

const COOKIE_KEY = '@ember/session-cookie';
let sessionCookie: string | null = null;

function apiOrigin() {
  const domain = process.env.EXPO_PUBLIC_DOMAIN;
  if (domain) return `https://${domain}`;
  if (typeof window !== 'undefined') return window.location.origin;
  return '';
}

function apiUrl(path: string) {
  return `${apiOrigin()}/api${path}`;
}

function captureCookie(response: Response) {
  const setCookie =
    response.headers.get('set-cookie') ?? response.headers.get('Set-Cookie');
  const match = setCookie?.match(/ember_session=([^;]+)/);
  if (match?.[1]) {
    sessionCookie = `ember_session=${match[1]}`;
    void AsyncStorage.setItem(COOKIE_KEY, sessionCookie);
  }
}

export async function hydrateSessionCookie() {
  sessionCookie = await AsyncStorage.getItem(COOKIE_KEY);
}

export async function clearSessionCookie() {
  sessionCookie = null;
  await AsyncStorage.removeItem(COOKIE_KEY);
}

async function request<T>(path: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (sessionCookie) headers.set('Cookie', sessionCookie);

  const response = await fetch(apiUrl(path), {
    ...init,
    headers,
    credentials: 'include',
  });
  captureCookie(response);

  if (!response.ok) {
    let message = `Error ${response.status}`;
    try {
      const body = (await response.json()) as { error?: string };
      message = body.error ?? message;
    } catch {
      // Keep the HTTP error when the API did not return JSON.
    }
    const error = new Error(message) as Error & { status?: number };
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export async function getSession() {
  return request<{ user: User }>('/auth/session');
}

export async function login(email: string, password: string) {
  return request<{ user: User }>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function register(email: string, password: string) {
  return request<{ user: User }>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function logout() {
  try {
    await request<void>('/auth/logout', { method: 'POST' });
  } finally {
    await clearSessionCookie();
  }
}

export async function forgotPassword(email: string) {
  return request<{ message: string }>('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export function listExpenses() {
  return request<Expense[]>('/expenses');
}

export function createExpense(data: ExpenseInput) {
  return request<Expense>('/expenses', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function updateExpense(id: string, data: Partial<ExpenseInput>) {
  return request<Expense>(`/expenses/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export function deleteExpense(id: string) {
  return request<void>(`/expenses/${id}`, { method: 'DELETE' });
}

let cachedRate: number | null = null;
let rateFetchedAt: number | null = null;

export async function fetchUSDtoMXN() {
  if (cachedRate && rateFetchedAt && Date.now() - rateFetchedAt < 1_800_000) {
    return cachedRate;
  }
  try {
    const response = await fetch(
      'https://api.frankfurter.app/latest?from=USD&to=MXN',
    );
    const data = (await response.json()) as { rates?: { MXN?: number } };
    if (data.rates?.MXN) {
      cachedRate = data.rates.MXN;
      rateFetchedAt = Date.now();
    }
  } catch {
    // The last known rate is preferred; the UI displays an unavailable state
    // when this is the first request and the service cannot be reached.
  }
  return cachedRate;
}

export function formatMXN(amount: number) {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatUSD(amount: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount);
}