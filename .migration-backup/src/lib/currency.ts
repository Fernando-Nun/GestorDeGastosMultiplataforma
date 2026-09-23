let cachedRate: number | null = null
let cacheTime: number | null = null
const CACHE_TTL = 1000 * 60 * 30 // 30 minutes

export async function fetchUSDtoMXN(): Promise<number> {
  const now = Date.now()
  if (cachedRate && cacheTime && now - cacheTime < CACHE_TTL) {
    return cachedRate
  }

  try {
    const res = await fetch('https://api.frankfurter.app/latest?from=USD&to=MXN')
    const data = await res.json()
    cachedRate = data.rates.MXN as number
    cacheTime = now
    return cachedRate
  } catch {
    return cachedRate ?? 17.5 // fallback estimate
  }
}

export function formatMXN(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    minimumFractionDigits: 2,
  }).format(amount)
}

export function formatUSD(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
  }).format(amount)
}
