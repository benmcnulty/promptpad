// Contract tests for /api/word-cluster
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: any) => ({
      ok: !init?.status || (init.status >= 200 && init.status < 300),
      status: init?.status || 200,
      async json() { return data },
    }),
  },
}))

describe('POST /api/word-cluster', () => {
  const prevMock = process.env.OLLAMA_MOCK
  beforeAll(() => { process.env.OLLAMA_MOCK = '1' })
  afterAll(() => { process.env.OLLAMA_MOCK = prevMock })

  const makeReq = (body: any): any => ({ json: async () => body })

  it('returns 12 words, usage, and clusterId (mock mode)', async () => {
    const { POST } = await import('@/app/api/word-cluster/route')
    const res: any = await POST(makeReq({
      prompt: 'analyze customer sentiment',
      model: 'gpt-oss:20b',
      temperature: 0.2,
    }))
    expect(res.ok).toBe(true)
    const data = await res.json()
    expect(Array.isArray(data.words)).toBe(true)
    expect(data.words.length).toBe(12)
    expect(typeof data.clusterId).toBe('string')
    expect(data.usage).toEqual({
      input_tokens: expect.any(Number),
      output_tokens: expect.any(Number),
    })
  })

  it('validates missing prompt', async () => {
    const { POST } = await import('@/app/api/word-cluster/route')
    const res: any = await POST(makeReq({
      prompt: '',
      model: 'gpt-oss:20b',
      temperature: 0.2,
    }))
    expect(res.status).toBe(400)
  })
})

