interface LogoPlaceholderProps {
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
  name?: string
}

export function LogoPlaceholder({ size = 'md', showName = true, name = 'Ember' }: LogoPlaceholderProps) {
  const sizeMap = {
    sm: { icon: 32, text: 'text-lg', gap: 'gap-2' },
    md: { icon: 56, text: 'text-2xl', gap: 'gap-3' },
    lg: { icon: 80, text: 'text-3xl', gap: 'gap-4' },
  }
  const s = sizeMap[size]

  return (
    <div className={`flex flex-col items-center ${s.gap}`}>
      {/* Logo placeholder — replace this with your <img src="/logo.png" /> */}
      <div
        className="relative rounded-[28%] flex items-center justify-center overflow-hidden accent-glow"
        style={{
          width: s.icon,
          height: s.icon,
          background: 'linear-gradient(135deg, #7c5cfc 0%, #3b1fa8 100%)',
          boxShadow: '0 8px 32px rgba(124,92,252,0.5), inset 0 1px 0 rgba(255,255,255,0.2)',
        }}
      >
        <svg width={s.icon * 0.55} height={s.icon * 0.55} viewBox="0 0 32 32" fill="none">
          <path
            d="M16 4C16 4 8 12 8 19C8 23.4 11.6 27 16 27C20.4 27 24 23.4 24 19C24 12 16 4 16 4Z"
            fill="rgba(255,255,255,0.9)"
          />
          <path
            d="M16 13C16 13 11 17.5 11 21C11 23.2 13.2 25 16 25C18.8 25 21 23.2 21 21C21 17.5 16 13 16 13Z"
            fill="rgba(255,255,255,0.4)"
          />
        </svg>
      </div>
      {showName && (
        <span
          className={`font-bold tracking-tight ${s.text}`}
          style={{ fontFamily: 'Outfit, sans-serif', color: 'var(--text-primary)' }}
        >
          {name}
        </span>
      )}
    </div>
  )
}
