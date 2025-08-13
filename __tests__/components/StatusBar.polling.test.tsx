import { screen, act } from '@testing-library/react'
import { render } from '@/__tests__/utils/test-providers'
import StatusBar from '@/components/StatusBar'

describe('StatusBar polling', () => {
  const originalFetch = global.fetch
  beforeEach(() => {
    jest.useFakeTimers()
    ;(global.fetch as any) = jest.fn().mockResolvedValue({ ok: true })
  })
  afterEach(() => {
    jest.useRealTimers()
    global.fetch = originalFetch
  })

  it('does not duplicate polling and polls approximately every 30s', async () => {
    render(<StatusBar />, { wrapper: 'model' })

    // Initial calls: /api/git-info plus one or two /api/models (provider + status bar)
    const initialCalls = (global.fetch as any).mock.calls.length
    expect(initialCalls).toBeGreaterThanOrEqual(2)

    // Advance 29s: no new call yet (depending on timer tick granularity, allow none)
    await act(async () => {
      jest.advanceTimersByTime(29000)
    })
    expect((global.fetch as any).mock.calls.length).toBe(initialCalls)

    // Hit 30s
    await act(async () => {
      jest.advanceTimersByTime(1000)
    })
    expect((global.fetch as any).mock.calls.length).toBe(initialCalls + 1)
  })
})
