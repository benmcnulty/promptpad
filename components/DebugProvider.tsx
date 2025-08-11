"use client"

import { createContext, useCallback, useContext, useState, ReactNode } from 'react'

interface DebugLog {
  timestamp: string
  type: "request" | "response" | "system"
  content: any
}

interface DebugContextValue {
  showDebug: boolean
  setShowDebug: (show: boolean) => void
  debugLogs: DebugLog[]
  addDebugLog: (type: "request" | "response" | "system", content: any) => void
  clearDebugLogs: () => void
  copySuccess: boolean
  copyDebugToClipboard: () => Promise<void>
}

const DebugContext = createContext<DebugContextValue | null>(null)

export function DebugProvider({ children }: { children: ReactNode }) {
  const [showDebug, setShowDebug] = useState(false)
  const [debugLogs, setDebugLogs] = useState<DebugLog[]>([])
  const [copySuccess, setCopySuccess] = useState(false)

  const addDebugLog = useCallback((type: "request" | "response" | "system", content: any) => {
    const timestamp = new Date().toISOString()
    setDebugLogs((prev) => [...prev.slice(-49), { timestamp, type, content }])
  }, [])

  const clearDebugLogs = useCallback(() => setDebugLogs([]), [])

  const copyDebugToClipboard = useCallback(async () => {
    try {
      const text = debugLogs
        .map((log) => {
          const payload = typeof log.content === 'string' ? log.content : JSON.stringify(log.content, null, 2)
          return `[${new Date(log.timestamp).toLocaleTimeString()}] ${log.type.toUpperCase()}\n${payload}`
        })
        .join('\n\n')
      await navigator.clipboard.writeText(text)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    } catch (err) {
      console.groupCollapsed('📋 Debug copy failed')
      console.error(err)
      console.groupEnd()
    }
  }, [debugLogs])

  const value = {
    showDebug,
    setShowDebug,
    debugLogs,
    addDebugLog,
    clearDebugLogs,
    copySuccess,
    copyDebugToClipboard
  }

  return (
    <DebugContext.Provider value={value}>
      {children}
    </DebugContext.Provider>
  )
}

export function useDebug() {
  const ctx = useContext(DebugContext)
  if (!ctx) throw new Error('useDebug must be used within DebugProvider')
  return ctx
}