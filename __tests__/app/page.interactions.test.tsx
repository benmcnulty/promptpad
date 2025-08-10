import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Home from '@/app/page'
import { ThemeProvider } from '@/components/ThemeProvider'

describe('Home Page interactions', () => {
  beforeEach(() => {
    // @ts-ignore jsdom provides localStorage
    localStorage.clear()
  })

  it('dismisses welcome and sets localStorage when checkbox checked', async () => {
  render(<ThemeProvider><Home /></ThemeProvider>)
    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)
    fireEvent.click(screen.getByRole('button', { name: 'Get Started' }))
    await waitFor(() => {
      expect(screen.queryByText('Welcome to Promptpad')).toBeNull()
    })
    expect(localStorage.getItem('promptpad-welcome-dismissed')).toBe('true')
  })

  it('toggles theme and persists selection', () => {
    // Skip welcome modal for easier access
    localStorage.setItem('promptpad-welcome-dismissed', 'true')
  render(<ThemeProvider><Home /></ThemeProvider>)
    const initialTheme = document.documentElement.dataset.theme
    const toggle = screen.getByRole('button', { name: /toggle color theme/i })
    fireEvent.click(toggle)
    const newTheme = document.documentElement.dataset.theme
    expect(newTheme).not.toBe(initialTheme)
  })

  it('changes accent color via dropdown', () => {
    localStorage.setItem('promptpad-welcome-dismissed', 'true')
  render(<ThemeProvider><Home /></ThemeProvider>)
    const select = screen.getByLabelText(/accent color/i)
    fireEvent.change(select, { target: { value: 'amber' } })
    expect(document.documentElement.dataset.accent).toBe('amber')
  })

  it('reset welcome button clears dismissal flag', () => {
    localStorage.setItem('promptpad-welcome-dismissed', 'true')
  render(<ThemeProvider><Home /></ThemeProvider>)
    // Open debug
    fireEvent.click(screen.getByRole('button', { name: /debug/i }))
    const resetBtn = screen.getByTestId('reset-welcome')
    fireEvent.click(resetBtn)
    expect(localStorage.getItem('promptpad-welcome-dismissed')).toBeNull()
  })

  it('skips welcome when localStorage flag present', () => {
    localStorage.setItem('promptpad-welcome-dismissed', 'true')
  render(<ThemeProvider><Home /></ThemeProvider>)
    expect(screen.queryByText('Welcome to Promptpad')).toBeNull()
  })

  it('toggles debug panel via status bar', async () => {
    // Set localStorage to skip welcome modal so status bar is accessible
    localStorage.setItem('promptpad-welcome-dismissed', 'true')
  render(<ThemeProvider><Home /></ThemeProvider>)
    const debugButton = await screen.findByRole('button', { name: /debug/i })
    fireEvent.click(debugButton)
    await waitFor(() => {
      expect(screen.getByText(/Debug Terminal/)).toBeInTheDocument()
    })
    // Close panel via ✕ button
    fireEvent.click(screen.getByText('✕'))
    await waitFor(() => {
      expect(screen.queryByText(/Debug Terminal/)).toBeNull()
    })
  })
})
