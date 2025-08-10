/**
 * TikToken implementation for token counting
 * Uses @dqbd/tiktoken on the server-side only; falls back to a heuristic in the browser.
 */

import type { TokenCounter } from './index'

export class TikTokenCounter implements TokenCounter {
  readonly name = 'tiktoken'
  readonly version = '1.0.0'
  
  // Use `any` to avoid importing WASM module on the client bundle
  private encoder: any | null = null
  private modelName: string

  constructor(modelName: string = 'gpt-4o') {
    this.modelName = modelName
    // Initialize encoder only on the server to avoid bundling WASM in client
    if (typeof window === 'undefined') {
      try {
        const { get_encoding } = require('@dqbd/tiktoken')
        this.encoder = get_encoding('cl100k_base')
      } catch (error) {
        // Structured TikToken initialization warning for developers
        console.groupCollapsed('⚠️ TikToken initialization failed')
        console.warn(`Model: ${modelName}`)
        console.warn(`Environment: Server-side`)
        console.warn(`Fallback: Heuristic counting`)
        console.warn(`Error:`, error)
        console.groupEnd()
        this.encoder = null
      }
    }
  }

  count(text: string): number {
    if (!text || text.trim() === '') {
      return 0
    }

    if (this.encoder) {
      try {
        const tokens = this.encoder.encode(text)
        return tokens.length
      } catch (error) {
        // Structured TikToken counting warning for developers
        console.groupCollapsed('⚠️ TikToken counting failed')
        console.warn(`Text length: ${text.length} chars`)
        console.warn(`Model: ${this.modelName}`)
        console.warn(`Fallback: Heuristic counting`)
        console.warn(`Error:`, error)
        console.groupEnd()
      }
    }

    // Heuristic fallback for browser or when encoder is unavailable
    const wordCount = text.split(/\s+/).filter(word => word.length > 0).length
    const charCount = text.length
    return Math.max(wordCount, Math.ceil(charCount / 4))
  }

  /**
   * Free the encoder resources when done
   */
  free(): void {
    if (this.encoder && typeof this.encoder.free === 'function') {
      try {
        this.encoder.free()
      } catch (error) {
        // Structured TikToken cleanup warning for developers  
        console.groupCollapsed('⚠️ TikToken encoder cleanup failed')
        console.warn(`Model: ${this.modelName}`)
        console.warn(`Impact: Memory leak possible`)
        console.warn(`Error:`, error)
        console.groupEnd()
      }
    }
  }

  /**
   * Get model name this counter is configured for
   */
  getModelName(): string {
    return this.modelName
  }
}

// Default instance for app-wide use
let defaultCounter: TikTokenCounter | null = null

export function getDefaultTokenCounter(): TikTokenCounter {
  if (!defaultCounter) {
    defaultCounter = new TikTokenCounter('gpt-oss:20b')
  }
  return defaultCounter
}

export function setDefaultModel(modelName: string): void {
  // Free existing counter if it exists
  if (defaultCounter) {
    defaultCounter.free()
  }
  defaultCounter = new TikTokenCounter(modelName)
}
