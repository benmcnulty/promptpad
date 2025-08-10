// Extended tests for /api/models covering normalization & error paths
jest.mock('@/lib/ollama', () => ({
  ollama: {
    listModels: jest.fn()
  },
  OllamaError: class OllamaError extends Error {}
}))
// Mock NextResponse for isolation (avoid full Next runtime needs)
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: any) => ({
      ok: !init?.status || (init.status >= 200 && init.status < 300),
      status: init?.status || 200,
      async json() { return data },
    }),
  },
}))

describe('GET /api/models (extended)', () => {
  const prevMock = process.env.OLLAMA_MOCK
  const { ollama, OllamaError } = jest.requireMock('@/lib/ollama')
  beforeEach(() => {
    process.env.OLLAMA_MOCK = ''
  })
  afterAll(() => { process.env.OLLAMA_MOCK = prevMock })

  it('inserts default when missing', async () => {
    ollama.listModels.mockResolvedValueOnce([{ name: 'llama3.2:8b' }])
    const { GET } = await import('@/app/api/models/route')
    const res: any = await GET()
    const data = await res.json()
    expect(data[0].name).toBe('gpt-oss:20b')
    expect(data.find((m: any) => m.name === 'gpt-oss:20b').default).toBe(true)
  })

  it('marks existing default', async () => {
    ollama.listModels.mockResolvedValueOnce([{ name: 'gpt-oss:20b' }, { name: 'llama3.2:8b' }])
    const { GET } = await import('@/app/api/models/route')
    const res: any = await GET()
    const data = await res.json()
    const def = data.find((m: any) => m.name === 'gpt-oss:20b')
    expect(def.default).toBe(true)
  })

  it('gracefully handles error and returns default array', async () => {
    ollama.listModels.mockRejectedValueOnce(new OllamaError('fail'))
    const { GET } = await import('@/app/api/models/route')
    const res: any = await GET()
    expect(res.status).toBe(503)
    const data = await res.json()
    expect(data[0].name).toBe('gpt-oss:20b')
  })
})
