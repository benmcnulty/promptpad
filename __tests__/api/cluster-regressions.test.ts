/** @jest-environment node */
import { POST as wordCluster } from '@/app/api/word-cluster/route'
import { POST as expandCluster } from '@/app/api/expand-cluster/route'

// Real routes, endpoint resolver and Ollama adapter; replace only transport.
jest.mock('next/server', () => ({ NextResponse: { json: (data: unknown, init?: { status?: number }) => ({
  status: init?.status || 200, json: async () => data
}) } }))

const endpoint = 'http://cluster-test.invalid:11434'
const request = (body: unknown): Request => ({
  headers: new Headers({ 'X-Ollama-Endpoint': endpoint }), json: async () => body
} as Request)
const catalog = [
  { name: 'word cluster', post: wordCluster, body: { prompt: 'Design a garden', model: 'gpt-oss:20b', temperature: 0.2 }, prefix: 'cluster_', pad: 'related_', error: 'Word cluster service error' },
  { name: 'expansion', post: expandCluster, body: { word: 'garden', parentClusterId: 'parent', originalPrompt: 'Design a garden', model: 'gpt-oss:20b', temperature: 0.2 }, prefix: 'expand_', pad: 'expansion_', error: 'Cluster expansion service error' }
]
const environment = process.env
describe.each(catalog)('$name route regressions', ({ post, body, prefix, pad, error }) => {
  beforeEach(() => {
    jest.replaceProperty(process, 'env', { ...environment, NODE_ENV: 'production', OLLAMA_MOCK: '', OLLAMA_ALLOWED_ENDPOINTS: endpoint })
    ;(global.fetch as jest.Mock).mockReset()
    for (const method of ['log', 'warn', 'error', 'group', 'groupCollapsed', 'groupEnd'] as const) jest.spyOn(console, method).mockImplementation(() => {})
  })
  afterEach(() => jest.restoreAllMocks())

  function respond(text: string) {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ response: text, prompt_eval_count: 7, eval_count: 11 }) })
  }

  it('uses the allowlisted endpoint and preserves usage, model and capped temperature', async () => {
    respond('1. SEED!, Soil, water, SUN, roots, leaves, flowers, shade, bees, compost, mulch, harvest, extra')
    const response = await post(request({ ...body, temperature: 0.8 }))
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.words).toEqual(['seed', 'soil', 'water', 'sun', 'roots', 'leaves', 'flowers', 'shade', 'bees', 'compost', 'mulch', 'harvest'])
    expect(data.clusterId).toEqual(expect.stringMatching(new RegExp(`^${prefix}`)))
    expect(data.usage).toEqual({ input_tokens: 7, output_tokens: 11 })
    expect(data.fallbackUsed).toBeUndefined()
    expect(Object.keys(data).sort()).toEqual(['clusterId', 'systemPrompt', 'usage', 'words'])
    const [url, options] = (global.fetch as jest.Mock).mock.calls[0]
    expect(url).toBe(`${endpoint}/api/generate`)
    expect(JSON.parse(options.body)).toMatchObject({ model: 'gpt-oss:20b', stream: false, options: { temperature: 0.3 }, prompt: data.systemPrompt })
    expect(data.systemPrompt).toContain('Design a garden')
  })

  it('filters unusable entries and pads a short response to twelve words', async () => {
    respond('!! Soil,, extraordinarilylongword, Water,')
    const response = await post(request(body))
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.words).toEqual(['soil', 'water', ...Array.from({ length: 10 }, (_, i) => `${pad}${i + 3}`)])
    expect(data.usage).toEqual({ input_tokens: 7, output_tokens: 11 })
  })

  it('pads an empty provider response and sends temperature zero intact', async () => {
    respond('123 !!!')
    const response = await post(request({ ...body, temperature: 0 }))
    expect((await response.json()).words).toEqual(Array.from({ length: 12 }, (_, i) => `${pad}${i + 1}`))
    expect(JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body).options.temperature).toBe(0)
  })

  it.each([null, {}, { ...body, model: '' }, { ...body, model: 42 }, { ...body, temperature: '0.2' }, { ...body, temperature: -1 }])('rejects invalid input before transport: %j', async invalid => {
    const response = await post(request(invalid))
    expect(response.status).toBe(400)
    expect((await response.json()).error).toEqual(expect.any(String))
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('returns a production service error for rejected transport without fabricating inference', async () => {
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('offline'))
    const response = await post(request(body))
    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ error })
  })

  it('returns a production service error for HTTP provider failure', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 404, statusText: 'Not Found', text: async () => 'model missing' })
    const response = await post(request(body))
    expect(response.status).toBe(503)
    expect(await response.json()).toEqual({ error })
  })

  it('labels the offline development fallback and preserves the response contract', async () => {
    Object.assign(process.env, { NODE_ENV: 'development' })
    ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('offline'))
    const response = await post(request(body))
    expect(response.status).toBe(200)
    const data = await response.json()
    expect(data.fallbackUsed).toBe(true)
    expect(data.words).toHaveLength(12)
    expect(data.systemPrompt).toContain('garden')
    expect(data.usage.input_tokens).toBeGreaterThan(0)
    expect(Object.keys(data).sort()).toEqual(['clusterId', 'fallbackUsed', 'systemPrompt', 'usage', 'words'])
  })

  it('handles unreadable JSON without exposing provider or request details', async () => {
    const req = request(body)
    req.json = async () => { throw new SyntaxError('Unexpected token') }
    const response = await post(req)
    expect(response.status).toBe(500)
    expect(await response.json()).toEqual({ error })
    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('rejects a forbidden endpoint even in development mock mode', async () => {
    Object.assign(process.env, { NODE_ENV: 'development' })
    process.env.OLLAMA_MOCK = '1'
    const req = request(body)
    req.headers.set('X-Ollama-Endpoint', 'http://forbidden.invalid:11434')
    const response = await post(req)
    expect(response.status).toBe(400)
    expect(await response.json()).toEqual({ error: 'Selected Ollama endpoint is not approved by this server' })
    expect(global.fetch).not.toHaveBeenCalled()
  })
})

describe('word-cluster parent word prompt', () => {
  afterEach(() => jest.restoreAllMocks())
  it('uses the parent association instructions in offline mock mode', async () => {
    jest.replaceProperty(process, 'env', { ...environment, OLLAMA_MOCK: '1', OLLAMA_ALLOWED_ENDPOINTS: endpoint })
    ;(global.fetch as jest.Mock).mockReset()
    const response = await wordCluster(request({ prompt: 'Design a garden', parentWord: 'Garden!', model: 'gpt-oss:20b', temperature: 0.2 }))
    const data = await response.json()
    expect(data.words).toHaveLength(12)
    expect(data.words[0]).toBe('garden')
    expect(data.systemPrompt).toContain('WORD: Garden!')
    expect(data.systemPrompt).not.toContain('PROMPT: Design a garden')
    expect(global.fetch).not.toHaveBeenCalled()
  })
})
