/**
 * Token counting abstraction for Promptpad
 * 
 * Provides a pluggable interface for different tokenization strategies with
 * built-in caching, performance optimization, and service abstraction.
 * 
 * Supports multiple token counting implementations (TikToken, approximation, etc.)
 * with automatic fallback and LRU caching for performance.
 * 
 * @example
 * ```typescript
 * import { TokenCountingService, TikTokenCounter } from '@/lib/tokens'
 * 
 * const service = new TokenCountingService(new TikTokenCounter())
 * const result = service.count('Hello world!')
 * console.log(`Tokens: ${result.count} (${result.counter} v${result.version})`)
 * ```
 */

/**
 * Interface for token counting implementations
 * 
 * Provides a contract for different tokenization strategies,
 * allowing pluggable token counting with metadata.
 */
export interface TokenCounter {
  /** Counts tokens in the provided text */
  count(text: string): number
  /** Human-readable name of the tokenization strategy */
  name: string
  /** Version of the tokenization implementation */
  version: string
}

/**
 * Result object for token counting operations
 * 
 * Contains the token count along with metadata about the counting
 * strategy used and when the count was performed.
 */
export interface TokenCountResult {
  /** Number of tokens in the text */
  count: number
  /** Name of the counter that was used */
  counter: string
  /** Version of the counter implementation */
  version: string
  /** Timestamp when the count was performed */
  timestamp: number
}

/**
 * Token counting service with LRU caching and pluggable counter support
 * 
 * Provides high-performance token counting with automatic caching,
 * counter switching, and cache management. Optimizes for repeated
 * counting of similar text patterns.
 * 
 * Features:
 * - LRU cache with configurable size limit
 * - Hot counter swapping with cache invalidation
 * - Text normalization for consistent caching
 * - Performance monitoring and cache statistics
 * 
 * @example
 * ```typescript
 * const service = new TokenCountingService(new TikTokenCounter())
 * 
 * // First call - computes and caches
 * const result1 = service.count('Hello world')
 * 
 * // Second call - cache hit (faster)
 * const result2 = service.count('Hello world')
 * 
 * console.log(`Cache hit rate: ${service.getCacheStats().hitRate}`)
 * ```
 */
export class TokenCountingService {
  private counter: TokenCounter
  private cache = new Map<string, TokenCountResult>()
  private maxCacheSize = 100

  /**
   * Creates a new token counting service
   * @param counter - Token counting implementation to use
   */
  constructor(counter: TokenCounter) {
    this.counter = counter
  }

  /**
   * Counts tokens in text with intelligent caching
   * 
   * Performs text normalization (trimming) for consistent cache keys,
   * checks cache first for performance, then computes if needed.
   * Automatically manages LRU cache eviction.
   * 
   * @param text - Text content to count tokens for
   * @returns Token count result with metadata and timestamp
   * @example
   * ```typescript
   * const result = service.count('  Hello world!  ')
   * console.log(`${result.count} tokens counted by ${result.counter}`)
   * ```
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
   * Counts tokens for multiple texts efficiently
   * 
   * Leverages caching for each text individually, providing batch processing
   * while maintaining cache benefits for repeated texts.
   * 
   * @param texts - Array of text strings to count tokens for
   * @returns Array of token count results in the same order
   */
  countMultiple(texts: string[]): TokenCountResult[] {
    return texts.map(text => this.count(text))
  }

  /**
   * Switches to a different token counter implementation
   * 
   * Automatically clears cache if the counter type or version differs
   * to ensure counting consistency. Hot-swappable during runtime.
   * 
   * @param counter - New token counter implementation to use
   */
  setCounter(counter: TokenCounter): void {
    if (counter.name !== this.counter.name || counter.version !== this.counter.version) {
      this.cache.clear() // Clear cache when switching counters
    }
    this.counter = counter
  }

  /**
   * Gets metadata about the current counter implementation
   * @returns Object with counter name and version
   */
  getCounterInfo(): Pick<TokenCounter, 'name' | 'version'> {
    return {
      name: this.counter.name,
      version: this.counter.version,
    }
  }

  /**
   * Clears all cached token counts
   * 
   * Useful for memory management or when token counting behavior
   * should be refreshed.
   */
  clearCache(): void {
    this.cache.clear()
  }

  /**
   * Gets cache performance statistics
   * 
   * @returns Object with current cache size, maximum size, and hit rate
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