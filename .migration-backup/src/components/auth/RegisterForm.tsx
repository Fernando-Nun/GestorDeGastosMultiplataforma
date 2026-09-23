import { useState } from 'react'
import { motion } from 'framer-motion'
import { GlassInput } from '@/components/ui/GlassInput'
import { GlassButton } from '@/components/ui/GlassButton'
import { useAuth } from '@/contexts/AuthContext'

export function RegisterForm() {
  const { signUp } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password || !confirm) {
      setError('Completa todos los campos')
      return
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden')
      return
    }
    setLoading(true)
    setError('')
    const err = await signUp(email, password)
    if (err) {
      setError(err)
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  if (success) {
    return (
      <motion.div
        className="flex flex-col items-center gap-4 py-4 text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
          style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)' }}
        >
          ✓
        </div>
        <div>
          <p className="font-semibold mb-1" style={{ color: '#34d399' }}>¡Cuenta creada!</p>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            Revisa tu correo para confirmar tu cuenta y luego inicia sesión.
          </p>
        </div>
      </motion.div>
    )
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
        placeholder="Mínimo 6 caracteres"
        value={password}
        onChange={e => setPassword(e.target.value)}
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        }
        autoComplete="new-password"
      />
      <GlassInput
        label="Confirmar contraseña"
        type="password"
        placeholder="Repite tu contraseña"
        value={confirm}
        onChange={e => setConfirm(e.target.value)}
        icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
        autoComplete="new-password"
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

      <GlassButton type="submit" fullWidth loading={loading} size="lg" className="mt-1">
        Crear cuenta
      </GlassButton>
    </motion.form>
  )
}
