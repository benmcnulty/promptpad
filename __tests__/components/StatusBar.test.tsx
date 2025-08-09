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
    // First call: /api/git-info
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sha: 'abc1234', branch: 'main' }),
    })
    // Second call: /api/models
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ models: [{ name: 'gpt-oss:20b' }] }),
    })

    render(<StatusBar />)
    
    // Check for status bar role
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByLabelText('Application status bar')).toBeInTheDocument()
    
    // Check for git SHA display (async)
    expect(screen.getByText('Git:')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('abc1234')).toBeInTheDocument()
    })
    
    // Check for default model display
    expect(screen.getByText('Model:')).toBeInTheDocument()
    expect(screen.getByText('gpt-oss:20b')).toBeInTheDocument()
    
    // Check for Ollama status
    expect(screen.getByText('Ollama:')).toBeInTheDocument()
    
    // Wait for API call to complete
    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument()
    })
  })

  it('displays checking status initially then updates', async () => {
    // First call: /api/git-info
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sha: 'abc1234', branch: 'main' }),
    })
    // Second call: /api/models with delay
    mockFetch.mockImplementationOnce(() => 
      new Promise(resolve => setTimeout(() => resolve({
        ok: true,
        json: async () => ({ models: [] }),
      }), 100))
    )

    render(<StatusBar />)
    
    // Should show checking status initially
    expect(screen.getByText('Checking...')).toBeInTheDocument()
    const checkingIndicator = screen.getByLabelText('Ollama status: checking')
    expect(checkingIndicator).toHaveClass('bg-amber-500', 'animate-pulse')

    // Wait for status to update
    await waitFor(() => {
      expect(screen.getByText('Connected')).toBeInTheDocument()
    })
  })

  it('shows error status when API fails', async () => {
    // First call: /api/git-info
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sha: 'abc1234', branch: 'main' }),
    })
    // Second call: /api/models fails
    mockFetch.mockRejectedValueOnce(new Error('Network error'))

    render(<StatusBar />)

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument()
      const errorIndicator = screen.getByLabelText('Ollama status: error')
      expect(errorIndicator).toHaveClass('bg-red-500')
    })
  })

  it('shows error status when API returns error response', async () => {
    // First: /api/git-info
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sha: 'abc1234', branch: 'main' }),
    })
    // Second: /api/models error
    mockFetch.mockResolvedValueOnce({ ok: false, status: 503 })

    render(<StatusBar />)

    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument()
    })
  })

  it('applies custom className prop', () => {
    // First: /api/git-info
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ sha: 'abc1234', branch: 'main' }),
    })
    // Second: /api/models
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ models: [] }) })

    const customClass = 'custom-status-bar'
    const { container } = render(<StatusBar className={customClass} />)
    
    expect(container.firstChild).toHaveClass(customClass)
  })
})
