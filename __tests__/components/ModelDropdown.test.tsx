import React from 'react'
import { render, fireEvent, screen, act } from '@testing-library/react'
import StatusBar from '@/components/StatusBar'
import { ModelProvider } from '@/components/ModelProvider'
import { ThemeProvider } from '@/components/ThemeProvider'

describe('ModelDropdown', () => {
  beforeEach(() => {
    localStorage.clear()
    // Mock fetch for /api/models
    // @ts-ignore
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ([
        { name: 'gpt-oss:20b', family: 'gpt-oss', parameters: '20b', default: true },
        { name: 'llama3.1:8b', family: 'llama', parameters: '8b' },
      ]),
    })
  })

  it('shows default model and updates preference on select', async () => {
  render(<ThemeProvider><ModelProvider><StatusBar /></ModelProvider></ThemeProvider>)

    // Default label should be visible
    expect(await screen.findByTitle(/select model/i)).toBeInTheDocument()

    // Open dropdown
    const trigger = screen.getByTitle(/select model/i)
    act(() => { fireEvent.click(trigger) })

    // Choose llama3.1:8b
    const option = await screen.findByText('llama3.1:8b')
    act(() => { fireEvent.click(option) })

    expect(localStorage.getItem('promptpad-model')).toBe('llama3.1:8b')
  })
})

