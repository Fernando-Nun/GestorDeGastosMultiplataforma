import { createContext, useContext, useEffect, useState } from 'react'

export type User = {
  id: string
  email: string
}

export type Session = {
  user: User
}

interface AuthContextValue {
  session: Session | null
  user: User | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<string | null>
  signUp: (email: string, password: string) => Promise<string | null>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<string | null>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/auth/session', { credentials: 'same-origin' })
      .then(async response => {
        if (!response.ok) return null
        const data = (await response.json()) as { user: User }
        return { user: data.user }
      })
      .catch(() => null)
      .then(setSession)
      .finally(() => setLoading(false))
  }, [])

  const signIn = async (email: string, password: string): Promise<string | null> => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email, password }),
    })
    if (!response.ok) return ((await response.json()) as { error?: string }).error ?? 'No se pudo iniciar sesión'
    const data = (await response.json()) as { user: User }
    setSession({ user: data.user })
    return null
  }

  const signUp = async (email: string, password: string): Promise<string | null> => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email, password }),
    })
    if (!response.ok) return ((await response.json()) as { error?: string }).error ?? 'No se pudo crear la cuenta'
    const data = (await response.json()) as { user: User }
    setSession({ user: data.user })
    return null
  }

  const signOut = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'same-origin' })
    setSession(null)
  }

  const resetPassword = async (email: string): Promise<string | null> => {
    const response = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify({ email }),
    })
    if (!response.ok) return ((await response.json()) as { error?: string }).error ?? 'No se pudo procesar la solicitud'
    return null
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        signIn,
        signUp,
        signOut,
        resetPassword,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
  return ctx
}
