import type { ReactNode, ButtonHTMLAttributes } from 'react'

interface GlassButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode
  variant?: 'primary' | 'ghost' | 'danger'
  size?: 'sm' | 'md' | 'lg'
  fullWidth?: boolean
  loading?: boolean
}

export function GlassButton({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  loading = false,
  className = '',
  disabled,
  ...props
}: GlassButtonProps) {
  const base =
    'relative inline-flex items-center justify-center font-semibold transition-all duration-200 active:scale-95 select-none overflow-hidden'

  const sizeMap = {
    sm: 'px-4 py-2 text-sm rounded-xl',
    md: 'px-6 py-3 text-[15px] rounded-[14px]',
    lg: 'px-8 py-4 text-base rounded-[16px]',
  }

  const variantMap = {
    primary: 'text-white accent-glow',
    ghost: 'glass text-[var(--text-primary)] hover:bg-white/10',
    danger: 'text-white',
  }

  const bgStyle =
    variant === 'primary'
      ? { background: 'linear-gradient(135deg, #7c5cfc, #5a3de8)' }
      : variant === 'danger'
        ? { background: 'linear-gradient(135deg, #ef4444, #dc2626)' }
        : {}

  return (
    <button
      className={`${base} ${sizeMap[size]} ${variantMap[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
      style={bgStyle}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeDasharray="31.4" strokeDashoffset="10" />
          </svg>
          Cargando...
        </span>
      ) : (
        children
      )}
    </button>
  )
}
