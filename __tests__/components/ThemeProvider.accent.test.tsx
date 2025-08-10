import { render } from '@testing-library/react'
import { ThemeProvider } from '@/components/ThemeProvider'

describe('ThemeProvider default accent', () => {
  it('sets default accent to emerald on first render', () => {
    localStorage.removeItem('promptpad-accent')
    render(<ThemeProvider><div>child</div></ThemeProvider>)
    expect(document.documentElement.dataset.accent).toBe('emerald')
  })
})
