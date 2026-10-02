import React from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import NetworkNavigator from '@/components/cluster/NetworkNavigator'
import { useClusterNetwork } from '@/hooks/useClusterNetwork'
import type { ClusterNetwork, WordCluster } from '@/lib/vectorization/cluster-types'

const cluster = (id: string, depth: number, createdAt = depth): WordCluster => ({
  id, depth, createdAt, sourcePrompt: 'Explore gardens', words: ['seed', 'soil'],
  position: [0, 0, 0], connections: [], isExpanded: false,
  ...(depth ? { parentWord: id } : {})
})
function network(clusters: WordCluster[]): ClusterNetwork {
  return { id: 'network-12345678', rootPrompt: 'Explore gardens', clusters: new Map(clusters.map(c => [c.id, c])), navigationHistory: [], activeClusterId: '', createdAt: 1, lastModified: 1 }
}
function statistic(label: string) {
  return screen.getByText(label).parentElement as HTMLElement
}

describe('network navigation', () => {
  beforeEach(() => localStorage.clear())

  it('shows finite zero statistics while the initial network is empty', () => {
    render(<NetworkNavigator network={network([])} activeCluster={null} breadcrumbs={[]} onNavigateToCluster={jest.fn()} onNavigateBack={jest.fn()} />)
    for (const label of ['Clusters', 'Total Words', 'Max Depth', 'Connections']) expect(within(statistic(label)).getByText('0')).toBeInTheDocument()
    expect(screen.queryByText('Navigation Path')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /root cluster/ })).not.toBeInTheDocument()
    expect(screen.getByText('Root: Explore gardens')).toBeInTheDocument()
    expect(screen.getByText('Network ID: 12345678')).toBeInTheDocument()
  })

  it('sorts by depth then creation, highlights the active cluster and navigates by exact identity', () => {
    const root = cluster('root', 0)
    const early = cluster('early', 1, 2)
    const late = cluster('late', 1, 3)
    root.connections = ['early']
    early.connections = ['root']
    const clusters = [cluster('deep', 6), cluster('orange', 3), late, cluster('purple', 2), early, root]
    const navigate = jest.fn()
    render(<NetworkNavigator network={network(clusters)} activeCluster={early} breadcrumbs={[]} onNavigateToCluster={navigate} onNavigateBack={jest.fn()} />)
    const buttons = screen.getAllByRole('button').filter(button => button.textContent?.includes('words'))
    expect(buttons.map(button => button.textContent?.match(/D\d+/)?.[0])).toEqual(['D0', 'D1', 'D1', 'D2', 'D3', 'D6'])
    expect(buttons[1]).toHaveTextContent('early')
    expect(buttons[1]).toHaveClass('bg-blue-50')
    expect(within(statistic('Clusters')).getByText('6')).toBeInTheDocument()
    expect(within(statistic('Total Words')).getByText('12')).toBeInTheDocument()
    expect(within(statistic('Connections')).getByText('1')).toBeInTheDocument()
    fireEvent.click(buttons[2])
    expect(navigate).toHaveBeenLastCalledWith('late')
    fireEvent.click(screen.getByRole('button', { name: /Go to root cluster/ }))
    expect(navigate).toHaveBeenLastCalledWith('root')
  })

  it('does not fabricate a root destination when an imported network contains no root', () => {
    const navigate = jest.fn()
    render(<NetworkNavigator network={network([cluster('one', 1), cluster('two', 2)])} activeCluster={null} breadcrumbs={[]} onNavigateToCluster={navigate} onNavigateBack={jest.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: /Go to root cluster/ }))
    expect(navigate).not.toHaveBeenCalled()
  })

  it('returns to the chosen breadcrumb, leaves the current crumb unchanged and persists reset', () => {
    function Harness() {
      const state = useClusterNetwork()
      return <>
        <button onClick={() => {
          state.createNetwork('Explore gardens')
          for (const item of [cluster('root', 0), cluster('seed', 1), cluster('soil', 2)]) state.addCluster(item)
          state.navigateToCluster('root')
          state.navigateToCluster('seed', 'seed')
          state.navigateToCluster('soil', 'soil')
        }}>Initialize</button>
        <output data-testid="active">{state.activeCluster?.id || 'none'}</output>
        {state.network && <NetworkNavigator network={state.network} activeCluster={state.activeCluster} breadcrumbs={state.breadcrumbs} onNavigateToCluster={state.navigateToCluster} onNavigateBack={state.navigateBack} />}
      </>
    }
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: 'Initialize' }))
    expect(screen.getByTestId('active')).toHaveTextContent('soil')
    fireEvent.click(screen.getByTitle('Navigate to soil'))
    expect(screen.getByTestId('active')).toHaveTextContent('soil')
    fireEvent.click(screen.getByTitle('Navigate to seed'))
    expect(screen.getByTestId('active')).toHaveTextContent('seed')
    expect(screen.queryByTitle('Navigate to soil')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Go back one step/ }))
    expect(screen.getByTestId('active')).toHaveTextContent('root')
    fireEvent.click(screen.getByRole('button', { name: /Reset to beginning/ }))
    expect(screen.getByTestId('active')).toHaveTextContent('none')
    expect(screen.queryByText('Navigation Path')).not.toBeInTheDocument()
    const stored = JSON.parse(localStorage.getItem('ppviz:cluster-network:v1')!)
    expect(stored.navigationHistory).toEqual([])
    expect(stored.activeClusterId).toBe('')
    expect(Object.keys(stored.clusters)).toHaveLength(3)
  })
})
