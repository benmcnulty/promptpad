// Mock NextResponse.json used by the route
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: any) => ({
      ok: !init?.status || (init.status >= 200 && init.status < 300),
      status: init?.status || 200,
      async json() { return data },
    }),
  },
}))

describe('GET /api/models (contract)', () => {
  const prevMock = process.env.OLLAMA_MOCK
  beforeAll(() => {
    process.env.OLLAMA_MOCK = '1'
  })
  afterAll(() => {
    process.env.OLLAMA_MOCK = prevMock
  })

  it('returns an array of models with default gpt-oss:20b', async () => {
    const { GET } = await import('@/app/api/models/route')
    const res: any = await GET()
    expect(res.ok).toBe(true)
    const data = await res.json()
    expect(Array.isArray(data)).toBe(true)
    const def = data.find((m: any) => m.default)
    expect(def).toBeDefined()
    expect(def.name).toBe('gpt-oss:20b')
  })
})
