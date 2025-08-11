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

describe('POST /api/refine (contract)', () => {
  const prevMock = process.env.OLLAMA_MOCK
  beforeAll(() => {
    process.env.OLLAMA_MOCK = '1'
  })
  afterAll(() => {
    process.env.OLLAMA_MOCK = prevMock
  })

  it('refine mode returns output and usage', async () => {
    const { POST } = await import('@/app/api/refine/route')
    const req: any = {
      async json() {
        return {
          mode: 'refine',
          input: 'summarize this',
          model: 'gpt-oss:20b',
          temperature: 0.2,
        }
      },
    }
    const res: any = await POST(req)
    expect(res.ok).toBe(true)
    const data = await res.json()
    expect(typeof data.output).toBe('string')
    expect(typeof data.usage?.input_tokens).toBe('number')
    expect(typeof data.usage?.output_tokens).toBe('number')
  })

  it('reinforce mode returns output, usage, and patch', async () => {
    const { POST } = await import('@/app/api/refine/route')
    const req: any = {
      async json() {
        return {
          mode: 'reinforce',
          draft: 'a basic draft',
          model: 'gpt-oss:20b',
          temperature: 0.25,
        }
      },
    }
    const res: any = await POST(req)
    expect(res.ok).toBe(true)
    const data = await res.json()
    expect(typeof data.output).toBe('string')
    expect(Array.isArray(data.patch)).toBe(true)
    expect(data.patch[0].op).toBe('replace')
  })

  it('spec mode returns project specification output', async () => {
    const { POST } = await import('@/app/api/refine/route')
    const req: any = {
      async json() {
        return {
          mode: 'spec',
          input: 'build a task management app',
          model: 'gpt-oss:20b',
          temperature: 0.2,
        }
      },
    }
    const res = await POST(req)
    expect(res.ok).toBe(true)

    const data = await res.json()
    expect(data.output).toBeDefined()
    expect(typeof data.output).toBe('string')
    expect(data.output.length).toBeGreaterThan(0)
    expect(data.output).toContain('Project Specification')
    expect(data.output).toContain('Technology Stack')
    expect(data.usage).toEqual({
      input_tokens: expect.any(Number),
      output_tokens: expect.any(Number),
    })
    // Spec mode doesn't return patches
    expect(data.patch).toBeUndefined()
  })
})
