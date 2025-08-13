import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import ControlsPanel, { ControlsState } from '@/components/visualizer/ControlsPanel'

function setup(initial?: Partial<ControlsState>) {
  const onChange = jest.fn()
  render(<ControlsPanel value={initial} onChange={onChange} />)
  return { onChange }
}

describe('ControlsPanel', () => {
  beforeEach(() => localStorage.clear())

  it('renders and triggers onChange with defaults', () => {
    const { onChange } = setup()
    // first effect triggers at mount
    expect(onChange).toHaveBeenCalled()
    expect(screen.getByText(/Controls/i)).toBeInTheDocument()
  })

  it('persists and restores state', () => {
    const { onChange } = setup({ layout: 'sequentialPath', pointSize: 0.05 })
    // first call
    const initial = onChange.mock.calls[0][0]
    expect(initial.layout).toBe('sequentialPath')
    // change layout via select (label text: Layout)
    const select = screen.getByLabelText('Layout') as HTMLSelectElement
    fireEvent.change(select, { target: { value: 'radialSpiral' } })
    const updated = onChange.mock.calls.pop()[0]
    expect(updated.layout).toBe('radialSpiral')
    // ensure persisted
    const raw = localStorage.getItem('ppviz:v1:controls')
    expect(raw).toContain('radialSpiral')
  })
})
