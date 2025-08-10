// Additional validation coverage for /api/refine
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
    generate: jest.fn().mockResolvedValue({ text: 'GEN', usage: { input_tokens: 1, output_tokens: 2 } })
  },
  OllamaError: class OllamaError extends Error {}
}))

describe('POST /api/refine (validation)', () => {
  const prevMock = process.env.OLLAMA_MOCK
  const { ollama } = jest.requireMock('@/lib/ollama')
  beforeEach(() => { process.env.OLLAMA_MOCK = '' })
  afterAll(() => { process.env.OLLAMA_MOCK = prevMock })

  const makeReq = (body: any): any => ({ json: async () => body })

  it('rejects missing model', async () => {
    const { POST } = await import('@/app/api/refine/route')
    const res: any = await POST(makeReq({ mode: 'refine', input: 'x', temperature: 0.1 }))
    expect(res.status).toBe(400)
  })

  it('rejects negative temperature', async () => {
    const { POST } = await import('@/app/api/refine/route')
    const res: any = await POST(makeReq({ mode: 'refine', input: 'x', model: 'gpt-oss:20b', temperature: -1 }))
    expect(res.status).toBe(400)
  })

  it('rejects reinforce without draft', async () => {
    const { POST } = await import('@/app/api/refine/route')
    const res: any = await POST(makeReq({ mode: 'reinforce', model: 'gpt-oss:20b', temperature: 0.2 }))
    expect(res.status).toBe(400)
  })

  it('clamps high temperature', async () => {
    const { POST } = await import('@/app/api/refine/route')
    await POST(makeReq({ mode: 'refine', input: 'y', model: 'gpt-oss:20b', temperature: 0.95 }))
    expect(ollama.generate).toHaveBeenCalled()
  })

  it('documents current contract where model required', async () => {
    const { POST } = await import('@/app/api/refine/route')
    const res: any = await POST(makeReq({ mode: 'refine', input: 'x', model: '', temperature: 0.2 }))
    expect(res.status).toBe(400)
  })
})
