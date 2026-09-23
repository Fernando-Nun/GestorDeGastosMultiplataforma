import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { LogoPlaceholder } from '@/components/ui/LogoPlaceholder'

interface SplashScreenProps {
  onFinish: () => void
}

export function SplashScreen({ onFinish }: SplashScreenProps) {
  useEffect(() => {
    const timer = setTimeout(onFinish, 2400)
    return () => clearTimeout(timer)
  }, [onFinish])

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center app-bg"
      style={{ zIndex: 1000 }}
      initial={{ opacity: 1, scale: 1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{
        opacity: 0,
        scale: 1.08,
        transition: { duration: 0.55, ease: [0.32, 0, 0.67, 0] },
      }}
    >
      {/* Background glow orbs */}
      <motion.div
        className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
        style={{
          width: 320,
          height: 320,
          background: 'radial-gradient(circle, rgba(124,92,252,0.25) 0%, transparent 70%)',
          filter: 'blur(40px)',
        }}
        animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
      />

      <div className="flex flex-col items-center gap-6">
        <motion.div
          initial={{ scale: 0.5, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.34, 1.56, 0.64, 1], delay: 0.1 }}
        >
          <LogoPlaceholder size="lg" />
        </motion.div>

        <motion.p
          className="text-sm font-medium"
          style={{ color: 'var(--text-tertiary)', fontFamily: 'Inter, sans-serif' }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          Gestiona tus suscripciones
        </motion.p>

        <motion.div
          className="flex gap-1.5 mt-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
        >
          {[0, 0.15, 0.3].map((delay, i) => (
            <motion.span
              key={i}
              className="w-1.5 h-1.5 rounded-full"
              style={{ background: 'var(--accent)' }}
              animate={{ scale: [1, 1.6, 1], opacity: [0.4, 1, 0.4] }}
              transition={{ repeat: Infinity, duration: 1, delay, ease: 'easeInOut' }}
            />
          ))}
        </motion.div>
      </div>
    </motion.div>
  )
}
