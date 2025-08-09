import { OllamaClient, OllamaError } from '@/lib/ollama'

// Simple tests focusing on core functionality
describe('OllamaClient Basic Tests', () => {
  let client: OllamaClient

  beforeEach(() => {
    client = new OllamaClient('http://localhost:11434')
  })

  describe('constructor', () => {
    it('creates client with correct defaults', () => {
      const defaultClient = new OllamaClient()
      expect(defaultClient).toBeDefined()
    })

    it('removes trailing slash from baseUrl', () => {
      const clientWithSlash = new OllamaClient('http://localhost:11434/')
      expect(clientWithSlash['baseUrl']).toBe('http://localhost:11434')
    })
  })

  describe('temperature constraint', () => {
    it('enforces temperature limit', () => {
      const mockFetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          response: 'test',
          done: true,
          prompt_eval_count: 10,
          eval_count: 15,
        }),
      })
      global.fetch = mockFetch

      client.generate('test-model', 'test prompt', { temperature: 0.8 })

      expect(mockFetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('"temperature":0.3'),
        })
      )
    })
  })

  describe('OllamaError', () => {
    it('creates error with message and status', () => {
      const error = new OllamaError('Test error', 500, 'TEST_ERROR')
      expect(error.message).toBe('Test error')
      expect(error.status).toBe(500)
      expect(error.code).toBe('TEST_ERROR')
      expect(error.name).toBe('OllamaError')
    })
  })
})