type Urgency = 'green' | 'yellow' | 'red'

interface UrgencyBadgeProps {
  urgency: Urgency
  daysUntil: number
}

const config = {
  green: {
    bg: 'rgba(52, 211, 153, 0.12)',
    border: 'rgba(52, 211, 153, 0.3)',
    color: '#34d399',
    icon: '✓',
  },
  yellow: {
    bg: 'rgba(251, 191, 36, 0.12)',
    border: 'rgba(251, 191, 36, 0.3)',
    color: '#fbbf24',
    icon: '⚠',
  },
  red: {
    bg: 'rgba(248, 113, 113, 0.12)',
    border: 'rgba(248, 113, 113, 0.3)',
    color: '#f87171',
    icon: '!',
  },
}

export function UrgencyBadge({ urgency, daysUntil }: UrgencyBadgeProps) {
  const c = config[urgency]
  const label =
    daysUntil === 0
      ? 'Hoy'
      : daysUntil === 1
        ? 'Mañana'
        : `${daysUntil} días`

  return (
    <span
      className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full"
      style={{ background: c.bg, border: `1px solid ${c.border}`, color: c.color }}
    >
      <span className="text-[10px] font-bold">{c.icon}</span>
      {label}
    </span>
  )
}
