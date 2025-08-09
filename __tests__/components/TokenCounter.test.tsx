import { render, screen, waitFor } from '@testing-library/react'
import TokenCounter, { CompactTokenCounter } from '@/components/TokenCounter'

// Mock the token counting hook
jest.mock('@/hooks/useTokenCount', () => ({
  useTokenCount: jest.fn(),
}))

const mockUseTokenCount = require('@/hooks/useTokenCount').useTokenCount as jest.MockedFunction<any>

describe('TokenCounter', () => {
  beforeEach(() => {
    mockUseTokenCount.mockClear()
  })

  it('displays token count', async () => {
    mockUseTokenCount.mockReturnValue({
      count: 42,
      isLoading: false,
      error: null,
    })

    render(<TokenCounter text="test text" />)
    
    expect(screen.getByText('Tokens:')).toBeInTheDocument()
    expect(screen.getByText('42')).toBeInTheDocument()
    expect(mockUseTokenCount).toHaveBeenCalledWith('test text', {
      enabled: true,
      debounceMs: 300
    })
  })

  it('displays custom label', async () => {
    mockUseTokenCount.mockReturnValue({
      count: 10,
      isLoading: false,
      error: null,
    })

    render(<TokenCounter text="test" label="Input Tokens" />)
    
    expect(screen.getByText('Input Tokens:')).toBeInTheDocument()
    expect(screen.getByText('10')).toBeInTheDocument()
  })

  it('shows loading state', async () => {
    mockUseTokenCount.mockReturnValue({
      count: 0,
      isLoading: true,
      error: null,
    })

    render(<TokenCounter text="test" showLoader={true} />)
    
    expect(screen.getByText('Tokens:')).toBeInTheDocument()
    expect(screen.getByText('⋯')).toBeInTheDocument()
  })

  it('hides loader when showLoader is false', async () => {
    mockUseTokenCount.mockReturnValue({
      count: 5,
      isLoading: true,
      error: null,
    })

    render(<TokenCounter text="test" showLoader={false} />)
    
    expect(screen.getByText('5')).toBeInTheDocument()
    expect(screen.queryByText('⋯')).not.toBeInTheDocument()
  })

  it('displays error state', async () => {
    mockUseTokenCount.mockReturnValue({
      count: 0,
      isLoading: false,
      error: 'Token counting failed',
    })

    render(<TokenCounter text="test" />)
    
    expect(screen.getByText('Tokens: Error')).toBeInTheDocument()
    expect(screen.getByTitle('Token counting error: Token counting failed')).toBeInTheDocument()
  })

  it('can be disabled', async () => {
    mockUseTokenCount.mockReturnValue({
      count: 0,
      isLoading: false,
      error: null,
    })

    render(<TokenCounter text="test" enabled={false} />)
    
    expect(mockUseTokenCount).toHaveBeenCalledWith('test', {
      enabled: false,
      debounceMs: 300
    })
  })

  it('applies custom className', async () => {
    mockUseTokenCount.mockReturnValue({
      count: 15,
      isLoading: false,
      error: null,
    })

    render(<TokenCounter text="test" className="custom-class" />)
    
    const element = screen.getByLabelText('Tokens: 15')
    expect(element).toHaveClass('custom-class')
  })

  it('formats large numbers with locale', async () => {
    mockUseTokenCount.mockReturnValue({
      count: 1234567,
      isLoading: false,
      error: null,
    })

    render(<TokenCounter text="long text" />)
    
    expect(screen.getByText('1,234,567')).toBeInTheDocument()
  })
})

describe('CompactTokenCounter', () => {
  beforeEach(() => {
    mockUseTokenCount.mockClear()
  })

  it('displays compact token count', async () => {
    mockUseTokenCount.mockReturnValue({
      count: 25,
      isLoading: false,
      error: null,
    })

    render(<CompactTokenCounter text="test text" />)
    
    expect(screen.getByText('25')).toBeInTheDocument()
    expect(screen.getByLabelText('25 tokens')).toBeInTheDocument()
  })

  it('shows loading in compact form', async () => {
    mockUseTokenCount.mockReturnValue({
      count: 0,
      isLoading: true,
      error: null,
    })

    render(<CompactTokenCounter text="test" />)
    
    expect(screen.getByText('⋯')).toBeInTheDocument()
  })

  it('shows error in compact form', async () => {
    mockUseTokenCount.mockReturnValue({
      count: 0,
      isLoading: false,
      error: 'Failed to count',
    })

    render(<CompactTokenCounter text="test" />)
    
    expect(screen.getByText('ERR')).toBeInTheDocument()
    expect(screen.getByTitle('Token counting error')).toBeInTheDocument()
    expect(screen.getByLabelText('Token count error')).toBeInTheDocument()
  })

  it('formats large numbers in compact form', async () => {
    mockUseTokenCount.mockReturnValue({
      count: 9876,
      isLoading: false,
      error: null,
    })

    render(<CompactTokenCounter text="test" />)
    
    expect(screen.getByText('9,876')).toBeInTheDocument()
  })

  it('applies custom className to compact counter', async () => {
    mockUseTokenCount.mockReturnValue({
      count: 7,
      isLoading: false,
      error: null,
    })

    render(<CompactTokenCounter text="test" className="compact-custom" />)
    
    const element = screen.getByLabelText('7 tokens')
    expect(element).toHaveClass('compact-custom')
  })
})