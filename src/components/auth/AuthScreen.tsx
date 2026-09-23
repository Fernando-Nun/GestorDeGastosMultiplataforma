import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { LogoPlaceholder } from '@/components/ui/LogoPlaceholder'
import { GlassCard } from '@/components/ui/GlassCard'
import { LoginForm } from './LoginForm'
import { RegisterForm } from './RegisterForm'
import { ForgotPasswordForm } from './ForgotPasswordForm'

type Tab = 'login' | 'register'

export function AuthScreen() {
  const [tab, setTab] = useState<Tab>('login')
  const [showForgot, setShowForgot] = useState(false)

  return (
    <div className="min-h-dvh flex flex-col items-center justify-between app-bg mobile-container px-5 py-10">
      {/* Background decorative orb */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 pointer-events-none"
        style={{
          width: 400,
          height: 300,
          background: 'radial-gradient(ellipse, rgba(124,92,252,0.18) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />

      {/* Logo area */}
      <motion.div
        className="flex flex-col items-center gap-2 mt-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <LogoPlaceholder size="md" />
        <p className="text-xs font-medium mt-1" style={{ color: 'var(--text-tertiary)' }}>
          Gestiona tus suscripciones
        </p>
      </motion.div>

      {/* Auth card */}
      <motion.div
        className="w-full"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
      >
        <GlassCard strong radius="rounded-3xl" padding="p-6">
          <AnimatePresence mode="wait">
            {showForgot ? (
              <motion.div key="forgot">
                <ForgotPasswordForm onBack={() => setShowForgot(false)} />
              </motion.div>
            ) : (
              <motion.div key="auth-tabs">
                {/* Tab switcher */}
                <div
                  className="flex relative rounded-2xl p-1 mb-6"
                  style={{ background: 'rgba(0,0,0,0.2)' }}
                >
                  {/* Sliding indicator */}
                  <motion.div
                    className="absolute top-1 bottom-1 rounded-xl"
                    style={{ background: 'var(--accent)', width: 'calc(50% - 4px)' }}
                    animate={{ x: tab === 'login' ? 4 : 'calc(100% + 4px)' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                  {(['login', 'register'] as Tab[]).map(t => (
                    <button
                      key={t}
                      onClick={() => setTab(t)}
                      className="relative z-10 flex-1 py-2.5 text-sm font-semibold rounded-xl transition-colors duration-200"
                      style={{
                        color: tab === t ? 'white' : 'var(--text-secondary)',
                        fontFamily: 'Outfit, sans-serif',
                      }}
                    >
                      {t === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
                    </button>
                  ))}
                </div>

                {/* Form */}
                <AnimatePresence mode="wait">
                  {tab === 'login' ? (
                    <motion.div
                      key="login"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ duration: 0.22, ease: 'easeInOut' }}
                    >
                      <LoginForm onForgotPassword={() => setShowForgot(true)} />
                    </motion.div>
                  ) : (
                    <motion.div
                      key="register"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.22, ease: 'easeInOut' }}
                    >
                      <RegisterForm />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </motion.div>

      {/* Footer */}
      <p className="text-xs pb-4" style={{ color: 'var(--text-tertiary)' }}>
        Tus datos están protegidos y encriptados
      </p>
    </div>
  )
}
