import { useState, useCallback } from 'react'
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { ExpensesProvider } from '@/contexts/ExpensesContext'
import { SplashScreen } from '@/components/auth/SplashScreen'
import { AuthScreen } from '@/components/auth/AuthScreen'
import { Dashboard } from '@/components/dashboard/Dashboard'
import { SettingsScreen } from '@/components/settings/SettingsScreen'
import { BottomNav } from '@/components/ui/BottomNav'

function AppShell() {
  const { session, loading } = useAuth()
  const [splashDone, setSplashDone] = useState(false)

  const handleSplashFinish = useCallback(() => setSplashDone(true), [])

  // Show splash until it completes its animation
  if (!splashDone) {
    return (
      <AnimatePresence mode="wait">
        <SplashScreen key="splash" onFinish={handleSplashFinish} />
      </AnimatePresence>
    )
  }

  // Auth loading after splash
  if (loading) return null

  if (!session) {
    return (
      <AnimatePresence mode="wait">
        <AuthScreen key="auth" />
      </AnimatePresence>
    )
  }

  return (
    <ExpensesProvider>
      <div className="relative">
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/settings" element={<SettingsScreen />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AnimatePresence>
        <BottomNav />
      </div>
    </ExpensesProvider>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <HashRouter>
        <AuthProvider>
          <div className="app-bg" style={{ minHeight: '100dvh' }}>
            <AppShell />
          </div>
        </AuthProvider>
      </HashRouter>
    </ThemeProvider>
  )
}
