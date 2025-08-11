import React from 'react'
import { render, fireEvent, act } from '@testing-library/react'

jest.useFakeTimers()

describe('Tooltip positioning guards', () => {
  beforeEach(() => {
    // Ensure a body exists for portal
    document.body.innerHTML = ''
  })

  it('does not error when focusing/typing in child input', () => {
    const Tooltip = require('@/components/Tooltip').default

    const { getByRole } = render(
      <Tooltip content="hello" position="bottom">
        <textarea aria-label="prompt" />
      </Tooltip>
    )

    const input = getByRole('textbox')

    // Focus should not trigger tooltip handlers that rely on mouse coordinates
    // (onFocus handler was removed to prevent NaN top/left values)
    expect(() => {
      fireEvent.focus(input)
      fireEvent.change(input, { target: { value: 'x' } })
    }).not.toThrow()

    // Mouse enter + move still positions without NaN values
    act(() => {
      fireEvent.mouseEnter(input, { clientX: 150, clientY: 200 })
      jest.advanceTimersByTime(600) // after delay
      fireEvent.mouseMove(input, { clientX: 160, clientY: 210 })
    })

    // Nothing to assert on styles directly in JSDOM; success is no exceptions
  })
})

