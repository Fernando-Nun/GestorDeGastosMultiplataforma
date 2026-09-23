import express, { type NextFunction, type Request, type Response } from 'express'
import { Pool } from 'pg'
import { createHash, createHmac, randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto'
import { promisify } from 'node:util'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createServer as createViteServer } from 'vite'

type Currency = 'MXN' | 'USD'

type ExpenseInput = {
  service_name: string
  payment_day: number
  card_label: string | null
  amount: number
  currency: Currency
}

declare global {
  namespace Express {
    interface Request {
      userId?: string
    }
  }
}

const app = express()
const port = Number(process.env.PORT ?? 5000)
const isProduction = process.env.NODE_ENV === 'production'
const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const sessionSecret = process.env.SESSION_SECRET ?? 'development-only-session-secret'
const sessionCookie = 'ember_session'
const sessionDurationSeconds = 60 * 60 * 24 * 30
const scrypt = promisify(scryptCallback)

app.use(express.json({ limit: '32kb' }))

function sendError(res: Response, status: number, message: string) {
  res.status(status).json({ error: message })
}

function normalizeEmail(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const email = value.trim().toLowerCase()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null
}

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString('hex')
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer
  return `scrypt:${salt}:${derivedKey.toString('hex')}`
}

async function verifyPassword(password: string, storedHash: string) {
  const [algorithm, salt, hash] = storedHash.split(':')
  if (algorithm !== 'scrypt' || !salt || !hash) return false
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer
  const expected = Buffer.from(hash, 'hex')
  return expected.length === derivedKey.length && timingSafeEqual(expected, derivedKey)
}

function hashSessionToken(token: string) {
  return createHmac('sha256', sessionSecret).update(token).digest('hex')
}

function readCookie(req: Request, name: string) {
  const cookies = req.header('cookie')?.split(';') ?? []
  const entry = cookies.find(cookie => cookie.trim().startsWith(`${name}=`))
  return entry ? decodeURIComponent(entry.trim().slice(name.length + 1)) : null
}

function setSessionCookie(res: Response, token: string) {
  const secure = isProduction ? '; Secure' : ''
  res.setHeader(
    'Set-Cookie',
    `${sessionCookie}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${sessionDurationSeconds}${secure}`,
  )
}

function clearSessionCookie(res: Response) {
  res.setHeader('Set-Cookie', `${sessionCookie}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`)
}

async function createSession(userId: string, res: Response) {
  const token = randomBytes(32).toString('base64url')
  const tokenHash = hashSessionToken(token)
  await pool.query(
    `INSERT INTO app_sessions (token_hash, user_id, expires_at)
     VALUES ($1, $2, now() + interval '30 days')`,
    [tokenHash, userId],
  )
  setSessionCookie(res, token)
}

async function requireUser(req: Request, res: Response, next: NextFunction) {
  const token = readCookie(req, sessionCookie)
  if (!token) {
    sendError(res, 401, 'Sesión requerida')
    return
  }

  try {
    const result = await pool.query(
      `SELECT u.id
       FROM app_sessions s
       INNER JOIN app_users u ON u.id = s.user_id
       WHERE s.token_hash = $1 AND s.expires_at > now()`,
      [hashSessionToken(token)],
    )
    if (!result.rows[0]) {
      clearSessionCookie(res)
      sendError(res, 401, 'Sesión inválida o expirada')
      return
    }
    req.userId = result.rows[0].id
    next()
  } catch (error) {
    console.error('Session lookup failed', error)
    sendError(res, 500, 'No se pudo validar la sesión')
  }
}

