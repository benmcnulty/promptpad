/**
 * Token counter display component
 * Shows real-time token count with loading and error states
 */

'use client'

import { useTokenCount } from '@/hooks/useTokenCount'

interface TokenCounterProps {
  text: string
  className?: string
  showLoader?: boolean
  enabled?: boolean
  label?: string
}

export default function TokenCounter({ 
  text, 
  className = '',
  showLoader = true,
  enabled = true,
  label = 'Tokens'
}: TokenCounterProps) {
  const { count, isLoading, error } = useTokenCount(text, { 
    enabled,
    debounceMs: 300 
  })

  if (error) {
    return (
      <span 
        className={`flex items-center bg-red-50/90 backdrop-blur-sm text-red-700 px-3 py-2 rounded-lg text-sm font-medium border border-red-200/60 shadow-soft ${className}`}
        title={`Token counting error: ${error}`}
        aria-label={`${label}: Error`}
      >
        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.19-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
        {label}: Error
      </span>
    )
  }

  return (
    <span 
      className={`flex items-center bg-white/70 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-medium border border-white/50 shadow-soft hover:bg-white/80 transition-colors duration-200 ${className}`}
      aria-label={`${label}: ${count}`}
    >
      <span className="text-slate-600 font-medium">{label}:</span>
      <span className="font-mono ml-3 text-base">
        {showLoader && isLoading ? (
          <span className="animate-pulse text-slate-500 font-medium">⋯</span>
        ) : (
          <span className="text-gradient font-bold">
            {count.toLocaleString()}
          </span>
        )}
      </span>
    </span>
  )
}

/**
 * Compact token counter for inline use
 */
export function CompactTokenCounter({ 
  text, 
  className = '' 
}: { text: string; className?: string }) {
  const { count, isLoading, error } = useTokenCount(text)

  if (error) {
    return (
      <span 
        className={`font-mono text-xs text-red-600 bg-red-50 px-1.5 py-0.5 rounded border ${className}`}
        title="Token counting error"
        aria-label="Token count error"
      >
        ERR
      </span>
    )
  }

  return (
    <span 
      className={`font-mono text-xs text-gradient font-semibold ${className}`}
      aria-label={`${count} tokens`}
    >
      {isLoading ? '⋯' : count.toLocaleString()}
    </span>
  )
}