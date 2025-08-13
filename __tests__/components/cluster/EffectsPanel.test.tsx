import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import EffectsPanel from '@/components/cluster/EffectsPanel'

describe('EffectsPanel', () => {
  const base = { layout: 'spherical', colorScheme: 'semantic', showConnections: true, animateExpansion: true, particleEffects: true, clusterSpacing: 2, wordSpacing: 0.8 }
  it('renders and updates layout mode', () => {
    const onChange = jest.fn()
    render(<EffectsPanel options={base as any} onChange={onChange} />)
    fireEvent.change(screen.getByDisplayValue('Spherical'), { target: { value: 'grid' } })
    expect(onChange).toHaveBeenCalled()
  })
  it('applies preset', () => {
    const onChange = jest.fn()
    render(<EffectsPanel options={base as any} onChange={onChange} />)
    fireEvent.click(screen.getByText('Minimal'))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ layout: 'grid', colorScheme: 'monochrome' }))
  })
})