app.post('/api/auth/register', async (req, res) => {
  const email = normalizeEmail(req.body?.email)
  const password = typeof req.body?.password === 'string' ? req.body.password : ''
  if (!email) {
    sendError(res, 400, 'Ingresa un correo electrónico válido')
    return
  }
  if (password.length < 6) {
    sendError(res, 400, 'La contraseña debe tener al menos 6 caracteres')
    return
  }

  try {
    const passwordHash = await hashPassword(password)
    const result = await pool.query(
      `INSERT INTO app_users (email, password_hash)
       VALUES ($1, $2)
       RETURNING id, email`,
      [email, passwordHash],
    )
    const user = result.rows[0]
    await createSession(user.id, res)
    res.status(201).json({ user })
  } catch (error: unknown) {
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === '23505') {
      sendError(res, 409, 'Ya existe una cuenta con ese correo')
      return
    }
    console.error('POST /api/auth/register failed', error)
    sendError(res, 500, 'No se pudo crear la cuenta')
  }
})

app.post('/api/auth/login', async (req, res) => {
  const email = normalizeEmail(req.body?.email)
  const password = typeof req.body?.password === 'string' ? req.body.password : ''
  if (!email || !password) {
    sendError(res, 400, 'Completa todos los campos')
    return
  }

  try {
    const result = await pool.query(
      'SELECT id, email, password_hash FROM app_users WHERE email = $1',
      [email],
    )
    const user = result.rows[0]
    if (!user || !(await verifyPassword(password, user.password_hash))) {
      sendError(res, 401, 'Correo o contraseña incorrectos')
      return
    }
    await createSession(user.id, res)
    res.json({ user: { id: user.id, email: user.email } })
  } catch (error) {
    console.error('POST /api/auth/login failed', error)
    sendError(res, 500, 'No se pudo iniciar sesión')
  }
})

app.get('/api/auth/session', requireUser, async (req, res) => {
  const result = await pool.query('SELECT id, email FROM app_users WHERE id = $1', [req.userId])
  if (!result.rows[0]) {
    sendError(res, 401, 'Sesión inválida')
    return
  }
  res.json({ user: result.rows[0] })
})

app.post('/api/auth/logout', async (req, res) => {
  const token = readCookie(req, sessionCookie)
  if (token) {
    await pool.query('DELETE FROM app_sessions WHERE token_hash = $1', [hashSessionToken(token)])
  }
  clearSessionCookie(res)
  res.status(204).end()
})

app.post('/api/auth/forgot-password', async (req, res) => {
  const email = normalizeEmail(req.body?.email)
  if (email) {
    const result = await pool.query('SELECT id FROM app_users WHERE email = $1', [email])
    if (result.rows[0]) {
      const token = randomBytes(32).toString('base64url')
      await pool.query(
        `INSERT INTO password_reset_tokens (token_hash, user_id, expires_at)
         VALUES ($1, $2, now() + interval '1 hour')`,
        [createHash('sha256').update(token).digest('hex'), result.rows[0].id],
      )
      // Email delivery can be connected later without exposing reset tokens to the client.
    }
  }
  res.status(202).json({ message: 'Si existe una cuenta con ese correo, recibirás instrucciones.' })
})

function parseExpenseInput(body: unknown, partial = false): ExpenseInput | Partial<ExpenseInput> | string {
  if (!body || typeof body !== 'object') return 'Datos inválidos'
  const input = body as Record<string, unknown>
  const result: Partial<ExpenseInput> = {}

  if (!partial || 'service_name' in input) {
    if (typeof input.service_name !== 'string' || !input.service_name.trim()) return 'El nombre del servicio es requerido'
    result.service_name = input.service_name.trim()
  }
  if (!partial || 'payment_day' in input) {
    const paymentDay = Number(input.payment_day)
    if (!Number.isInteger(paymentDay) || paymentDay < 1 || paymentDay > 31) return 'El día de pago debe estar entre 1 y 31'
    result.payment_day = paymentDay
  }
  if (!partial || 'card_label' in input) {
    if (input.card_label !== null && typeof input.card_label !== 'string') return 'El método de pago no es válido'
    result.card_label = typeof input.card_label === 'string' ? input.card_label.trim() || null : null
  }
  if (!partial || 'amount' in input) {
    const amount = Number(input.amount)
    if (!Number.isFinite(amount) || amount <= 0) return 'Ingresa un monto válido'
    result.amount = amount
  }
  if (!partial || 'currency' in input) {
    if (input.currency !== 'MXN' && input.currency !== 'USD') return 'La moneda no es válida'
    result.currency = input.currency
  }

  return result
}

