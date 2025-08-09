'use client'

import { useEffect, useRef, useState } from 'react'

interface StatusBarProps {
  className?: string
}

export default function StatusBar({ className = '' }: StatusBarProps) {
  const [gitSha, setGitSha] = useState<string>('loading...')
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const inFlight = useRef<AbortController | null>(null)
  const intervalId = useRef<number | null>(null)
  const mounted = useRef<boolean>(false)

  useEffect(() => {
    // Get git SHA (placeholder for now)
    setGitSha('abc1234')
    
    // Check Ollama connection via API
    if (mounted.current) return
    mounted.current = true

    const checkOllamaStatus = async () => {
      if (inFlight.current) {
        inFlight.current.abort()
        inFlight.current = null
      }
      setOllamaStatus('checking')
      const ctrl = new AbortController()
      inFlight.current = ctrl
      try {
        const response = await fetch('/api/models', { signal: ctrl.signal })
        if (response.ok) setOllamaStatus('connected')
        else setOllamaStatus('error')
      } catch (error) {
        setOllamaStatus('error')
      } finally {
        inFlight.current = null
      }
    }

    // Initial check
    checkOllamaStatus()

    // Poll every 30 seconds with simple visibility-aware behavior
    const startPolling = () => {
      if (intervalId.current !== null) return
      intervalId.current = window.setInterval(() => {
        if (document.hidden) return
        checkOllamaStatus()
      }, 30000)
    }
    const stopPolling = () => {
      if (intervalId.current !== null) {
        clearInterval(intervalId.current)
        intervalId.current = null
      }
    }

    const onVisibility = () => {
      if (document.hidden) stopPolling()
      else startPolling()
    }

    document.addEventListener('visibilitychange', onVisibility)
    startPolling()

    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      stopPolling()
      if (inFlight.current) inFlight.current.abort()
      mounted.current = false
    }
  }, [])

  return (
    <div 
      className={`flex items-center justify-between px-4 py-2 bg-gray-100 border-t border-gray-200 text-sm text-gray-600 ${className}`}
      role="status"
      aria-label="Application status bar"
    >
      <div className="flex items-center space-x-4">
        <span className="flex items-center">
          <span className="text-gray-500 mr-1">Git:</span>
          <code className="bg-gray-200 px-1 rounded text-xs font-mono">
            {gitSha}
          </code>
        </span>
        
        <span className="flex items-center">
          <span className="text-gray-500 mr-1">Model:</span>
          <code className="bg-gray-200 px-1 rounded text-xs font-mono">
            gpt-oss:20b
          </code>
        </span>
      </div>

      <div className="flex items-center">
        <span className="text-gray-500 mr-2">Ollama:</span>
        <div className="flex items-center">
          <div 
            className={`w-2 h-2 rounded-full mr-2 ${
              ollamaStatus === 'connected' 
                ? 'bg-green-500' 
                : ollamaStatus === 'error'
                ? 'bg-red-500'
                : 'bg-yellow-500 animate-pulse'
            }`}
            aria-label={`Ollama status: ${ollamaStatus}`}
          />
          <span className="capitalize">{ollamaStatus}...</span>
        </div>
      </div>
    </div>
  )
}
