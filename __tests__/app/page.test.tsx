import { render, screen } from '@testing-library/react'
import Home from '@/app/page'

describe('Home Page', () => {
  it('renders the Promptpad application shell', () => {
    render(<Home />)
    
    // Check for main heading
    expect(screen.getByRole('heading', { name: 'Promptpad', level: 1 })).toBeInTheDocument()
    
    // Check for input and output sections
    expect(screen.getByRole('heading', { name: 'Input', level: 2 })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Output', level: 2 })).toBeInTheDocument()
    
    // Check for text areas with proper labels
    expect(screen.getByLabelText('Prompt input area')).toBeInTheDocument()
    expect(screen.getByLabelText('Prompt output area')).toBeInTheDocument()
  })

  it('displays interactive text areas and disabled action buttons', () => {
    render(<Home />)
    
    // Text areas should now be enabled for token counting demo
    expect(screen.getByLabelText('Prompt input area')).toBeEnabled()
    expect(screen.getByLabelText('Prompt output area')).toBeEnabled()
    
    // Action buttons should still be disabled until functionality is implemented
    expect(screen.getByLabelText('Refine prompt')).toBeDisabled()
    expect(screen.getByLabelText('Undo last change')).toBeDisabled()
    expect(screen.getByLabelText('Reinforce edited prompt')).toBeDisabled()
  })

  it('shows token counters', () => {
    render(<Home />)
    
    // Should show token counts (initially 0)
    const tokenCounts = screen.getAllByText(/Tokens:/)
    expect(tokenCounts).toHaveLength(2) // One for each pane
    
    // Both should show 0 initially
    expect(screen.getAllByText('0')).toHaveLength(2)
  })

  it('displays empty state with setup instructions', () => {
    render(<Home />)
    
    expect(screen.getByText('Welcome to Promptpad')).toBeInTheDocument()
    expect(screen.getByText(/Your local-first prompt drafting tool/)).toBeInTheDocument()
    expect(screen.getByText('ollama pull gpt-oss:20b')).toBeInTheDocument()
  })

  it('includes status bar', () => {
    render(<Home />)
    
    // Status bar should be present
    expect(screen.getByLabelText('Application status bar')).toBeInTheDocument()
  })

  it('has proper accessibility roles and focus management', () => {
    render(<Home />)
    
    // Main landmarks should be present
    expect(screen.getByRole('banner')).toBeInTheDocument() // header
    expect(screen.getByRole('main')).toBeInTheDocument()   // main content
    
    // Interactive elements should have focus-visible styles
    const textareas = screen.getAllByRole('textbox')
    textareas.forEach(textarea => {
      expect(textarea).toHaveClass('focus-visible')
    })
    
    const buttons = screen.getAllByRole('button')
    buttons.forEach(button => {
      expect(button).toHaveClass('focus-visible')
    })
  })
})