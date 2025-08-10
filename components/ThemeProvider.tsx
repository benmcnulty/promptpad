"use client"

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark'
type Accent = 'emerald' | 'sapphire' | 'violet' | 'coral' | 'golden'

interface ThemeContextValue {
  theme: Theme
  accent: Accent
  toggleTheme: () => void
  setAccent: (a: Accent) => void
  accents: Accent[]
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

const THEME_KEY = 'promptpad-theme'
const ACCENT_KEY = 'promptpad-accent'

const ACCENTS: Accent[] = ['emerald', 'sapphire', 'violet', 'coral', 'golden']

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [accent, setAccentState] = useState<Accent>('emerald')

  // Initialize from localStorage / system
  useLayoutEffect(() => {
    try {
      const storedTheme = localStorage.getItem(THEME_KEY) as Theme | null
      if (storedTheme === 'light' || storedTheme === 'dark') {
        setTheme(storedTheme)
      } else {
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        setTheme(prefersDark ? 'dark' : 'light')
      }
      const storedAccent = localStorage.getItem(ACCENT_KEY) as Accent | null
      if (storedAccent && ACCENTS.includes(storedAccent)) setAccentState(storedAccent)
    } catch {
      /* no-op */
    }
  }, [])

  // Apply attributes + persist
  useLayoutEffect(() => {
    const root = document.documentElement
    root.dataset.theme = theme
    try { localStorage.setItem(THEME_KEY, theme) } catch {}
  }, [theme])

  useLayoutEffect(() => {
    const root = document.documentElement
    root.dataset.accent = accent
    try { localStorage.setItem(ACCENT_KEY, accent) } catch {}
  }, [accent])

  const toggleTheme = useCallback(() => {
    setTheme(t => t === 'light' ? 'dark' : 'light')
  }, [])

  const setAccent = useCallback((a: Accent) => setAccentState(a), [])

  const value = useMemo<ThemeContextValue>(() => ({ theme, accent, toggleTheme, setAccent, accents: ACCENTS }), [theme, accent, toggleTheme, setAccent])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
