import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Home from '@/app/page'
import { ThemeProvider } from '@/components/ThemeProvider'
import { ModelProvider } from '@/components/ModelProvider'

// Mock useRefine to avoid network
jest.mock('@/hooks/useRefine', () => {
  return {
    useRefine: () => ({
      state: { loading: false, error: null, usage: { input_tokens: 1, output_tokens: 2 }, steps: [] },
      statusSummary: 'Idle',
      run: jest.fn(async () => ({ output: 'ok', systemPrompt: 'sys', fallbackUsed: false })),
      reset: jest.fn(),
    }),
  }
})

// Mock clipboard
Object.assign(navigator, { clipboard: { writeText: jest.fn() } })

describe('Debug panel model logging and copy', () => {
  beforeEach(() => {
    localStorage.clear()
    // Preselect a different model
    localStorage.setItem('promptpad-model', 'llama3.1:8b')
    localStorage.setItem('promptpad-welcome-dismissed', 'true')
  })

  it('logs selected model in request payload', async () => {
    render(<ThemeProvider><ModelProvider><Home /></ModelProvider></ThemeProvider>)

    // Open debug panel
    fireEvent.click(await screen.findByRole('button', { name: /debug/i }))

    // Enter input and refine
    fireEvent.change(screen.getByLabelText('Prompt input area'), { target: { value: 'hello' } })
    fireEvent.click(screen.getByLabelText('Refine prompt - Expand brief instructions into detailed prompts'))

    await waitFor(() => {
      expect(screen.getByText(/REQUEST/i)).toBeInTheDocument()
    })

  // The request payload JSON should include the selected model (at least once)
  const matches = screen.getAllByText(/llama3\.1:8b/)
  expect(matches.length).toBeGreaterThanOrEqual(1)
  })

  it('copies entire debug output via button', async () => {
    const writeText = jest.spyOn(navigator.clipboard, 'writeText')
    render(<ThemeProvider><ModelProvider><Home /></ModelProvider></ThemeProvider>)
    fireEvent.click(await screen.findByRole('button', { name: /debug/i }))

    fireEvent.change(screen.getByLabelText('Prompt input area'), { target: { value: 'hello' } })
    fireEvent.click(screen.getByLabelText('Refine prompt - Expand brief instructions into detailed prompts'))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /copy debug output/i })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: /copy debug output/i }))
    await waitFor(() => {
      expect(writeText).toHaveBeenCalled()
    })
  })
})

