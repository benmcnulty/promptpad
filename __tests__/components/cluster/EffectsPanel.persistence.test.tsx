import React, { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import EffectsPanel from '@/components/cluster/EffectsPanel'
import type { ClusterVisualizationOptions } from '@/lib/vectorization/cluster-types'

const key = 'ppviz:cluster-effects:v1'
const base: ClusterVisualizationOptions = { layout: 'spherical', colorScheme: 'semantic', showConnections: true, animateExpansion: true, particleEffects: true, clusterSpacing: 2, wordSpacing: 0.8 }
function Harness() {
  const [options, setOptions] = useState(base)
  return <EffectsPanel options={options} onChange={setOptions} />
}
describe('effects controls and persistence', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => jest.restoreAllMocks())

  it('restores saved choices and persists each user control without dropping other options', () => {
    localStorage.setItem(key, JSON.stringify({ layout: 'grid', particleEffects: false }))
    render(<Harness />)
    expect(screen.getByDisplayValue('Grid')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Particle Effects' })).not.toBeChecked()
    fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: 'rainbow' } })
    fireEvent.change(screen.getAllByRole('slider')[0], { target: { value: '3.5' } })
    fireEvent.change(screen.getAllByRole('slider')[1], { target: { value: '1.4' } })
    for (const name of ['Show Connections', 'Animate Expansion', 'Particle Effects']) fireEvent.click(screen.getByRole('checkbox', { name }))
    expect(JSON.parse(localStorage.getItem(key)!)).toEqual({ ...base, layout: 'grid', colorScheme: 'rainbow', clusterSpacing: 3.5, wordSpacing: 1.4, showConnections: false, animateExpansion: false, particleEffects: true })
    expect(screen.getByText('Cluster Spacing: 3.5')).toBeInTheDocument()
    expect(screen.getByText('Word Spacing: 1.4')).toBeInTheDocument()
    expect(screen.getByText('Full spectrum gradient')).toBeInTheDocument()
  })

  it.each([
    ['Clean', { layout: 'hierarchical', colorScheme: 'depth', showConnections: true, animateExpansion: false, particleEffects: false, clusterSpacing: 3, wordSpacing: 1.2 }],
    ['Vibrant', { layout: 'organic', colorScheme: 'rainbow', showConnections: true, animateExpansion: true, particleEffects: true, clusterSpacing: 1.5, wordSpacing: 0.6 }],
    ['Minimal', { layout: 'grid', colorScheme: 'monochrome', showConnections: false, animateExpansion: false, particleEffects: false, clusterSpacing: 2.5, wordSpacing: 1 }],
    ['Default', base]
  ])('applies and persists the entire %s preset', (name, expected) => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: name as string }))
    expect(JSON.parse(localStorage.getItem(key)!)).toEqual(expected)
  })

  it('recovers from corrupt saved JSON and keeps controls usable when storage is unavailable', () => {
    localStorage.setItem(key, '{bad')
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {})
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new Error('Blocked storage') })
    render(<Harness />)
    expect(warn).toHaveBeenCalledWith('Failed to load effects options:', expect.any(Error))
    expect(warn).toHaveBeenCalledWith('Failed to persist effects options:', expect.any(Error))
    fireEvent.click(screen.getByRole('button', { name: 'Clean' }))
    expect(screen.getByDisplayValue('Hierarchical')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Animate Expansion' })).not.toBeChecked()
  })
})
