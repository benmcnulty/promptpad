import React from 'react'
import { fireEvent, screen, act } from '@testing-library/react'
import { render, mockFetch, mockModelsData } from '@/__tests__/utils/test-providers'
import StatusBar from '@/components/StatusBar'

describe('ModelDropdown', () => {
  beforeEach(() => {
    localStorage.clear()
    mockFetch(mockModelsData)
  })

  it('shows default model and updates preference on select', async () => {
    render(<StatusBar />, { wrapper: 'model' })

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

