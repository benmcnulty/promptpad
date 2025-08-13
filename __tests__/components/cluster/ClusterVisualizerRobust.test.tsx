import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import ClusterVisualizerRobust from '@/components/cluster/ClusterVisualizerRobust'

const baseOptions = { layout: 'spherical', colorScheme: 'semantic', showConnections: true, animateExpansion: false, particleEffects: false, clusterSpacing: 2, wordSpacing: 1 }

function makeFrame() {
  return {
    clusters: [
      { id: 'c1', parentWord: undefined, parentClusterId: undefined, sourcePrompt: 'root', words: ['alpha','beta'], position: [0,0,0], connections: [], createdAt: Date.now(), depth: 0, isExpanded: false },
      { id: 'c2', parentWord: 'alpha', parentClusterId: 'c1', sourcePrompt: 'root', words: ['delta'], position: [1,0,0], connections: ['c1'], createdAt: Date.now(), depth: 1, isExpanded: false }
    ],
    points: [
      { id: '0', token: 'alpha', position: [0,0,0], magnitude: 0.5 },
      { id: '1', token: 'beta', position: [0.5,0,0], magnitude: 0.3 }
    ],
    edges: [{ from: '0', to: '1', weight: 1 }],
    meta: { source: 'word-cluster', networkId: 'n1', createdAt: Date.now() }
  }
}

describe('ClusterVisualizerRobust', () => {
  it('renders empty state when no frame', () => {
    render(<ClusterVisualizerRobust frame={null} options={baseOptions as any} />)
    expect(screen.getByText(/Generate your first cluster/i)).toBeInTheDocument()
  })
  it('renders frame clusters and handles word clicks', () => {
    const onWordClick = jest.fn()
    render(<ClusterVisualizerRobust frame={makeFrame() as any} options={baseOptions as any} onWordClick={onWordClick} />)
    fireEvent.click(screen.getByText('alpha'))
    expect(onWordClick).toHaveBeenCalledWith('alpha','c1')
  })
  it('shows loading state', () => {
    render(<ClusterVisualizerRobust frame={null} options={baseOptions as any} isLoading loadingStep="Loading clusters" loadingProgress={40} />)
    expect(screen.getByText('Loading clusters')).toBeInTheDocument()
  })
})
