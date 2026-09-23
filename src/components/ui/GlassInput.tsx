import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'

interface GlassInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  icon?: React.ReactNode
  suffix?: React.ReactNode
}

export function GlassInput({ label, error, icon, suffix, className = '', id, ...props }: GlassInputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={inputId} className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-tertiary)]">
            {icon}
          </span>
        )}
        <input
          id={inputId}
          className={`glass-input w-full rounded-[12px] px-4 py-3 text-sm font-medium transition-all duration-200 ${icon ? 'pl-10' : ''} ${suffix ? 'pr-16' : ''} ${className}`}
          style={{
            background: 'var(--input-bg)',
            border: '1px solid var(--input-border)',
            color: 'var(--text-primary)',
            backdropFilter: 'blur(12px)',
          }}
          {...props}
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <p className="text-xs font-medium" style={{ color: 'var(--color-urgent-red)' }}>
          {error}
        </p>
      )}
    </div>
  )
}

interface GlassSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  options: { value: string; label: string }[]
}

export function GlassSelect({ label, error, options, className = '', id, ...props }: GlassSelectProps) {
  const selectId = id ?? label.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={selectId} className="text-xs font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
        {label}
      </label>
      <select
        id={selectId}
        className={`w-full rounded-[12px] px-4 py-3 text-sm font-medium transition-all duration-200 appearance-none ${className}`}
        style={{
          background: 'var(--input-bg)',
          border: '1px solid var(--input-border)',
          color: 'var(--text-primary)',
          backdropFilter: 'blur(12px)',
        }}
        {...props}
      >
        {options.map(o => (
          <option key={o.value} value={o.value} style={{ background: '#1a1a2e', color: 'white' }}>
            {o.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-xs font-medium" style={{ color: 'var(--color-urgent-red)' }}>
          {error}
        </p>
      )}
    </div>
  )
}
