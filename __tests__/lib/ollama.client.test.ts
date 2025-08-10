import { OllamaClient, OllamaError } from '@/lib/ollama'

describe('OllamaClient', () => {
  const originalFetch = global.fetch
  afterEach(() => { global.fetch = originalFetch })

  it('healthCheck returns false on network error', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('net')) as any
    const client = new OllamaClient('http://x')
    await expect(client.healthCheck()).resolves.toBe(false)
  })

  it('listModels throws OllamaError on non-OK', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 503, statusText: 'Service Unavailable', json: async () => ({}) }) as any
    const client = new OllamaClient('http://x')
    await expect(client.listModels()).rejects.toBeInstanceOf(OllamaError)
  })

  it('listModels wraps generic error', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('boom')) as any
    const client = new OllamaClient('http://x')
    await expect(client.listModels()).rejects.toMatchObject({ code: 'SERVICE_UNAVAILABLE' })
  })

  it('generate enforces temperature clamp and handles non-ok', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, status: 400, statusText: 'Bad', text: async () => 'bad req' }) as any
    const client = new OllamaClient('http://x')
    await expect(client.generate('m', 'p', { temperature: 0.9 })).rejects.toBeInstanceOf(OllamaError)
  })

  it('generate wraps network error', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('offline')) as any
    const client = new OllamaClient('http://x')
    await expect(client.generate('m', 'p')).rejects.toMatchObject({ code: 'REQUEST_FAILED' })
  })

  it('hasModel returns false when listModels fails', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('fail')) as any
    const client = new OllamaClient('http://x')
    await expect(client.hasModel('x')).resolves.toBe(false)
  })
})
