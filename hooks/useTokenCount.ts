/**
 * React hook for real-time token counting
 * Provides debounced token counting to avoid blocking UI
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { TokenCountingService, type TokenCountResult } from '@/lib/tokens'
import { getDefaultTokenCounter } from '@/lib/tokens/tiktoken'

// Global service instance
let globalTokenService: TokenCountingService | null = null

function getTokenService(): TokenCountingService {
  if (!globalTokenService) {
    globalTokenService = new TokenCountingService(getDefaultTokenCounter())
  }
  return globalTokenService
}

export interface UseTokenCountOptions {
  debounceMs?: number
  enabled?: boolean
}

export interface UseTokenCountReturn {
  count: number
  isLoading: boolean
  error: string | null
  result: TokenCountResult | null
  refresh: () => void
}

export function useTokenCount(
  text: string,
  options: UseTokenCountOptions = {}
): UseTokenCountReturn {
  const { debounceMs = 300, enabled = true } = options

  const [result, setResult] = useState<TokenCountResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const tokenService = useMemo(() => getTokenService(), [])

  const performCount = useCallback((textToCount: string) => {
    if (!enabled) return

    setIsLoading(true)
    setError(null)

    try {
      // Use setTimeout to avoid blocking the main thread
      setTimeout(() => {
        try {
          const countResult = tokenService.count(textToCount)
          setResult(countResult)
          setError(null)
        } catch (err) {
          console.error('Token counting error:', err)
          setError(err instanceof Error ? err.message : 'Token counting failed')
          setResult(null)
        } finally {
          setIsLoading(false)
        }
      }, 0)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Token counting failed')
      setIsLoading(false)
    }
  }, [enabled, tokenService])

  // Debounced effect for token counting
  useEffect(() => {
    if (!enabled) {
      setResult(null)
      setIsLoading(false)
      setError(null)
      return
    }

    const timer = setTimeout(() => {
      performCount(text)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [text, debounceMs, enabled, performCount])

  const refresh = useCallback(() => {
    if (enabled) {
      performCount(text)
    }
  }, [text, enabled, performCount])

  return {
    count: result?.count ?? 0,
    isLoading,
    error,
    result,
    refresh,
  }
}

export function useTokenCountMultiple(
  texts: string[],
  options: UseTokenCountOptions = {}
): UseTokenCountReturn[] {
  const { debounceMs = 300, enabled = true } = options
  
  const [results, setResults] = useState<(TokenCountResult | null)[]>([])
  const [loading, setLoading] = useState<boolean[]>([])
  const [errors, setErrors] = useState<(string | null)[]>([])

  const tokenService = useMemo(() => getTokenService(), [])

  useEffect(() => {
    if (!enabled) {
      setResults(texts.map(() => null))
      setLoading(texts.map(() => false))
      setErrors(texts.map(() => null))
      return
    }

    const timer = setTimeout(() => {
      setLoading(texts.map(() => true))
      
      setTimeout(() => {
        try {
          const countResults = tokenService.countMultiple(texts)
          setResults(countResults)
          setErrors(texts.map(() => null))
        } catch (err) {
          console.error('Multiple token counting error:', err)
          const errorMsg = err instanceof Error ? err.message : 'Token counting failed'
          setErrors(texts.map(() => errorMsg))
          setResults(texts.map(() => null))
        } finally {
          setLoading(texts.map(() => false))
        }
      }, 0)
    }, debounceMs)

    return () => clearTimeout(timer)
  }, [texts, debounceMs, enabled, tokenService])

  return texts.map((_, index) => ({
    count: results[index]?.count ?? 0,
    isLoading: loading[index] ?? false,
    error: errors[index] ?? null,
    result: results[index] ?? null,
    refresh: () => {
      // Individual refresh not implemented for multiple
      // Use the single hook for individual control
    },
  }))
}

/**
 * Hook to access token service directly for advanced use cases
 */
export function useTokenService(): TokenCountingService {
  return useMemo(() => getTokenService(), [])
}