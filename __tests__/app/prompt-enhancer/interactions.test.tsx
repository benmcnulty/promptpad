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

// Mock refine hook to avoid network and control state
jest.mock('@/hooks/useRefine', () => ({
  useRefine: () => ({
    state: { loading: false, error: null, usage: { input_tokens: 3, output_tokens: 7 }, steps: [] },
    statusSummary: 'Idle',
    run: jest.fn(async (mode: string, text: string) => ({ output: `${mode.toUpperCase()}: ${text}`, systemPrompt: 'sys' })),
    reset: jest.fn()
  })
}))

describe('Prompt Enhancer – Core interactions', () => {
  beforeEach(() => localStorage.clear())

  it('dismisses welcome without persisting when checkbox not checked', async () => {
    render(<Providers><PromptEnhancerPage /></Providers>)
    fireEvent.click(screen.getByRole('button', { name: 'Get Started' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(localStorage.getItem('promptpad-welcome-dismissed')).toBeNull()
  })

  it('persists dismissal only when dont-show-again checked', async () => {
    render(<Providers><PromptEnhancerPage /></Providers>)
    // Simulate checking the hidden checkbox by toggling state via label click (label text)
    fireEvent.click(screen.getByText(/don't show this again/i))
    fireEvent.click(screen.getByRole('button', { name: 'Get Started' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(localStorage.getItem('promptpad-welcome-dismissed')).toBe('true')
  })

  it('enables refine button with input and produces output', async () => {
    localStorage.setItem('promptpad-welcome-dismissed', 'true')
    render(<Providers><PromptEnhancerPage /></Providers>)
    const input = screen.getByLabelText('Prompt input area') as HTMLTextAreaElement
    fireEvent.change(input, { target: { value: 'hello' } })
    const btn = screen.getByLabelText('Refine prompt - Expand brief instructions into detailed prompts')
    expect(btn).not.toBeDisabled()
    fireEvent.click(btn)
    await waitFor(() => {
      expect(screen.getByLabelText('Enhanced prompt output area')).toHaveValue('REFINE: hello')
    })
  })

  it('enables reinforce button with output present', async () => {
    localStorage.setItem('promptpad-welcome-dismissed', 'true')
    render(<Providers><PromptEnhancerPage /></Providers>)
    const output = screen.getByLabelText('Enhanced prompt output area') as HTMLTextAreaElement
    fireEvent.change(output, { target: { value: 'Some draft' } })
    const btn = screen.getByLabelText('Reinforce prompt - Optimize and tighten existing prompts')
    expect(btn).not.toBeDisabled()
  })

  it('enables spec button with input and produces spec output', async () => {
    localStorage.setItem('promptpad-welcome-dismissed', 'true')
    render(<Providers><PromptEnhancerPage /></Providers>)
    const input = screen.getByLabelText('Prompt input area') as HTMLTextAreaElement
    fireEvent.change(input, { target: { value: 'build a todo app' } })
    const specBtn = screen.getByLabelText('Spec prompt - Generate comprehensive coding project specifications')
    expect(specBtn).not.toBeDisabled()
    fireEvent.click(specBtn)
    await waitFor(() => {
      expect(screen.getByLabelText('Enhanced prompt output area')).toHaveValue('SPEC: build a todo app')
    })
  })
})
