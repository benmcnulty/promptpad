/** @jest-environment node */
import { getServerOllama } from '@/lib/ollama-server'
import { ollama } from '@/lib/ollama'

describe('server endpoint selection', () => {
  const previousBase = process.env.OLLAMA_BASE_URL
  const previousAllowed = process.env.OLLAMA_ALLOWED_ENDPOINTS
  const previousFetch = global.fetch
  beforeEach(() => {
    process.env.OLLAMA_BASE_URL = 'http://localhost:11434'
    process.env.OLLAMA_ALLOWED_ENDPOINTS = 'http://ollama-lan:11434'
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ models: [] }) })
  })
  afterAll(() => {
    if (previousBase === undefined) delete process.env.OLLAMA_BASE_URL
    else process.env.OLLAMA_BASE_URL = previousBase
    if (previousAllowed === undefined) delete process.env.OLLAMA_ALLOWED_ENDPOINTS
    else process.env.OLLAMA_ALLOWED_ENDPOINTS = previousAllowed
    global.fetch = previousFetch
  })
  const request = (url: string) => ({ headers: new Headers({ 'X-Ollama-Endpoint': url }) })

  it('retains the configured client for requests without a selection', () => {
    expect(getServerOllama()).toBe(ollama)
    expect(getServerOllama(request('http://localhost:11434/'))).toBe(ollama)
  })

  it('uses an approved custom endpoint and refuses redirects', async () => {
    await getServerOllama(request('http://ollama-lan:11434/')).listModels()
    expect(global.fetch).toHaveBeenCalledWith('http://ollama-lan:11434/api/tags', expect.objectContaining({ redirect: 'error' }))
  })

  it.each(['http://unapproved:11434', 'file:///etc/passwd', 'http://user:password@ollama-lan:11434',
    'http://ollama-lan:11434?target=other', '', 'not a url'])('rejects %s before any fetch', (url) => {
    expect(() => getServerOllama(request(url))).toThrow('not approved')
    expect(global.fetch).not.toHaveBeenCalled()
  })
})
