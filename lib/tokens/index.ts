/**
 * Token counting abstraction for Promptpad
 * Provides pluggable interface for different tokenization strategies
 */

export interface TokenCounter {
  count(text: string): number
  name: string
  version: string
}

export interface TokenCountResult {
  count: number
  counter: string
  version: string
  timestamp: number
}

export class TokenCountingService {
  private counter: TokenCounter
  private cache = new Map<string, TokenCountResult>()
  private maxCacheSize = 100

  constructor(counter: TokenCounter) {
    this.counter = counter
  }

  /**
   * Count tokens in text with caching
   */
  count(text: string): TokenCountResult {
    // Use trimmed text for consistent caching
    const normalizedText = text.trim()
    
    // Check cache first
    const cacheKey = this.getCacheKey(normalizedText)
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!
    }

    // Count tokens
    const count = normalizedText === '' ? 0 : this.counter.count(normalizedText)
    const result: TokenCountResult = {
      count,
      counter: this.counter.name,
      version: this.counter.version,
      timestamp: Date.now(),
    }

    // Cache the result with LRU eviction
    this.setCacheItem(cacheKey, result)

    return result
  }

  /**
   * Count tokens in multiple texts efficiently
   */
  countMultiple(texts: string[]): TokenCountResult[] {
    return texts.map(text => this.count(text))
  }

  /**
   * Switch to a different token counter
   */
  setCounter(counter: TokenCounter): void {
    if (counter.name !== this.counter.name || counter.version !== this.counter.version) {
      this.cache.clear() // Clear cache when switching counters
    }
    this.counter = counter
  }

  /**
   * Get current counter info
   */
  getCounterInfo(): Pick<TokenCounter, 'name' | 'version'> {
    return {
      name: this.counter.name,
      version: this.counter.version,
    }
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; maxSize: number; hitRate?: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
    }
  }

  private getCacheKey(text: string): string {
    // Simple hash for cache key to avoid storing full text
    let hash = 0
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return `${this.counter.name}:${this.counter.version}:${hash}`
  }

  private setCacheItem(key: string, value: TokenCountResult): void {
    // Simple LRU: if cache is full, remove oldest item
    if (this.cache.size >= this.maxCacheSize) {
      const firstKey = this.cache.keys().next().value
      if (firstKey) {
        this.cache.delete(firstKey)
      }
    }
    this.cache.set(key, value)
  }
}

// Types are already exported at the top of the file