'use client'

import { useEffect, useState } from 'react'

interface StatusBarProps {
  className?: string
}

export default function StatusBar({ className = '' }: StatusBarProps) {
  const [gitSha, setGitSha] = useState<string>('loading...')
  const [ollamaStatus, setOllamaStatus] = useState<'checking' | 'connected' | 'error'>('checking')

  useEffect(() => {
    // Get git SHA (placeholder for now)
    setGitSha('abc1234')
    
    // Check Ollama connection via API
    const checkOllamaStatus = async () => {
      setOllamaStatus('checking')
      try {
        const response = await fetch('/api/models')
        if (response.ok) {
          setOllamaStatus('connected')
        } else {
          setOllamaStatus('error')
        }
      } catch (error) {
        setOllamaStatus('error')
      }
    }

    checkOllamaStatus()
    
    // Poll every 10 seconds to keep status updated
    const interval = setInterval(checkOllamaStatus, 10000)
    return () => clearInterval(interval)
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