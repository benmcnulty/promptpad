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
        className={`text-sm text-red-500 ${className}`}
        title={`Token counting error: ${error}`}
        aria-label={`${label}: Error`}
      >
        {label}: Error
      </span>
    )
  }

  return (
    <span 
      className={`text-sm text-gray-500 ${className}`}
      aria-label={`${label}: ${count}`}
    >
      {label}: {' '}
      <span className="font-mono">
        {showLoader && isLoading ? (
          <span className="opacity-50">...</span>
        ) : (
          count.toLocaleString()
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
        className={`font-mono text-xs text-red-500 ${className}`}
        title="Token counting error"
        aria-label="Token count error"
      >
        ERR
      </span>
    )
  }

  return (
    <span 
      className={`font-mono text-xs ${className}`}
      aria-label={`${count} tokens`}
    >
      {isLoading ? '...' : count.toLocaleString()}
    </span>
  )
}