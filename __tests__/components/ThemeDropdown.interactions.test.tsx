import React from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import ThemeDropdown from '@/components/ThemeDropdown'
import { ThemeProvider } from '@/components/ThemeProvider'

describe('theme dropdown interactions', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => jest.restoreAllMocks())
  const mount = () => render(<ThemeProvider><ThemeDropdown /></ThemeProvider>)

  it('selects, persists and restores every public accent choice', () => {
    const first = mount()
    const trigger = () => screen.getByRole('button', { name: 'Select theme accent color' })
    for (const accent of ['Sapphire', 'Violet', 'Coral', 'Golden', 'Emerald']) {
      fireEvent.click(trigger())
      expect(trigger()).toHaveAttribute('aria-expanded', 'true')
      fireEvent.click(screen.getByRole('button', { name: accent }))
      expect(trigger()).toHaveTextContent(accent)
      expect(trigger()).toHaveAttribute('aria-expanded', 'false')
      expect(localStorage.getItem('promptpad-accent')).toBe(accent.toLowerCase())
      expect(document.documentElement.dataset.accent).toBe(accent.toLowerCase())
    }
    fireEvent.click(trigger())
    fireEvent.click(screen.getByRole('button', { name: 'Golden' }))
    first.unmount()
    mount()
    expect(trigger()).toHaveTextContent('Golden')
    fireEvent.click(trigger())
    expect(screen.getByRole('option', { name: 'Golden' })).toHaveAttribute('aria-selected', 'true')
  })

  it('opens above a low trigger, closes on Escape/outside click and releases listeners', () => {
    const { container, unmount } = mount()
    jest.spyOn(container.firstChild as HTMLElement, 'getBoundingClientRect').mockReturnValue({ top: 600, bottom: 650 } as DOMRect)
    jest.replaceProperty(window, 'innerHeight', 700)
    const trigger = screen.getByRole('button', { name: 'Select theme accent color' })
    fireEvent.click(trigger)
    expect(screen.getByRole('listbox').parentElement).toHaveClass('bottom-full')
    fireEvent.mouseDown(trigger)
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'ArrowDown' })
    expect(screen.getByRole('listbox')).toBeInTheDocument()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    fireEvent.click(trigger)
    fireEvent.mouseDown(document.body)
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
    const remove = jest.spyOn(document, 'removeEventListener')
    unmount()
    expect(remove).toHaveBeenCalledWith('mousedown', expect.any(Function))
    expect(remove).toHaveBeenCalledWith('keydown', expect.any(Function))
  })
})
