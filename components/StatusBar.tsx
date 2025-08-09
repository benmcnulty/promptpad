'use client'

import { useEffect, useRef, useState } from 'react'

interface StatusBarProps {
  className?: string
  onDebugToggle?: (show: boolean) => void
  debugOpen?: boolean
}

export default function StatusBar({ className = '', onDebugToggle, debugOpen = false }: StatusBarProps) {
  const [gitSha, setGitSha] = useState<string>('loading...')
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'connected' | 'error'>('checking')
  const inFlight = useRef<AbortController | null>(null)
  const intervalId = useRef<number | null>(null)
  const mounted = useRef<boolean>(false)

  useEffect(() => {
    // Get git SHA from build time or runtime
    const getGitSha = async () => {
      try {
        // Try to fetch from a build-time generated file or API
        const response = await fetch('/api/git-info')
        if (response.ok) {
          const data = await response.json()
          setGitSha(data.sha || '0327471')
        } else {
          setGitSha('0327471')
        }
      } catch {
        setGitSha('0327471')
      }
    }
    getGitSha()
    
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
      className={`flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-3 glass border-t border-white/20 text-sm backdrop-blur-md ${className}`}
      role="status"
      aria-label="Application status bar"
    >
      <div className="flex flex-wrap items-center gap-3 sm:gap-4 mb-2 sm:mb-0">
        <span className="flex items-center">
          <span className="text-slate-600 mr-2 font-medium">Git:</span>
          <code className="bg-white/60 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-mono border border-white/40 text-slate-700 shadow-soft">
            {gitSha}
          </code>
        </span>
        
        <span className="flex items-center">
          <span className="text-slate-600 mr-2 font-medium">Model:</span>
          <code className="bg-white/60 backdrop-blur-sm px-2 py-1 rounded-md text-xs font-mono border border-white/40 text-slate-700 shadow-soft">
            gpt-oss:20b
          </code>
        </span>
      </div>

      <div className="flex items-center space-x-3">
        <span className="text-slate-600 font-medium">Ollama:</span>
        <div className="flex items-center bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-md border border-white/40 shadow-soft">
          <div 
            className={`w-2.5 h-2.5 rounded-full mr-2.5 transition-all duration-300 ${
              ollamaStatus === 'connected' 
                ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30' 
                : ollamaStatus === 'error'
                ? 'bg-red-500 shadow-lg shadow-red-500/30'
                : 'bg-amber-500 animate-pulse shadow-lg shadow-amber-500/30'
            }`}
            aria-label={`Ollama status: ${ollamaStatus}`}
          />
          <span className="capitalize font-medium text-slate-700">
            {ollamaStatus === 'checking' ? 'Checking...' : 
             ollamaStatus === 'connected' ? 'Connected' : 'Error'}
          </span>
        </div>
        
        {/* Debug Toggle */}
        {onDebugToggle && (
          <button
            onClick={() => onDebugToggle(!debugOpen)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 flex items-center space-x-1 ${
              debugOpen 
                ? 'bg-emerald-500 text-white shadow-lg' 
                : 'bg-white/60 text-slate-600 hover:bg-white/80 border border-white/40'
            }`}
            title="Toggle debug terminal"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M2 5a2 2 0 012-2h12a2 2 0 012 2v10a2 2 0 01-2 2H4a2 2 0 01-2-2V5zm3.293 1.293a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 01-1.414-1.414L7.586 10 5.293 7.707a1 1 0 010-1.414zM11 12a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" />
            </svg>
            <span>Debug</span>
          </button>
        )}
      </div>
    </div>
  )
}
