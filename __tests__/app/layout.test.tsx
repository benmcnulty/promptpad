import { render, screen } from '@testing-library/react'
import RootLayout from '@/app/layout'

// jsdom does not set lang by default; we'll just ensure children render

describe('RootLayout', () => {
  it('renders children inside html/body', () => {
    render(<RootLayout><div data-testid="child">Child</div></RootLayout>)
    expect(screen.getByTestId('child')).toBeInTheDocument()
  })
})
