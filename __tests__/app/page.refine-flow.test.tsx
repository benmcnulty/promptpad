import { render, screen, fireEvent, waitFor } from '@testing-library/react'

// Mock useRefine to control behavior
jest.mock('@/hooks/useRefine', () => {
  return {
    useRefine: () => ({
      state: { loading: false, error: null, usage: { input_tokens: 1, output_tokens: 2 }, steps: [] },
      statusSummary: 'Idle',
      run: jest.fn(async (mode: string, text: string) => {
        if (text === 'bad') return { output: '   ', systemPrompt: 'sys', fallbackUsed: true }
        if (text === 'err') throw new Error('boom')
        return { output: 'Refined: ' + text, systemPrompt: 'sys', fallbackUsed: false }
      }),
      reset: jest.fn(),
    }),
  }
})

import Home from '@/app/page'

describe('Home refine flow (mocked)', () => {
  it('handles successful refine and sets output text', async () => {
    render(<Home />)
    fireEvent.change(screen.getByLabelText('Prompt input area'), { target: { value: 'idea' } })
    const btn = screen.getByLabelText('Refine prompt')
    expect(btn).toBeEnabled()
    fireEvent.click(btn)
    await waitFor(() => {
      expect(screen.getByLabelText('Prompt output area')).toHaveValue('Refined: idea')
    })
  })

  it('logs fallback when output invalid (blank string)', async () => {
    render(<Home />)
    fireEvent.change(screen.getByLabelText('Prompt input area'), { target: { value: 'bad' } })
    const btn = screen.getByLabelText('Refine prompt')
    fireEvent.click(btn)
    await waitFor(() => {
      // Should not set output (blank trimmed)
      expect(screen.getByLabelText('Prompt output area')).toHaveValue('')
    })
  })
})
