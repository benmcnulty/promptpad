import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Home from '@/app/page'

describe('Home Page', () => {
  beforeEach(() => {
    // Clear localStorage so welcome modal behavior is consistent
    localStorage.clear()
  })

  it('renders the welcome modal initially', () => {
    render(<Home />)
    
    // Welcome modal should be visible initially
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByText('Welcome to Promptpad')).toBeInTheDocument()
    expect(screen.getByText('ollama pull gpt-oss:20b')).toBeInTheDocument()
  })

  it('renders the Promptpad application shell after dismissing welcome modal', async () => {
    render(<Home />)
    
    // Dismiss the welcome modal
    fireEvent.click(screen.getByRole('button', { name: 'Get Started' }))
    
    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    })
    
    // Check for main heading (now accessible)
    expect(screen.getByRole('heading', { name: 'Promptpad', level: 1 })).toBeInTheDocument()
    
    // Check for input and output sections
    expect(screen.getByRole('heading', { name: 'Input Draft', level: 2 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Refined Output', level: 2 })).toBeInTheDocument()
    
    // Check for text areas with proper labels
    expect(screen.getByLabelText('Prompt input area')).toBeInTheDocument()
    expect(screen.getByLabelText('Prompt output area')).toBeInTheDocument()
  })

  it('displays interactive text areas and disabled action buttons', async () => {
    // Set localStorage to skip welcome modal
    localStorage.setItem('promptpad-welcome-dismissed', 'true')
    render(<Home />)
    
    // Text areas should be enabled 
    expect(screen.getByLabelText('Prompt input area')).toBeEnabled()
    expect(screen.getByLabelText('Prompt output area')).toBeEnabled()
    
    // Refine button should be disabled when input is empty
    expect(screen.getByLabelText('Refine prompt')).toBeDisabled()
    expect(screen.getByLabelText('Undo last change')).toBeDisabled()
    expect(screen.getByLabelText('Reinforce edited prompt')).toBeDisabled()
  })

  it('shows token counters', () => {
    // Set localStorage to skip welcome modal
    localStorage.setItem('promptpad-welcome-dismissed', 'true')
    render(<Home />)
    
    // Should show token counts (initially 0)
    const tokenCounts = screen.getAllByText(/Tokens:/)
    expect(tokenCounts).toHaveLength(2) // One for each pane
    
    // Both should show 0 initially
    expect(screen.getAllByText('0')).toHaveLength(2)
  })

  it('displays welcome modal with setup instructions', () => {
    render(<Home />)
    
    expect(screen.getByText('Welcome to Promptpad')).toBeInTheDocument()
    expect(screen.getByText(/Your local-first prompt drafting tool/)).toBeInTheDocument()
    expect(screen.getByText('ollama pull gpt-oss:20b')).toBeInTheDocument()
  })

  it('includes status bar', () => {
    // Set localStorage to skip welcome modal
    localStorage.setItem('promptpad-welcome-dismissed', 'true')
    render(<Home />)
    
    // Status bar should be present
    expect(screen.getByLabelText('Application status bar')).toBeInTheDocument()
  })

  it('has proper accessibility roles and focus management', () => {
    // Set localStorage to skip welcome modal
    localStorage.setItem('promptpad-welcome-dismissed', 'true')
    render(<Home />)
    
    // Main landmarks should be present
    expect(screen.getByRole('banner')).toBeInTheDocument() // header
    expect(screen.getByRole('main')).toBeInTheDocument()   // main content
    
    // Interactive elements should have focus-visible styles
    const textareas = screen.getAllByRole('textbox')
    textareas.forEach(textarea => {
      expect(textarea).toHaveClass('focus-visible')
    })
    
    // Check that main action buttons have proper focus styles
    const refineButton = screen.getByLabelText('Refine prompt')
    const reinforceButton = screen.getByLabelText('Reinforce edited prompt')
    expect(refineButton).toHaveClass('focus-visible')
    expect(reinforceButton).toHaveClass('focus-visible')
  })
})