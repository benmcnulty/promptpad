"use client"

import { useEffect, useRef, useState } from 'react'
import { useTheme } from '@/components/ThemeProvider'
import { useDebug } from '@/components/DebugProvider'
import { useOllamaEndpoints } from '@/components/OllamaEndpointProvider'
import ThemeDropdown from '@/components/ThemeDropdown'
import ModelDropdown from '@/components/ModelDropdown'
import DebugTerminal from '@/components/shared/DebugTerminal'
import OllamaEndpointSlideout from '@/components/OllamaEndpointSlideout'

export default function AppFooter() {
  const [gitSha, setGitSha] = useState<string>('loading...')
  const [showEndpointSlideout, setShowEndpointSlideout] = useState(false)
  const mounted = useRef<boolean>(false)
  const { theme, toggleTheme } = useTheme()
  const { showDebug, setShowDebug } = useDebug()
  const { endpoints, getHealthyEndpoints } = useOllamaEndpoints()

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
    
    if (mounted.current) return
    mounted.current = true
    
    getGitSha()

    return () => {
      mounted.current = false
    }
  }, [])

  // Calculate aggregated Ollama status from all endpoints
  const getAggregatedOllamaStatus = () => {
    const healthyEndpoints = getHealthyEndpoints()
    const hasChecking = endpoints.some(ep => ep.healthStatus === 'checking')
    const hasError = endpoints.some(ep => ep.healthStatus === 'error')
    const hasHealthy = healthyEndpoints.length > 0

    if (hasChecking && !hasHealthy) return 'checking'
    if (hasHealthy) return 'connected'
    if (hasError) return 'error'
    return 'checking'
  }

  const aggregatedStatus = getAggregatedOllamaStatus()
  const healthyCount = getHealthyEndpoints().length

  return (
    <>
      {/* Debug Terminal */}
      <DebugTerminal />
      
      {/* Ollama Endpoint Management Slideout */}
      <OllamaEndpointSlideout 
        isOpen={showEndpointSlideout} 
        onClose={() => setShowEndpointSlideout(false)} 
      />
      
      {/* Status Bar Footer */}
      <footer 
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-3 glass border-t border-white/20 text-sm backdrop-blur-md"
        role="contentinfo"
      >
        <div
          role="status"
          aria-label="Application status bar"
          className="flex flex-col sm:flex-row items-start sm:items-center justify-between w-full"
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
            <ModelDropdown />
          </span>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-slate-600 font-medium">Ollama:</span>
          <button
            type="button"
            onClick={() => setShowEndpointSlideout(true)}
            className="flex items-center bg-white/60 backdrop-blur-sm px-3 py-1.5 rounded-md border border-white/40 shadow-soft hover:bg-white/80 hover:shadow-lg transition-all duration-200 cursor-pointer"
            title={`${healthyCount}/${endpoints.length} endpoints healthy - Click to manage`}
          >
            <div 
              className={`w-2.5 h-2.5 rounded-full mr-2.5 transition-all duration-300 status-indicator ${
                aggregatedStatus === 'connected' 
                  ? 'bg-emerald-500 shadow-lg shadow-emerald-500/30 status-connected' 
                  : aggregatedStatus === 'error'
                  ? 'bg-red-500 shadow-lg shadow-red-500/30 animate-gentle-bounce'
                  : 'bg-amber-500 animate-pulse shadow-lg shadow-amber-500/30 checking'
              }`}
              aria-label={`Ollama status: ${aggregatedStatus}`}
            />
            <span className="capitalize font-medium text-slate-700 mr-2">
              {aggregatedStatus === 'checking' ? 'Checking...' : 
               aggregatedStatus === 'connected' ? 'Connected' : 'Error'}
            </span>
            <span className="text-xs text-slate-500 bg-white/40 px-1.5 py-0.5 rounded font-medium">
              {healthyCount}/{endpoints.length}
            </span>
            <svg className="w-3 h-3 ml-1.5 text-slate-500" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
            </svg>
          </button>
          
          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 flex items-center space-x-1 bg-white/60 text-slate-600 hover:bg-white/80 border border-white/40"
            title="Toggle light/dark mode"
            aria-label="Toggle color theme"
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              {theme === 'dark' ? (
                <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4.22 2.03a1 1 0 011.415 1.414l-.708.707a1 1 0 11-1.414-1.414l.707-.707zM18 9a1 1 0 100 2h-1a1 1 0 100-2h1zM5.025 4.03a1 1 0 010 1.415L4.318 6.15a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM10 15a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zm6.364-2.95a1 1 0 00-1.414 1.414l.707.708a1 1 0 001.414-1.415l-.707-.707zM4.343 10a1 1 0 01-1 1H3a1 1 0 110-2h.343a1 1 0 011 1zm1.282 4.95a1 1 0 00-1.414 1.414l.707.708a1 1 0 001.414-1.415l-.707-.707zM14 10a4 4 0 11-8 0 4 4 0 018 0z" />
              ) : (
                <path fillRule="evenodd" d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" clipRule="evenodd" />
              )}
            </svg>
            <span>{theme === 'dark' ? 'Light' : 'Dark'}</span>
          </button>

          {/* Theme accent dropdown */}
          <ThemeDropdown />

          {/* Debug Toggle */}
          <button
            type="button"
            onClick={() => setShowDebug(!showDebug)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 flex items-center space-x-1 ${
              showDebug 
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
        </div>
        </div>
      </footer>
    </>
  )
}