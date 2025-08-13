import { render, screen } from '@testing-library/react'
import RootLayout from '@/app/layout'

// Mock Next.js navigation hooks for AppHeader component
jest.mock('next/navigation', () => ({
  usePathname: () => '/test'
}))

// Mock fetch for AppFooter git info and model checks
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ sha: 'test123', models: [] }),
  })
) as jest.Mock

describe('RootLayout', () => {
  beforeEach(() => {
    localStorage.clear()
    ;(fetch as jest.Mock).mockClear()
  })

  it('renders children inside html/body with all providers', () => {
    render(<RootLayout><div data-testid="child">Child</div></RootLayout>)
    expect(screen.getByTestId('child')).toBeInTheDocument()
    
    // Check that layout includes header and footer
    expect(screen.getByRole('banner')).toBeInTheDocument() // header
    expect(screen.getByRole('contentinfo')).toBeInTheDocument() // footer
  })

  it('includes persistent navigation header', () => {
    render(<RootLayout><div data-testid="child">Child</div></RootLayout>)
    
    // Should include Promptpad title
    expect(screen.getByRole('heading', { name: 'Promptpad', level: 1 })).toBeInTheDocument()
    
    // Should include navigation links
    expect(screen.getByRole('link', { name: /Prompt Enhancer/ })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Dimensional Visualizer/ })).toBeInTheDocument()
  })

  it('includes status bar footer', () => {
    render(<RootLayout><div data-testid="child">Child</div></RootLayout>)
    
    // Should include status bar
    expect(screen.getByRole('status')).toBeInTheDocument()
    expect(screen.getByText(/Git:/)).toBeInTheDocument()
    expect(screen.getByText(/Model:/)).toBeInTheDocument()
  })
})
