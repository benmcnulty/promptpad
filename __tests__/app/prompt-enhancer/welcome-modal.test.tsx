import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PromptEnhancerPage from '@/app/prompt-enhancer/page'
import { ThemeProvider } from '@/components/ThemeProvider'
import { ModelProvider } from '@/components/ModelProvider'
import { DebugProvider } from '@/components/DebugProvider'
import { WelcomeProvider } from '@/components/WelcomeProvider'

const Providers = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    <ModelProvider>
      <DebugProvider>
        <WelcomeProvider>{children}</WelcomeProvider>
      </DebugProvider>
    </ModelProvider>
  </ThemeProvider>
)

describe('Prompt Enhancer – Welcome modal', () => {
  beforeEach(() => localStorage.clear())

  it('shows welcome modal initially', () => {
    render(<Providers><PromptEnhancerPage /></Providers>)
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Welcome to Promptpad')).toBeInTheDocument()
  })

  it('dismisses with Get Started button (no persistence without checkbox)', async () => {
    render(<Providers><PromptEnhancerPage /></Providers>)
    fireEvent.click(screen.getByRole('button', { name: 'Get Started' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(localStorage.getItem('promptpad-welcome-dismissed')).toBeNull()
  })

  it('persists when dont-show-again checked then Get Started', async () => {
    render(<Providers><PromptEnhancerPage /></Providers>)
    fireEvent.click(screen.getByText(/don't show this again/i))
    fireEvent.click(screen.getByRole('button', { name: 'Get Started' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(localStorage.getItem('promptpad-welcome-dismissed')).toBe('true')
  })

  it('dismisses with close button (no persistence)', async () => {
    render(<Providers><PromptEnhancerPage /></Providers>)
    fireEvent.click(screen.getByRole('button', { name: 'Close welcome message' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(localStorage.getItem('promptpad-welcome-dismissed')).toBeNull()
  })
})
