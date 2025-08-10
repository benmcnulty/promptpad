// Normalization branch coverage for /api/models
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

describe('GET /api/models (normalization variants)', () => {
  const prevMock = process.env.OLLAMA_MOCK
  const { ollama } = jest.requireMock('@/lib/ollama')
  beforeEach(() => { process.env.OLLAMA_MOCK = '' })
  afterAll(() => { process.env.OLLAMA_MOCK = prevMock })

  it('parses colon models, digit-embedded models, and unknown family', async () => {
    ollama.listModels.mockResolvedValueOnce([
      { name: 'llama3.2:8b' }, // colonMatch
      { name: 'qwen2.5' },     // paramMatch else path
      { name: 'mysterymodel' } // fallback unknown
    ])
    const { GET } = await import('@/app/api/models/route')
    const res: any = await GET()
    const data = await res.json()
    // default inserted at front
    const llama = data.find((m: any) => m.name === 'llama3.2:8b')
    const qwen = data.find((m: any) => m.name === 'qwen2.5')
    const mystery = data.find((m: any) => m.name === 'mysterymodel')
    expect(llama.family).toBe('llama')
    expect(qwen.parameters).toBe('2b')
    expect(mystery.parameters).toBe('unknown')
  })
})
