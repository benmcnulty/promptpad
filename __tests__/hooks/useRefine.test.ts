import { renderHook, act } from '@testing-library/react'
import { useRefine } from '@/hooks/useRefine'

describe('useRefine', () => {
  const originalFetch = global.fetch
  beforeEach(() => {
    (global.fetch as any) = jest.fn()
  })
  afterEach(() => {
    global.fetch = originalFetch
  })

  it('runs refine and returns output with usage and steps', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        output: 'refined text',
        usage: { input_tokens: 3, output_tokens: 5 },
      }),
    })

    const { result } = renderHook(() => useRefine('gpt-oss:20b', 0.2))
    let output: any
    await act(async () => {
      output = await result.current.run('refine', 'abc')
    })

    expect(output?.output).toBe('refined text')
    expect(result.current.state.usage?.input_tokens).toBe(3)
    expect(result.current.state.steps.find(s => s.id === 'update')?.status).toBe('done')
    expect(result.current.state.loading).toBe(false)
    expect(result.current.state.error).toBeNull()
  })

  it('sends the selected endpoint without changing the frozen JSON payload', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true, json: async () => ({ output: 'spec', usage: { input_tokens: 1, output_tokens: 1 } }) })
    const { result } = renderHook(() => useRefine('custom:7b', 0.2, 'http://ollama-lan:11434'))
    await act(async () => { await result.current.run('spec', 'plan') })
    expect(global.fetch).toHaveBeenCalledWith('/api/refine', expect.objectContaining({
      headers: { 'Content-Type': 'application/json', 'X-Ollama-Endpoint': 'http://ollama-lan:11434' },
      body: JSON.stringify({ mode: 'spec', model: 'custom:7b', temperature: 0.2, input: 'plan' }),
    }))
    expect(result.current.state.steps.map(step => step.id)).toEqual(['validate', 'call', 'process', 'update'])
  })

  it('rejects a removed endpoint before sending a request', async () => {
    const { result } = renderHook(() => useRefine('custom:7b', 0.2, null))
    await act(async () => { expect(await result.current.run('refine', 'plan')).toBeNull() })
    expect(global.fetch).not.toHaveBeenCalled()
    expect(result.current.state.error).toContain('no longer exists')
  })
})

