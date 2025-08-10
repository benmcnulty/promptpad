import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Home from '@/app/page'

describe('Home Page interactions', () => {
  beforeEach(() => {
    // @ts-ignore jsdom provides localStorage
    localStorage.clear()
  })

  it('dismisses welcome and sets localStorage when checkbox checked', async () => {
    render(<Home />)
    const checkbox = screen.getByRole('checkbox')
    fireEvent.click(checkbox)
    fireEvent.click(screen.getByRole('button', { name: 'Get Started' }))
    await waitFor(() => {
      expect(screen.queryByText('Welcome to Promptpad')).toBeNull()
    })
    expect(localStorage.getItem('promptpad-welcome-dismissed')).toBe('true')
  })

  it('skips welcome when localStorage flag present', () => {
    localStorage.setItem('promptpad-welcome-dismissed', 'true')
    render(<Home />)
    expect(screen.queryByText('Welcome to Promptpad')).toBeNull()
  })

  it('toggles debug panel via status bar', async () => {
    render(<Home />)
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
