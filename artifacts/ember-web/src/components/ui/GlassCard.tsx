import type { ReactNode, HTMLAttributes } from 'react'

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode
  strong?: boolean
  radius?: string
  padding?: string
}

export function GlassCard({
  children,
  strong = false,
  radius = 'rounded-2xl',
  padding = 'p-5',
  className = '',
  ...props
}: GlassCardProps) {
  return (
    <div
      className={`${strong ? 'glass-strong' : 'glass'} ${radius} ${padding} ${className}`}
      style={{ color: 'var(--text-primary)' }}
      {...props}
    >
      {children}
    </div>
  )
}
