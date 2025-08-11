import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import PromptEnhancerPage from '@/app/prompt-enhancer/page'
import { ThemeProvider } from '@/components/ThemeProvider'
import { ModelProvider } from '@/components/ModelProvider'
import { DebugProvider } from '@/components/DebugProvider'
import { WelcomeProvider } from '@/components/WelcomeProvider'

// Mock Next.js navigation hooks
jest.mock('next/navigation', () => ({
  usePathname: () => '/prompt-enhancer'
}))

// Wrapper with all required providers
const AllProvidersWrapper = ({ children }: { children: React.ReactNode }) => (
  <ThemeProvider>
    <ModelProvider>
      <DebugProvider>
        <WelcomeProvider>
          {children}
        </WelcomeProvider>
      </DebugProvider>
    </ModelProvider>
  </ThemeProvider>
)

describe('Prompt Enhancer Page', () => {
  beforeEach(() => {
    // Clear localStorage so welcome modal behavior is consistent
    localStorage.clear()
  })

  it('renders the welcome modal initially', () => {
    render(
      <AllProvidersWrapper>
        <PromptEnhancerPage />
      </AllProvidersWrapper>
    )
    
    // Welcome modal should be visible initially
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Welcome to Promptpad')).toBeInTheDocument()
    expect(screen.getByText('ollama pull gpt-oss:20b')).toBeInTheDocument()
  })

  it('renders the Promptpad application shell after dismissing welcome modal', async () => {
    render(
      <AllProvidersWrapper>
        <PromptEnhancerPage />
      </AllProvidersWrapper>
    )
    
    // Dismiss the welcome modal
    fireEvent.click(screen.getByRole('button', { name: 'Get Started' }))
    
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    
    // Check for input and output sections
    expect(screen.getByRole('heading', { name: 'Input Draft', level: 2 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Enhanced Output', level: 2 })).toBeInTheDocument()
    
    // Check for text areas with proper labels
    expect(screen.getByLabelText('Prompt input area')).toBeInTheDocument()
    expect(screen.getByLabelText('Enhanced prompt output area')).toBeInTheDocument()
  })

  it('displays interactive text areas and disabled action buttons', async () => {
    // Set localStorage to skip welcome modal
    localStorage.setItem('promptpad-welcome-dismissed', 'true')
    
    render(
      <AllProvidersWrapper>
        <PromptEnhancerPage />
      </AllProvidersWrapper>
    )
    
    // Text areas should be enabled 
    expect(screen.getByLabelText('Prompt input area')).toBeEnabled()
    expect(screen.getByLabelText('Enhanced prompt output area')).toBeEnabled()
    
    // Enhancement buttons should be disabled when input is empty
    expect(screen.getByLabelText('Refine prompt - Expand brief instructions into detailed prompts')).toBeDisabled()
    expect(screen.getByLabelText('Reinforce prompt - Optimize and tighten existing prompts')).toBeDisabled()
    expect(screen.getByLabelText('Spec prompt - Generate comprehensive coding project specifications')).toBeDisabled()
  })

  it('shows token counters', () => {
    // Set localStorage to skip welcome modal
    localStorage.setItem('promptpad-welcome-dismissed', 'true')
    
    render(
      <AllProvidersWrapper>
        <PromptEnhancerPage />
      </AllProvidersWrapper>
    )
    
    // Should show token counts (initially 0)
    const tokenCounts = screen.getAllByText(/Tokens:/)
    expect(tokenCounts).toHaveLength(2) // One for each pane
    
    // Both should show 0 initially
    expect(screen.getAllByText('0')).toHaveLength(2)
  })

  it('displays welcome modal with setup instructions', () => {
    render(
      <AllProvidersWrapper>
        <PromptEnhancerPage />
      </AllProvidersWrapper>
    )
    
    expect(screen.getByText('Welcome to Promptpad')).toBeInTheDocument()
    expect(screen.getByText(/Your local-first prompt drafting tool/)).toBeInTheDocument()
    expect(screen.getByText('ollama pull gpt-oss:20b')).toBeInTheDocument()
  })

  it('has proper accessibility roles and focus management', () => {
    // Set localStorage to skip welcome modal
    localStorage.setItem('promptpad-welcome-dismissed', 'true')
    
    render(
      <AllProvidersWrapper>
        <PromptEnhancerPage />
      </AllProvidersWrapper>
    )
    
    // Main content should be present
    expect(screen.getByRole('main')).toBeInTheDocument()
    
    // Interactive elements should have focus-visible styles
    const textareas = screen.getAllByRole('textbox')
    textareas.forEach(textarea => {
      expect(textarea).toHaveClass('focus-visible')
    })
    
    // Check that main action buttons have proper focus styles
    const refineButton = screen.getByLabelText('Refine prompt - Expand brief instructions into detailed prompts')
    const reinforceButton = screen.getByLabelText('Reinforce prompt - Optimize and tighten existing prompts')
    expect(refineButton).toHaveClass('focus-visible')
    expect(reinforceButton).toHaveClass('focus-visible')
  })
})