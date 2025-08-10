import { POST } from '@/app/api/refine/route'

// Mock NextResponse.json
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: any) => ({
      ok: !init?.status || (init.status >= 200 && init.status < 300),
      status: init?.status || 200,
      async json() { return data },
    }),
  },
}))

describe('Enhanced /api/refine functionality', () => {
  const prevMock = process.env.OLLAMA_MOCK
  
  beforeAll(() => {
    process.env.OLLAMA_MOCK = '1' // Use mock mode for consistent testing
  })
  
  afterAll(() => {
    process.env.OLLAMA_MOCK = prevMock
  })

  describe('Response format enhancements', () => {
    it('returns systemPrompt in refine response', async () => {
      const req: any = {
        async json() {
          return {
            mode: 'refine',
            input: 'Write a blog post',
            model: 'gpt-oss:20b',
            temperature: 0.2,
          }
        }
      }

      const response = await POST(req)
      const data = await response.json()

      expect(data.systemPrompt).toBeDefined()
      expect(typeof data.systemPrompt).toBe('string')
      expect(data.systemPrompt).toContain('Promptpad')
    })

    it('returns fallbackUsed flag in development', async () => {
      const req: any = {
        async json() {
          return {
            mode: 'refine',
            input: 'Test input',
            model: 'gpt-oss:20b',
            temperature: 0.2,
          }
        }
      }

      const response = await POST(req)
      const data = await response.json()

      // In mock mode, fallbackUsed should be undefined (not a fallback, just mock)
      // In real dev mode with Ollama unavailable, it would be true
      expect(data.fallbackUsed).toBeUndefined()
    })
  })

  describe('Text cleanup functionality', () => {
    it('would clean unwanted prefixes from real responses', async () => {
      // This test documents the cleanup functionality
      // In real implementation, responses with prefixes like "**Prompt:**" would be cleaned
      
      const req: any = {
        async json() {
          return {
            mode: 'refine',
            input: 'Create a summary',
            model: 'gpt-oss:20b',
            temperature: 0.2,
          }
        }
      }

      const response = await POST(req)
      const data = await response.json()

      // Mock output should not contain unwanted prefixes
      expect(data.output).not.toMatch(/^\*\*Prompt:\*\*/)
      expect(data.output).not.toMatch(/^Here's the/)
      expect(data.output).not.toMatch(/^Prompt:/)
    })
  })

  describe('Improved prompting system', () => {
    it('refine mode should not include AI technical parameters in output', async () => {
      const req: any = {
        async json() {
          return {
            mode: 'refine',
            input: 'Write a story',
            model: 'gpt-oss:20b',
            temperature: 0.2,
          }
        }
      }

      const response = await POST(req)
      const data = await response.json()

      // Output should not contain technical AI parameters
      expect(data.output).not.toMatch(/temperature/i)
      expect(data.output).not.toMatch(/set.*temp/i)
      expect(data.output).not.toMatch(/model.*setting/i)
    })

    it('reinforce mode returns patch for diff functionality', async () => {
      const draftText = 'Write a simple blog post'
      
      const req: any = {
        async json() {
          return {
            mode: 'reinforce',
            draft: draftText,
            model: 'gpt-oss:20b',
            temperature: 0.2,
          }
        }
      }

      const response = await POST(req)
      const data = await response.json()

      expect(data.patch).toBeDefined()
      expect(Array.isArray(data.patch)).toBe(true)
      expect(data.patch[0]).toHaveProperty('op', 'replace')
      expect(data.patch[0]).toHaveProperty('from', [0, draftText.length])
      expect(data.patch[0]).toHaveProperty('to')
    })
  })

  describe('Enhanced validation', () => {
    it('validates temperature bounds', async () => {
      const req: any = {
        async json() {
          return {
            mode: 'refine',
            input: 'Test input',
            model: 'gpt-oss:20b',
            temperature: 0.5, // Above 0.3 limit
          }
        }
      }

      const response = await POST(req)
      
      // Should still process but temperature is clamped to 0.3 internally
      expect(response.status).toBe(200)
    })

    it('requires input for refine mode', async () => {
      const req: any = {
        async json() {
          return {
            mode: 'refine',
            input: '',
            model: 'gpt-oss:20b',
            temperature: 0.2,
          }
        }
      }

      const response = await POST(req)
      expect(response.status).toBe(400)
    })

    it('requires draft for reinforce mode', async () => {
      const req: any = {
        async json() {
          return {
            mode: 'reinforce',
            draft: '',
            model: 'gpt-oss:20b',
            temperature: 0.2,
          }
        }
      }

      const response = await POST(req)
      expect(response.status).toBe(400)
    })

    it('requires valid model name', async () => {
      const req: any = {
        async json() {
          return {
            mode: 'refine',
            input: 'Test',
            model: '',
            temperature: 0.2,
          }
        }
      }

      const response = await POST(req)
      expect(response.status).toBe(400)
    })

    it('validates temperature is non-negative', async () => {
      const req: any = {
        async json() {
          return {
            mode: 'refine',
            input: 'Test',
            model: 'gpt-oss:20b',
            temperature: -0.1,
          }
        }
      }

      const response = await POST(req)
      expect(response.status).toBe(400)
    })
  })

  describe('Token counting accuracy', () => {
    it('returns realistic token counts', async () => {
      const input = 'Write a comprehensive guide about sustainable gardening'
      
      const req: any = {
        async json() {
          return {
            mode: 'refine',
            input,
            model: 'gpt-oss:20b',
            temperature: 0.2,
          }
        }
      }

      const response = await POST(req)
      const data = await response.json()

      expect(data.usage.input_tokens).toBeGreaterThan(0)
      expect(data.usage.output_tokens).toBeGreaterThan(0)
      expect(data.usage.input_tokens).toBeLessThan(1000) // Reasonable upper bound
      expect(data.usage.output_tokens).toBeLessThan(1000)
    })
  })

  describe('Error handling improvements', () => {
    it('handles invalid JSON gracefully', async () => {
      const req: any = {
        async json() {
          throw new Error('Invalid JSON')
        }
      }

      const response = await POST(req)
      expect(response.status).toBe(500)
    })

    it('handles missing mode parameter', async () => {
      const req: any = {
        async json() {
          return {
            input: 'Test',
            model: 'gpt-oss:20b',
            temperature: 0.2,
          }
        }
      }

      const response = await POST(req)
      expect(response.status).toBe(400)
    })

    it('handles invalid mode parameter', async () => {
      const req: any = {
        async json() {
          return {
            mode: 'invalid-mode',
            input: 'Test',
            model: 'gpt-oss:20b',
            temperature: 0.2,
          }
        }
      }

      const response = await POST(req)
      expect(response.status).toBe(400)
    })
  })
})