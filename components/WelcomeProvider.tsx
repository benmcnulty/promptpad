"use client"

import { createContext, useCallback, useContext, useEffect, useState, ReactNode } from 'react'

interface WelcomeContextValue {
  showWelcome: boolean
  setShowWelcome: (show: boolean) => void
  dontShowAgain: boolean
  setDontShowAgain: (dontShow: boolean) => void
  dismissWelcome: () => void
  resetWelcome: () => void
}

const WelcomeContext = createContext<WelcomeContextValue | null>(null)

export function WelcomeProvider({ children }: { children: ReactNode }) {
  const [showWelcome, setShowWelcome] = useState(true)
  const [dontShowAgain, setDontShowAgain] = useState(false)

  // Initialize from localStorage
  useEffect(() => {
    const dismissed = localStorage.getItem("promptpad-welcome-dismissed")
    if (dismissed === "true") setShowWelcome(false)
  }, [])

  const dismissWelcome = useCallback(() => {
    if (dontShowAgain) localStorage.setItem("promptpad-welcome-dismissed", "true")
    setShowWelcome(false)
  }, [dontShowAgain])

  const resetWelcome = useCallback(() => {
    localStorage.removeItem('promptpad-welcome-dismissed')
    localStorage.removeItem('promptpad-accent')
    localStorage.removeItem('promptpad-model')
    setShowWelcome(true)
    setDontShowAgain(false)
  }, [])

  // Keyboard handler for ESC key
  useEffect(() => {
    if (!showWelcome) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismissWelcome()
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [showWelcome, dismissWelcome])

  const value = {
    showWelcome,
    setShowWelcome,
    dontShowAgain,
    setDontShowAgain,
    dismissWelcome,
    resetWelcome
  }

  return (
    <WelcomeContext.Provider value={value}>
      {children}
    </WelcomeContext.Provider>
  )
}

export function useWelcome() {
  const ctx = useContext(WelcomeContext)
  if (!ctx) throw new Error('useWelcome must be used within WelcomeProvider')
  return ctx
}