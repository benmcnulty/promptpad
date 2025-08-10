// Extended tests for /api/refine covering non-mock + error & fallback paths
jest.mock('@/lib/ollama', () => ({
  ollama: {
    generate: jest.fn()
  },
  OllamaError: class OllamaError extends Error {}
}))
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: any) => ({
      ok: !init?.status || (init.status >= 200 && init.status < 300),
      status: init?.status || 200,
      async json() { return data },
    }),
  },
}))

describe('POST /api/refine (extended)', () => {
  const prevMock = process.env.OLLAMA_MOCK
  const { ollama } = jest.requireMock('@/lib/ollama')
  beforeEach(() => {
    process.env.OLLAMA_MOCK = ''
  })
  afterAll(() => {
    process.env.OLLAMA_MOCK = prevMock
  })

  const makeReq = (body: any): any => ({ json: async () => body })

  it('refine path uses ollama generate', async () => {
    ollama.generate.mockResolvedValueOnce({ text: 'REFINED', usage: { input_tokens: 1, output_tokens: 2 } })
    const { POST } = await import('@/app/api/refine/route')
    const res: any = await POST(makeReq({ mode: 'refine', input: 'x', model: 'gpt-oss:20b', temperature: 0.8 }))
    const data = await res.json()
    expect(data.output).toBe('REFINED')
  })

  it('reinforce path returns patch', async () => {
    ollama.generate.mockResolvedValueOnce({ text: 'REINFORCED', usage: { input_tokens: 1, output_tokens: 2 } })
    const { POST } = await import('@/app/api/refine/route')
    const res: any = await POST(makeReq({ mode: 'reinforce', draft: 'draft text', model: 'gpt-oss:20b', temperature: 0.2 }))
    const data = await res.json()
    expect(Array.isArray(data.patch)).toBe(true)
    expect(data.patch[0].to).toBe('REINFORCED')
  })

  it('invalid mode rejected', async () => {
    const { POST } = await import('@/app/api/refine/route')
    const res: any = await POST(makeReq({ mode: 'oops', model: 'gpt-oss:20b', temperature: 0.2 }))
    expect(res.status).toBe(400)
  })

  it('missing input for refine rejected', async () => {
    const { POST } = await import('@/app/api/refine/route')
    const res: any = await POST(makeReq({ mode: 'refine', model: 'gpt-oss:20b', temperature: 0.2 }))
    expect(res.status).toBe(400)
  })

  it('fallback path when ollama unavailable (simulate dev)', async () => {
    ollama.generate.mockRejectedValueOnce(new Error('offline'))
    const { POST } = await import('@/app/api/refine/route')
    const res: any = await POST(makeReq({ mode: 'refine', input: 'story about a cat', model: 'gpt-oss:20b', temperature: 0.2 }))
    const data = await res.json()
    // In production fallbackUsed may be undefined; accept either path
    expect(data.output).toBeTruthy()
  })
})
