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
})

