import { TokenCountingService } from '@/lib/tokens'
import type { TokenCounter } from '@/lib/tokens'

// Mock token counter for testing
class MockTokenCounter implements TokenCounter {
  readonly name = 'mock'
  readonly version = '1.0.0'

  count(text: string): number {
    // Simple word-based counting for predictable tests
    return text.trim().split(/\s+/).filter(word => word.length > 0).length
  }
}

describe('TokenCountingService', () => {
  let service: TokenCountingService
  let mockCounter: MockTokenCounter

  beforeEach(() => {
    mockCounter = new MockTokenCounter()
    service = new TokenCountingService(mockCounter)
  })

  afterEach(() => {
    service.clearCache()
  })

  describe('count', () => {
    it('counts tokens in text', () => {
      const result = service.count('hello world test')
      
      expect(result.count).toBe(3)
      expect(result.counter).toBe('mock')
      expect(result.version).toBe('1.0.0')
      expect(result.timestamp).toBeGreaterThan(0)
    })

    it('handles empty text', () => {
      const result = service.count('')
      expect(result.count).toBe(0)
    })

    it('handles whitespace-only text', () => {
      const result = service.count('   \n\t  ')
      expect(result.count).toBe(0)
    })

    it('normalizes text for caching', () => {
      const result1 = service.count('  hello world  ')
      const result2 = service.count('hello world')
      
      // Should be cached and identical
      expect(result1.count).toBe(result2.count)
      expect(result1.timestamp).toBe(result2.timestamp)
    })

    it('caches results', () => {
      const text = 'test caching behavior'
      const result1 = service.count(text)
      const result2 = service.count(text)
      
      // Should return same cached result
      expect(result1).toBe(result2)
    })

    it('manages cache size with LRU eviction', () => {
      // Set up service to test cache eviction (we'll generate many different texts)
      for (let i = 0; i < 150; i++) {
        service.count(`test text number ${i}`)
      }
      
      const cacheStats = service.getCacheStats()
      expect(cacheStats.size).toBeLessThanOrEqual(cacheStats.maxSize)
    })
  })

  describe('countMultiple', () => {
    it('counts multiple texts', () => {
      const texts = ['hello world', 'test one two three', 'single']
      const results = service.countMultiple(texts)
      
      expect(results).toHaveLength(3)
      expect(results[0].count).toBe(2)
      expect(results[1].count).toBe(4)
      expect(results[2].count).toBe(1)
    })

    it('handles empty array', () => {
      const results = service.countMultiple([])
      expect(results).toEqual([])
    })
  })

  describe('setCounter', () => {
    it('switches to new counter', () => {
      class NewMockCounter implements TokenCounter {
        readonly name = 'new-mock'
        readonly version = '2.0.0'
        count(text: string): number {
          return text.length // Character-based counting
        }
      }

      const newCounter = new NewMockCounter()
      service.setCounter(newCounter)
      
      const result = service.count('hi')
      expect(result.count).toBe(2) // Character count, not word count
      expect(result.counter).toBe('new-mock')
      expect(result.version).toBe('2.0.0')
    })

    it('clears cache when switching counters', () => {
      service.count('cached text')
      expect(service.getCacheStats().size).toBe(1)
      
      const newCounter = new MockTokenCounter()
      // Change version to trigger cache clear
      Object.defineProperty(newCounter, 'version', { value: '2.0.0' })
      service.setCounter(newCounter)
      
      expect(service.getCacheStats().size).toBe(0)
    })
  })

  describe('cache management', () => {
    it('provides cache statistics', () => {
      const stats = service.getCacheStats()
      expect(stats).toHaveProperty('size')
      expect(stats).toHaveProperty('maxSize')
      expect(stats.size).toBe(0)
      expect(stats.maxSize).toBe(100)
    })

    it('clears cache', () => {
      service.count('test')
      expect(service.getCacheStats().size).toBe(1)
      
      service.clearCache()
      expect(service.getCacheStats().size).toBe(0)
    })
  })

  describe('getCounterInfo', () => {
    it('returns counter information', () => {
      const info = service.getCounterInfo()
      expect(info.name).toBe('mock')
      expect(info.version).toBe('1.0.0')
    })
  })
})