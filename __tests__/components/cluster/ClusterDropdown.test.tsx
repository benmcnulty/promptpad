import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import ClusterDropdown from '@/components/cluster/ClusterDropdown'

function makeCluster(): any {
  return {
    id: 'c1',
    depth: 0,
    parentWord: undefined,
    parentClusterId: undefined,
    sourcePrompt: 'seed',
    createdAt: Date.now(),
    words: ['alpha','beta','gamma'],
    position: [0,0,0],
    connections: [],
    isExpanded: false,
  }
}

describe('ClusterDropdown', () => {
  it('renders words and toggles selection', () => {
    const cluster = makeCluster()
    const onExpandWord = jest.fn().mockResolvedValue(undefined)
    render(<ClusterDropdown cluster={cluster} onExpandWord={onExpandWord} isLoading={false} loadingStep="" />)
    expect(screen.getByText(/Root cluster/i)).toBeInTheDocument()
    const alphaBtn = screen.getByText('alpha')
    fireEvent.click(alphaBtn)
    expect(screen.getByText(/Position in cluster/)).toBeInTheDocument()
    // expand via details button
    fireEvent.click(screen.getByText(/Expand alpha/))
    expect(onExpandWord).toHaveBeenCalledWith('alpha','c1')
  })

  it('shows loading state and disables expansion', () => {
    const cluster = makeCluster()
    const onExpandWord = jest.fn()
    render(<ClusterDropdown cluster={cluster} onExpandWord={onExpandWord} isLoading={true} loadingStep="Loading..." />)
    expect(screen.getByText('Loading...')).toBeInTheDocument()
    fireEvent.click(screen.getByText('alpha'))
    expect(onExpandWord).not.toHaveBeenCalled()
  })
})
