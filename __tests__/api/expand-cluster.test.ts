// Contract tests for /api/expand-cluster
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: any) => ({
      ok: !init?.status || (init.status >= 200 && init.status < 300),
      status: init?.status || 200,
      async json() { return data },
    }),
  },
}))

describe('POST /api/expand-cluster', () => {
  const prevMock = process.env.OLLAMA_MOCK
  beforeAll(() => { process.env.OLLAMA_MOCK = '1' })
  afterAll(() => { process.env.OLLAMA_MOCK = prevMock })

  const makeReq = (body: any): any => ({ json: async () => body })

  it('returns 12 words, usage, and clusterId for expansion (mock mode)', async () => {
    const { POST } = await import('@/app/api/expand-cluster/route')
    const res: any = await POST(makeReq({
      word: 'delivery',
      parentClusterId: 'cluster_123',
      originalPrompt: 'analyze sentiment',
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

  it('validates required fields', async () => {
    const { POST } = await import('@/app/api/expand-cluster/route')
    const res1: any = await POST(makeReq({
      word: '', parentClusterId: 'x', originalPrompt: 'p', model: 'gpt-oss:20b', temperature: 0.2,
    }))
    expect(res1.status).toBe(400)

    const res2: any = await POST(makeReq({
      word: 'w', parentClusterId: '', originalPrompt: 'p', model: 'gpt-oss:20b', temperature: 0.2,
    }))
    expect(res2.status).toBe(400)

    const res3: any = await POST(makeReq({
      word: 'w', parentClusterId: 'x', originalPrompt: '', model: 'gpt-oss:20b', temperature: 0.2,
    }))
    expect(res3.status).toBe(400)
  })
})

