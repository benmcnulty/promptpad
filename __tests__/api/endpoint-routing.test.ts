/** @jest-environment node */
jest.mock('next/server', () => ({
  NextResponse: { json: (data: unknown, init?: { status?: number }) => ({
    status: init?.status || 200, json: async () => data,
  }) },
}))

describe('selected endpoint routes', () => {
  const previousMock = process.env.OLLAMA_MOCK
  const previousAllowed = process.env.OLLAMA_ALLOWED_ENDPOINTS
  const previousFetch = global.fetch
  beforeEach(() => {
    process.env.OLLAMA_MOCK = ''
    process.env.OLLAMA_ALLOWED_ENDPOINTS = 'http://selected-ollama:11434'
    global.fetch = jest.fn()
  })
  afterAll(() => {
    if (previousMock === undefined) delete process.env.OLLAMA_MOCK
    else process.env.OLLAMA_MOCK = previousMock
    if (previousAllowed === undefined) delete process.env.OLLAMA_ALLOWED_ENDPOINTS
    else process.env.OLLAMA_ALLOWED_ENDPOINTS = previousAllowed
    global.fetch = previousFetch
  })
  const req = (url: string, body: unknown): Request => ({
    headers: new Headers({ 'X-Ollama-Endpoint': url }), json: async () => body,
  } as Request)

  it.each(['refine', 'reinforce', 'spec'])('uses the selected endpoint for primary and cleanup %s calls', async mode => {
    ;(global.fetch as jest.Mock)
      .mockResolvedValueOnce({ ok: true, json: async () => ({ response: 'Okay, here\'s a refined prompt: write a plan', prompt_eval_count: 2, eval_count: 3 }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ response: 'Write a plan', prompt_eval_count: 4, eval_count: 5 }) })
    const { POST } = await import('@/app/api/refine/route')
    const response = await POST(req('http://selected-ollama:11434', { mode, model: 'gpt-oss:20b', temperature: 0.2, input: 'plan', draft: 'plan' }))
    expect(response.status).toBe(200)
    expect(global.fetch).toHaveBeenCalledTimes(2)
    for (const [url] of (global.fetch as jest.Mock).mock.calls) expect(url).toBe('http://selected-ollama:11434/api/generate')
    expect(await response.json()).toMatchObject({ output: 'Write a plan', usage: { input_tokens: 6, output_tokens: 8 } })
  })

  it.each(['refine', 'word-cluster', 'expand-cluster'])('rejects unapproved %s destinations before mock or fallback', async route => {
    process.env.OLLAMA_MOCK = '1'
    const { POST } = await import(`@/app/api/${route}/route`)
    const response = await POST(req('http://unapproved:11434', {}))
    expect(response.status).toBe(400)
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('lists the selected endpoint and rejects unapproved catalog destinations', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ models: [{ name: 'selected:7b' }] }) })
    const { GET } = await import('@/app/api/models/route')
    const response = await GET(req('http://selected-ollama:11434', {}))
    expect(await response.json()).toEqual([{ name: 'selected:7b', family: 'selected', parameters: '7b' }])
    expect(global.fetch).toHaveBeenCalledWith('http://selected-ollama:11434/api/tags', expect.anything())
    ;(global.fetch as jest.Mock).mockClear()
    expect((await GET(req('http://unapproved:11434', {}))).status).toBe(400)
    expect(global.fetch).not.toHaveBeenCalled()
  })
})
