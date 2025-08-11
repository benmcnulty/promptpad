import { POST } from '@/app/api/refine/route'

// Mock NextResponse.json (lightweight)
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: any) => ({
      ok: !init?.status || (init.status >= 200 && init.status < 300),
      status: init?.status || 200,
      async json() { return data },
    }),
  },
}))

describe('/api/refine – enhanced behaviors (contract + validation)', () => {
  const prev = process.env.OLLAMA_MOCK
  beforeAll(() => { process.env.OLLAMA_MOCK = '1' })
  afterAll(() => { process.env.OLLAMA_MOCK = prev })

  const req = (body: any): any => ({ json: async () => body })

  it('refine returns output, usage, and systemPrompt', async () => {
    const res: any = await POST(req({ mode: 'refine', input: 'Write a blog post', model: 'gpt-oss:20b', temperature: 0.2 }))
    expect(res.ok).toBe(true)
    const data = await res.json()
    expect(typeof data.output).toBe('string')
    expect(typeof data.usage?.input_tokens).toBe('number')
    expect(typeof data.usage?.output_tokens).toBe('number')
    expect(data.systemPrompt).toMatch(/Promptpad/i)
  })

  it('reinforce returns patch and output', async () => {
    const res: any = await POST(req({ mode: 'reinforce', draft: 'Draft text', model: 'gpt-oss:20b', temperature: 0.2 }))
    expect(res.ok).toBe(true)
    const data = await res.json()
    expect(Array.isArray(data.patch)).toBe(true)
    expect(typeof data.output).toBe('string')
  })

  it('spec mode returns output', async () => {
    const res: any = await POST(req({ mode: 'spec', input: 'Build a todo app', model: 'gpt-oss:20b', temperature: 0.2 }))
    const data = await res.json()
    expect(typeof data.output).toBe('string')
  })

  it('rejects missing input for refine', async () => {
    const res: any = await POST(req({ mode: 'refine', input: '', model: 'gpt-oss:20b', temperature: 0.2 }))
    expect(res.status).toBe(400)
  })

  it('rejects missing draft for reinforce', async () => {
    const res: any = await POST(req({ mode: 'reinforce', draft: '', model: 'gpt-oss:20b', temperature: 0.2 }))
    expect(res.status).toBe(400)
  })

  it('rejects invalid mode', async () => {
    const res: any = await POST(req({ mode: 'invalid', input: 'x', model: 'gpt-oss:20b', temperature: 0.2 }))
    expect(res.status).toBe(400)
  })

  it('clamps high temperature but succeeds', async () => {
    const res: any = await POST(req({ mode: 'refine', input: 'Test clamp', model: 'gpt-oss:20b', temperature: 0.9 }))
    expect(res.status).toBe(200)
  })

  it('rejects negative temperature', async () => {
    const res: any = await POST(req({ mode: 'refine', input: 'Neg', model: 'gpt-oss:20b', temperature: -0.1 }))
    expect(res.status).toBe(400)
  })
})