app.get('/api/expenses', requireUser, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, user_id, service_name, payment_day, card_label, amount::float8 AS amount,
              currency, created_at, updated_at
       FROM expenses
       WHERE user_id = $1
       ORDER BY payment_day ASC, created_at ASC`,
      [req.userId],
    )
    res.json(result.rows)
  } catch (error) {
    console.error('GET /api/expenses failed', error)
    sendError(res, 500, 'No se pudieron cargar tus gastos')
  }
})

app.post('/api/expenses', requireUser, async (req, res) => {
  const parsed = parseExpenseInput(req.body)
  if (typeof parsed === 'string') {
    sendError(res, 400, parsed)
    return
  }

  try {
    const result = await pool.query(
      `INSERT INTO expenses (user_id, service_name, payment_day, card_label, amount, currency)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, user_id, service_name, payment_day, card_label, amount::float8 AS amount,
                 currency, created_at, updated_at`,
      [req.userId, parsed.service_name, parsed.payment_day, parsed.card_label, parsed.amount, parsed.currency],
    )
    res.status(201).json(result.rows[0])
  } catch (error) {
    console.error('POST /api/expenses failed', error)
    sendError(res, 500, 'No se pudo guardar el gasto')
  }
})

app.patch('/api/expenses/:id', requireUser, async (req, res) => {
  const parsed = parseExpenseInput(req.body, true)
  if (typeof parsed === 'string') {
    sendError(res, 400, parsed)
    return
  }

  const fields = Object.entries(parsed)
  if (!fields.length) {
    sendError(res, 400, 'No hay cambios para guardar')
    return
  }

  const validId = /^[0-9a-f-]{36}$/i.test(req.params.id)
  if (!validId) {
    sendError(res, 400, 'Identificador inválido')
    return
  }

  const values: unknown[] = [req.userId, req.params.id]
  const assignments = fields.map(([field, value], index) => {
    values.push(value)
    return `${field} = $${index + 3}`
  })
  values.push(new Date().toISOString())

  try {
    const result = await pool.query(
      `UPDATE expenses
       SET ${assignments.join(', ')}, updated_at = $${values.length}
       WHERE user_id = $1 AND id = $2
       RETURNING id, user_id, service_name, payment_day, card_label, amount::float8 AS amount,
                 currency, created_at, updated_at`,
      values,
    )
    if (!result.rows[0]) {
      sendError(res, 404, 'Gasto no encontrado')
      return
    }
    res.json(result.rows[0])
  } catch (error) {
    console.error('PATCH /api/expenses failed', error)
    sendError(res, 500, 'No se pudo actualizar el gasto')
  }
})

app.delete('/api/expenses/:id', requireUser, async (req, res) => {
  if (!/^[0-9a-f-]{36}$/i.test(req.params.id)) {
    sendError(res, 400, 'Identificador inválido')
    return
  }

  try {
    const result = await pool.query(
      'DELETE FROM expenses WHERE user_id = $1 AND id = $2 RETURNING id',
      [req.userId, req.params.id],
    )
    if (!result.rows[0]) {
      sendError(res, 404, 'Gasto no encontrado')
      return
    }
    res.status(204).end()
  } catch (error) {
    console.error('DELETE /api/expenses failed', error)
    sendError(res, 500, 'No se pudo cancelar el gasto')
  }
})

if (isProduction) {
  const distPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dist')
  app.use(express.static(distPath))
  app.use((req, res, next) => {
    if (req.method === 'GET' && req.accepts('html')) {
      res.sendFile(path.join(distPath, 'index.html'))
      return
    }
    next()
  })
} else {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  })
  app.use(vite.middlewares)
}

app.listen(port, '0.0.0.0', () => {
  console.log(`Ember server listening on port ${port}`)
})