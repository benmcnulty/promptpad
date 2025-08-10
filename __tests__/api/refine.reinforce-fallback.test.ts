// Reinforce fallback coverage when generation fails
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
    generate: jest.fn()
  },
  OllamaError: class OllamaError extends Error {}
}))

describe('POST /api/refine reinforce fallback', () => {
  const prevMock = process.env.OLLAMA_MOCK
  const { ollama } = jest.requireMock('@/lib/ollama')
  beforeEach(() => { process.env.OLLAMA_MOCK = '' })
  afterAll(() => { process.env.OLLAMA_MOCK = prevMock })

  const makeReq = (body: any): any => ({ json: async () => body })

  it('falls back gracefully when reinforce generation fails', async () => {
    ollama.generate.mockRejectedValueOnce(new Error('offline'))
    const { POST } = await import('@/app/api/refine/route')
    const res: any = await POST(makeReq({ mode: 'reinforce', draft: 'Draft content', model: 'gpt-oss:20b', temperature: 0.2 }))
    const data = await res.json()
    expect(typeof data.output).toBe('string')
    expect(Array.isArray(data.patch)).toBe(true)
  })
})
