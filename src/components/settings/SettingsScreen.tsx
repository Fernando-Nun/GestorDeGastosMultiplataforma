import { useState } from 'react'
import { motion } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { GlassCard } from '@/components/ui/GlassCard'
import { LogoPlaceholder } from '@/components/ui/LogoPlaceholder'

interface ToggleProps {
  enabled: boolean
  onChange: (v: boolean) => void
}

function Toggle({ enabled, onChange }: ToggleProps) {
  return (
    <button
      role="switch"
      aria-checked={enabled}
      onClick={() => onChange(!enabled)}
      className="relative w-12 h-6 rounded-full transition-all duration-300 active:scale-95"
      style={{ background: enabled ? 'var(--accent)' : 'rgba(255,255,255,0.15)' }}
    >
      <motion.span
        className="absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md"
        animate={{ x: enabled ? 26 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  )
}

interface SettingRowProps {
  icon: React.ReactNode
  title: string
  description?: string
  control: React.ReactNode
}

function SettingRow({ icon, title, description, control }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between gap-3 py-4" style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(124,92,252,0.1)' }}
        >
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {title}
          </p>
          {description && (
            <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--text-tertiary)' }}>
              {description}
            </p>
          )}
        </div>
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  )
}

export function SettingsScreen() {
  const { theme, toggleTheme, isDark } = useTheme()
  const { user, signOut } = useAuth()
  const [silentNotifications, setSilentNotifications] = useState(() => {
    return localStorage.getItem('ember-silent-notifs') === 'true'
  })
  const [baseCurrency, setBaseCurrency] = useState<'MXN' | 'USD'>(() => {
    return (localStorage.getItem('ember-base-currency') as 'MXN' | 'USD') ?? 'MXN'
  })
  const [signingOut, setSigningOut] = useState(false)

  const handleSilentToggle = (v: boolean) => {
    setSilentNotifications(v)
    localStorage.setItem('ember-silent-notifs', String(v))
  }

  const handleCurrencyChange = (v: 'MXN' | 'USD') => {
    setBaseCurrency(v)
    localStorage.setItem('ember-base-currency', v)
  }

  const handleSignOut = async () => {
    setSigningOut(true)
    await signOut()
  }

  return (
    <div className="min-h-dvh app-bg mobile-container flex flex-col pb-28">
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <motion.h1
          className="text-2xl font-bold mb-6"
          style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
        >
          Ajustes
        </motion.h1>

        {/* App identity card */}
        <GlassCard strong radius="rounded-3xl" padding="p-5" className="mb-5">
          <div className="flex items-center gap-4">
            <LogoPlaceholder size="sm" showName={false} />
            <div>
              <p className="font-bold text-base" style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}>
                Ember
              </p>
              <p className="text-xs mt-0.5" style={{ color: 'var(--text-tertiary)' }}>
                Gestor de suscripciones
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Account section */}
        <GlassCard radius="rounded-2xl" padding="px-4 py-2" className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-widest pt-3 pb-2" style={{ color: 'var(--text-tertiary)' }}>
            Cuenta
          </p>
          <SettingRow
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            }
            title="Correo electrónico"
            description={user?.email ?? '—'}
            control={<span className="text-xs font-medium px-2 py-1 rounded-lg glass" style={{ color: 'var(--text-secondary)' }}>Verificado</span>}
          />
          <div className="py-3" style={{ borderBottom: 'none' }}>
            <button
              onClick={handleSignOut}
              disabled={signingOut}
              className="w-full py-3 rounded-xl text-sm font-semibold transition-all active:scale-95"
              style={{ background: 'rgba(248,113,113,0.1)', color: '#f87171', border: '1px solid rgba(248,113,113,0.2)' }}
            >
              {signingOut ? 'Cerrando sesión...' : 'Cerrar sesión'}
            </button>
          </div>
        </GlassCard>

        {/* Appearance section */}
        <GlassCard radius="rounded-2xl" padding="px-4 py-2" className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-widest pt-3 pb-2" style={{ color: 'var(--text-tertiary)' }}>
            Apariencia
          </p>
          <SettingRow
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                {isDark ? (
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                ) : (
                  <>
                    <circle cx="12" cy="12" r="5" />
                    <line x1="12" y1="1" x2="12" y2="3" />
                    <line x1="12" y1="21" x2="12" y2="23" />
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
                    <line x1="1" y1="12" x2="3" y2="12" />
                    <line x1="21" y1="12" x2="23" y2="12" />
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
                  </>
                )}
              </svg>
            }
            title="Tema"
            description={isDark ? 'Modo oscuro activo' : 'Modo claro activo'}
            control={<Toggle enabled={isDark} onChange={() => toggleTheme()} />}
          />
          <SettingRow
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            }
            title="Moneda base"
            description="Moneda para mostrar totales"
            control={
              <div className="flex rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)' }}>
                {(['MXN', 'USD'] as const).map(c => (
                  <button
                    key={c}
                    onClick={() => handleCurrencyChange(c)}
                    className="px-3 py-1.5 text-xs font-semibold transition-all"
                    style={{
                      background: baseCurrency === c ? 'var(--accent)' : 'transparent',
                      color: baseCurrency === c ? 'white' : 'var(--text-secondary)',
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
            }
          />
        </GlassCard>

        {/* Notifications section */}
        <GlassCard radius="rounded-2xl" padding="px-4 py-2" className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-widest pt-3 pb-2" style={{ color: 'var(--text-tertiary)' }}>
            Notificaciones
          </p>
          <SettingRow
            icon={
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                {silentNotifications && <line x1="1" y1="1" x2="23" y2="23" />}
              </svg>
            }
            title="Notificaciones silenciosas"
            description="Recibe recordatorios sin sonido"
            control={<Toggle enabled={silentNotifications} onChange={handleSilentToggle} />}
          />
          <div className="pb-3 pt-2">
            <div
              className="rounded-xl p-3"
              style={{ background: 'rgba(124,92,252,0.05)', border: '1px solid rgba(124,92,252,0.1)' }}
            >
              <p className="text-xs leading-relaxed" style={{ color: 'var(--text-tertiary)' }}>
                Los recordatorios aparecen cuando abres la app. Para notificaciones push en tu dispositivo, actívalas desde la configuración del navegador.
              </p>
            </div>
          </div>
        </GlassCard>

        {/* App info */}
        <div className="text-center py-4">
          <p className="text-xs" style={{ color: 'var(--text-tertiary)' }}>
            Ember v1.0.0 — Desarrollado con ♥
          </p>
        </div>
      </div>
    </div>
  )
}
