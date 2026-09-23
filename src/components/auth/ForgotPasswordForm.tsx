import { useState } from 'react'
import { motion } from 'framer-motion'
import { GlassInput } from '@/components/ui/GlassInput'
import { GlassButton } from '@/components/ui/GlassButton'
import { useAuth } from '@/contexts/AuthContext'

interface ForgotPasswordFormProps {
  onBack: () => void
}

export function ForgotPasswordForm({ onBack }: ForgotPasswordFormProps) {
  const { resetPassword } = useAuth()
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      setError('Ingresa tu correo electrónico')
      return
    }
    setLoading(true)
    setError('')
    const err = await resetPassword(email)
    if (err) {
      setError(err)
    } else {
      setSuccess(true)
    }
    setLoading(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -30 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    >
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-sm font-medium mb-6 transition-opacity hover:opacity-70"
        style={{ color: 'var(--accent)' }}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M19 12H5M12 5l-7 7 7 7" />
        </svg>
        Volver
      </button>

      <div className="mb-6">
        <h2 className="text-xl font-bold mb-1" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
          Recuperar contraseña
        </h2>
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Te enviaremos un enlace para restablecer tu contraseña.
        </p>
      </div>

      {success ? (
        <motion.div
          className="flex flex-col items-center gap-4 py-6 text-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-2xl"
            style={{ background: 'rgba(52,211,153,0.15)', border: '1px solid rgba(52,211,153,0.3)' }}
          >
            ✉️
          </div>
          <div>
            <p className="font-semibold mb-1" style={{ color: '#34d399' }}>¡Correo enviado!</p>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Revisa tu bandeja de entrada y sigue las instrucciones del correo.
            </p>
          </div>
          <GlassButton variant="ghost" onClick={onBack} className="mt-2">
            Volver al inicio
          </GlassButton>
        </motion.div>
      ) : (
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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

          {error && (
            <motion.p
              className="text-sm px-3 py-2 rounded-xl font-medium"
              style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              {error}
            </motion.p>
          )}

          <GlassButton type="submit" fullWidth loading={loading} size="lg">
            Enviar enlace
          </GlassButton>
        </form>
      )}
    </motion.div>
  )
}
