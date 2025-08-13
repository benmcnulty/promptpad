import { screen, fireEvent, waitFor } from '@testing-library/react'
import { render } from '@/__tests__/utils/test-providers'
import PromptEnhancerPage from '@/app/prompt-enhancer/page'

describe('Prompt Enhancer – Welcome modal', () => {
  beforeEach(() => localStorage.clear())

  it('shows welcome modal initially', () => {
    render(<PromptEnhancerPage />, { wrapper: 'all' })
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Welcome to Promptpad')).toBeInTheDocument()
  })

  it('dismisses with Get Started button (no persistence without checkbox)', async () => {
    render(<PromptEnhancerPage />, { wrapper: 'all' })
    fireEvent.click(screen.getByRole('button', { name: 'Get Started' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(localStorage.getItem('promptpad-welcome-dismissed')).toBeNull()
  })

  it('persists when dont-show-again checked then Get Started', async () => {
    render(<PromptEnhancerPage />, { wrapper: 'all' })
    fireEvent.click(screen.getByText(/don't show this again/i))
    fireEvent.click(screen.getByRole('button', { name: 'Get Started' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(localStorage.getItem('promptpad-welcome-dismissed')).toBe('true')
  })

  it('dismisses with close button (no persistence)', async () => {
    render(<PromptEnhancerPage />, { wrapper: 'all' })
    fireEvent.click(screen.getByRole('button', { name: 'Close welcome message' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(localStorage.getItem('promptpad-welcome-dismissed')).toBeNull()
  })
})
