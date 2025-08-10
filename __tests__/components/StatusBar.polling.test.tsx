import { render, screen, act } from '@testing-library/react'
import StatusBar from '@/components/StatusBar'
import { ThemeProvider } from '@/components/ThemeProvider'

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
  render(<ThemeProvider><StatusBar /></ThemeProvider>)

    // Initial calls: /api/git-info and first /api/models check
    expect(global.fetch).toHaveBeenCalledTimes(2)

    // Advance 29s: no new call yet (depending on timer tick granularity, allow none)
    await act(async () => {
      jest.advanceTimersByTime(29000)
    })
    expect(global.fetch).toHaveBeenCalledTimes(2)

    // Hit 30s
    await act(async () => {
      jest.advanceTimersByTime(1000)
    })
    expect(global.fetch).toHaveBeenCalledTimes(3)
  })
})
