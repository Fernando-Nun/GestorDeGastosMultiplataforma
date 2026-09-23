import { useState } from 'react'
import { motion } from 'framer-motion'
import { GlassInput } from '@/components/ui/GlassInput'
import { GlassButton } from '@/components/ui/GlassButton'
import { useAuth } from '@/contexts/AuthContext'

interface LoginFormProps {
  onForgotPassword: () => void
}

export function LoginForm({ onForgotPassword }: LoginFormProps) {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      setError('Completa todos los campos')
      return
    }
    setLoading(true)
    setError('')
    const err = await signIn(email, password)
    if (err) setError(err)
    setLoading(false)
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <GlassInput
        label="Correo electrónico"
        type="email"
        placeholder="correo@ejemplo.com"
        value={email}
        onChange={e => setEmail(e.target.value)}
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
            <polyline points="22,6 12,13 2,6" />
          </svg>
        }
        autoComplete="email"
      />
      <GlassInput
        label="Contraseña"
        type="password"
        placeholder="••••••••"
        value={password}
        onChange={e => setPassword(e.target.value)}
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        }
        autoComplete="current-password"
      />

      {error && (
        <motion.p
          className="text-sm px-3 py-2 rounded-xl font-medium"
          style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          {error}
        </motion.p>
      )}

      <button
        type="button"
        onClick={onForgotPassword}
        className="text-right text-xs font-medium transition-opacity hover:opacity-80 -mt-1"
        style={{ color: 'var(--accent)' }}
      >
        ¿Olvidaste tu contraseña?
      </button>

      <GlassButton type="submit" fullWidth loading={loading} size="lg" className="mt-1">
        Iniciar sesión
      </GlassButton>
    </motion.form>
  )
}
