/** @jest-environment node */
describe('default Ollama server configuration', () => {
  const previousBase = process.env.OLLAMA_BASE_URL
  const previousTimeout = process.env.OLLAMA_TIMEOUT
  const previousFetch = global.fetch
  afterAll(() => {
    if (previousBase === undefined) delete process.env.OLLAMA_BASE_URL
    else process.env.OLLAMA_BASE_URL = previousBase
    if (previousTimeout === undefined) delete process.env.OLLAMA_TIMEOUT
    else process.env.OLLAMA_TIMEOUT = previousTimeout
    global.fetch = previousFetch
  })
  it('applies the documented URL and timeout to the primary client', async () => {
    process.env.OLLAMA_BASE_URL = 'http://configured-ollama:11434'
    process.env.OLLAMA_TIMEOUT = '180000'
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ models: [] }) })
    let client: typeof import('@/lib/ollama') | undefined
    jest.isolateModules(() => { client = require('@/lib/ollama') })
    await client!.ollama.listModels()
    expect(global.fetch).toHaveBeenCalledWith('http://configured-ollama:11434/api/tags', expect.objectContaining({ redirect: 'error' }))
    expect(AbortSignal.timeout).toHaveBeenCalledWith(180000)
    expect(client!.ollamaCustom).toBe(client!.ollama)
  })
  it.each(['bad', '0', '-10'])('uses the default timeout for %s', value => {
    process.env.OLLAMA_TIMEOUT = value
    let timeout: number | undefined
    jest.isolateModules(() => { timeout = require('@/lib/ollama').configuredOllamaTimeout() })
    expect(timeout).toBe(120000)
  })
})
