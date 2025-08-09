import { render, screen } from '@testing-library/react'
import StatusBar from '@/components/StatusBar'

describe('StatusBar', () => {
  it('renders application status information', () => {
    render(<StatusBar />)
    
    // Check for status bar role
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByLabelText('Application status bar')).toBeInTheDocument()
    
    // Check for git SHA display
    expect(screen.getByText('Git:')).toBeInTheDocument()
    expect(screen.getByText('abc1234')).toBeInTheDocument()
    
    // Check for default model display
    expect(screen.getByText('Model:')).toBeInTheDocument()
    expect(screen.getByText('gpt-oss:20b')).toBeInTheDocument()
    
    // Check for Ollama status
    expect(screen.getByText('Ollama:')).toBeInTheDocument()
    expect(screen.getByText('checking...')).toBeInTheDocument()
  })

  it('displays Ollama connection status indicator', () => {
    render(<StatusBar />)
    
    // Should show checking status by default
    const statusIndicator = screen.getByLabelText('Ollama status: checking')
    expect(statusIndicator).toBeInTheDocument()
    expect(statusIndicator).toHaveClass('bg-yellow-500', 'animate-pulse')
  })

  it('applies custom className prop', () => {
    const customClass = 'custom-status-bar'
    const { container } = render(<StatusBar className={customClass} />)
    
    expect(container.firstChild).toHaveClass(customClass)
  })
})