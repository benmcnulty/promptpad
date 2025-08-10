import { TikTokenCounter, getDefaultTokenCounter, setDefaultModel } from '@/lib/tokens/tiktoken'

describe('TikTokenCounter', () => {
  let counter: TikTokenCounter

  beforeEach(() => {
    counter = new TikTokenCounter()
  })

  afterEach(() => {
    counter.free()
  })

  describe('count', () => {
    it('counts tokens in simple text', () => {
      const result = counter.count('hello world')
      expect(result).toBeGreaterThan(0)
      expect(typeof result).toBe('number')
    })

    it('handles empty text', () => {
      expect(counter.count('')).toBe(0)
      expect(counter.count('   ')).toBe(0)
    })

    it('handles whitespace-only text', () => {
      expect(counter.count('\n\t  ')).toBe(0)
    })

    it('counts different text lengths appropriately', () => {
      const short = counter.count('hi')
      const medium = counter.count('hello world this is a test')
      const long = counter.count('this is a much longer piece of text that should have significantly more tokens than the shorter examples')
      
      expect(short).toBeLessThan(medium)
      expect(medium).toBeLessThan(long)
    })

    it('handles unicode characters', () => {
      const result = counter.count('Hello 🌍 world! 你好')
      expect(result).toBeGreaterThan(0)
    })

    it('handles code-like text', () => {
      const code = `
        function hello(name) {
          return "Hello " + name;
        }
      `
      const result = counter.count(code)
      expect(result).toBeGreaterThan(0)
    })

    it('has consistent results for same input', () => {
      const text = 'consistent token counting test'
      const result1 = counter.count(text)
      const result2 = counter.count(text)
      
      expect(result1).toBe(result2)
    })

    it('gracefully handles very long text', () => {
      const longText = 'word '.repeat(1000)
      const result = counter.count(longText)
      
      expect(result).toBeGreaterThan(0)
      expect(result).toBeLessThan(2000) // Should be reasonable
    })

    it('falls back gracefully on encoding errors', () => {
      // This test verifies the fallback mechanism works
      // We can't easily force tiktoken to fail, but we can verify
      // that very unusual text doesn't crash the counter
      const weirdText = '\x00\x01\x02\x03'
      const result = counter.count(weirdText)
      
      expect(result).toBeGreaterThanOrEqual(0)
    })

    it('handles encoder throwing during encode (fallback warning path)', () => {
      // @ts-ignore force inject failing encoder to trigger warning path
      counter.encoder = { encode: () => { throw new Error('encode fail') } }
      const result = counter.count('some text to count')
      expect(result).toBeGreaterThan(0)
    })
  })

  describe('properties', () => {
    it('has correct name and version', () => {
      expect(counter.name).toBe('tiktoken')
      expect(counter.version).toBe('1.0.0')
    })

    it('has model name', () => {
      const modelName = counter.getModelName()
      expect(typeof modelName).toBe('string')
      expect(modelName.length).toBeGreaterThan(0)
    })
  })

  describe('model configuration', () => {
    it('can be configured with different model names', () => {
      const gptCounter = new TikTokenCounter('gpt-4')
      const ollamaCounter = new TikTokenCounter('gpt-oss:20b')
      
      expect(gptCounter.getModelName()).toBe('gpt-4')
      expect(ollamaCounter.getModelName()).toBe('gpt-oss:20b')
      
      gptCounter.free()
      ollamaCounter.free()
    })

    it('free() handles encoder.free throwing', () => {
      const c = new TikTokenCounter('x')
      // @ts-ignore inject throwing free()
      c.encoder = { free: () => { throw new Error('free fail') } }
      c.free() // should not throw
    })
  })
})

describe('global counter management', () => {
  afterEach(() => {
    // Reset to default for other tests
    setDefaultModel('gpt-oss:20b')
  })

  it('provides default counter', () => {
    const counter = getDefaultTokenCounter()
    expect(counter).toBeInstanceOf(TikTokenCounter)
    expect(counter.name).toBe('tiktoken')
    expect(counter.getModelName()).toBe('gpt-oss:20b')
  })

  it('reuses same counter instance', () => {
    const counter1 = getDefaultTokenCounter()
    const counter2 = getDefaultTokenCounter()
    expect(counter1).toBe(counter2)
  })

  it('can update default model', () => {
    setDefaultModel('llama2')
    const counter = getDefaultTokenCounter()
    expect(counter.getModelName()).toBe('llama2')
  })

  it('creates new counter when model changes', () => {
    const counter1 = getDefaultTokenCounter()
    setDefaultModel('different-model')
    const counter2 = getDefaultTokenCounter()
    
    expect(counter1).not.toBe(counter2)
    expect(counter2.getModelName()).toBe('different-model')
  })
})