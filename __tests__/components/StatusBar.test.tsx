import { render, screen, waitFor } from '@testing-library/react'
import StatusBar from '@/components/StatusBar'

// Mock fetch for component tests
const mockFetch = jest.fn()
global.fetch = mockFetch

describe('StatusBar', () => {
  beforeEach(() => {
    mockFetch.mockClear()
  })

  it('renders application status information', async () => {
    // Mock successful API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ models: [{ name: 'gpt-oss:20b' }] }),
    })

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
    
    // Wait for API call to complete
    await waitFor(() => {
      expect(screen.getByText('connected...')).toBeInTheDocument()
    })
  })

  it('displays checking status initially then updates', async () => {
    // Mock API call delay
    mockFetch.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ models: [] }),
      }), 100))
    )

    render(<StatusBar />)
    
    // Should show checking status initially
    expect(screen.getByText('checking...')).toBeInTheDocument()
    const checkingIndicator = screen.getByLabelText('Ollama status: checking')
    expect(checkingIndicator).toHaveClass('bg-yellow-500', 'animate-pulse')

    // Wait for status to update
    await waitFor(() => {
      expect(screen.getByText('connected...')).toBeInTheDocument()
    })
  })

  it('shows error status when API fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    render(<StatusBar />)

    await waitFor(() => {
      expect(screen.getByText('error...')).toBeInTheDocument()
      const errorIndicator = screen.getByLabelText('Ollama status: error')
      expect(errorIndicator).toHaveClass('bg-red-500')
    })
  })

  it('shows error status when API returns error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 503,
    })

    render(<StatusBar />)

    await waitFor(() => {
      expect(screen.getByText('error...')).toBeInTheDocument()
    })
  })

  it('applies custom className prop', () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ models: [] }),
    })

    const customClass = 'custom-status-bar'
    const { container } = render(<StatusBar className={customClass} />)
    
    expect(container.firstChild).toHaveClass(customClass)
  })
})