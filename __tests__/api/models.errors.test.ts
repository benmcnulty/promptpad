// Extra error path coverage for /api/models
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: any) => ({
      ok: !init?.status || (init.status >= 200 && init.status < 300),
      status: init?.status || 200,
      async json() { return data },
    }),
  },
}))

jest.mock('@/lib/ollama', () => ({
  ollama: {
    listModels: jest.fn()
  },
  OllamaError: class OllamaError extends Error {}
}))

describe('GET /api/models (generic error path)', () => {
  const prevMock = process.env.OLLAMA_MOCK
  const { ollama } = jest.requireMock('@/lib/ollama')
  beforeEach(() => { process.env.OLLAMA_MOCK = '' })
  afterAll(() => { process.env.OLLAMA_MOCK = prevMock })

  it('returns 500 on non-OllamaError', async () => {
    ollama.listModels.mockRejectedValueOnce(new Error('boom'))
    const { GET } = await import('@/app/api/models/route')
    const res: any = await GET()
    expect(res.status).toBe(500)
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
  })
})
