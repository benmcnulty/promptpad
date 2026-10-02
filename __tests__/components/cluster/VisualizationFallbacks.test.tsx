import React from 'react'
import { act, fireEvent, render, screen } from '@testing-library/react'
import LoadingAnimation from '@/components/cluster/LoadingAnimation'
import ClusterVisualizer3DFallback from '@/components/cluster/ClusterVisualizer3DFallback'
import VisualizationErrorBoundary from '@/components/cluster/VisualizationErrorBoundary'
import type { ClusterVectorFrame, ClusterVisualizationOptions } from '@/lib/vectorization/cluster-types'

const options: ClusterVisualizationOptions = { layout: 'spherical', colorScheme: 'semantic', showConnections: true, animateExpansion: true, particleEffects: true, clusterSpacing: 2, wordSpacing: 0.8 }
const frame: ClusterVectorFrame = {
  clusters: [
    { id: 'root', sourcePrompt: 'garden', words: ['seed', 'soil'], position: [0, 0, 0], connections: [], createdAt: 1, depth: 0, isExpanded: false },
    { id: 'child', parentWord: 'seed', sourcePrompt: 'garden', words: ['grow'], position: [2, 0, 0], connections: ['root'], createdAt: 2, depth: 1, isExpanded: false }
  ], points: [], edges: [], meta: { source: 'word-cluster', networkId: 'test', createdAt: 1 }
}

describe('visualization fallbacks', () => {
  afterEach(() => { jest.restoreAllMocks(); jest.useRealTimers() })

  it('keeps cluster words usable when WebGL is unavailable and allows no click handler', () => {
    const onWordClick = jest.fn()
    const { rerender } = render(<ClusterVisualizer3DFallback frame={{ ...frame, clusters: [] }} options={options} />)
    expect(screen.getByText('Generate your first cluster to begin visualization')).toBeInTheDocument()
    rerender(<ClusterVisualizer3DFallback frame={frame} options={options} activeClusterId="child" onWordClick={onWordClick} />)
    expect(screen.getByText('2D Network Visualization')).toBeInTheDocument()
    expect(screen.getByText('Clusters: 2 | Words: 0')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'grow' }))
    expect(onWordClick).toHaveBeenCalledWith('grow', 'child')
    expect(screen.getByText(/seed Cluster/).parentElement).toHaveClass('border-blue-400')
    rerender(<ClusterVisualizer3DFallback frame={frame} options={options} />)
    fireEvent.click(screen.getByRole('button', { name: 'seed' }))
    expect(onWordClick).toHaveBeenCalledTimes(1)
  })

  it('shows progress phases, animates dots deterministically and releases both timers', () => {
    jest.useFakeTimers()
    const { container, rerender, unmount } = render(<LoadingAnimation step="Working" progress={0} />)
    expect(screen.getByText('Initializing request...')).toBeInTheDocument()
    const bar = container.querySelector('.ease-out') as HTMLElement
    expect(bar.style.width).toBe('5%')
    for (const dots of ['.', '..', '...', '']) {
      act(() => jest.advanceTimersByTime(500))
      expect(screen.getByText(`Working${dots}`)).toBeInTheDocument()
    }
    for (const [progress, phase] of [[25, 'Processing with LLM...'], [50, 'Generating word associations...'], [80, 'Creating cluster structure...'], [95, 'Almost ready!']] as const) {
      rerender(<LoadingAnimation step="Working" progress={progress} className="test-class" />)
      expect(screen.getByText(phase)).toBeInTheDocument()
      expect(screen.getByText(`${progress}% complete`)).toBeInTheDocument()
      expect(bar.style.width).toBe(`${progress}%`)
    }
    expect(screen.getAllByText(/^word\d+$/)).toHaveLength(12)
    expect(container.firstChild).toHaveClass('test-class')
    unmount()
    expect(jest.getTimerCount()).toBe(0)
  })

  it('catches a renderer exception, displays its error and retries a recovered renderer', () => {
    const log = jest.spyOn(console, 'error').mockImplementation(() => {})
    let fail = true
    function Renderer() {
      if (fail) throw new Error('GPU context lost')
      return <div>Recovered scene</div>
    }
    render(<VisualizationErrorBoundary><Renderer /></VisualizationErrorBoundary>)
    expect(screen.getByText('3D Visualization Error')).toBeInTheDocument()
    expect(screen.getByText('GPU context lost')).toBeInTheDocument()
    expect(log).toHaveBeenCalledWith('3D Visualization Error:', expect.any(Error), expect.anything())
    fail = false
    fireEvent.click(screen.getByRole('button', { name: 'Retry 3D Mode' }))
    expect(screen.getByText('Recovered scene')).toBeInTheDocument()
    expect(screen.queryByText('GPU context lost')).not.toBeInTheDocument()
  })

  it('renders an explicit accessible fallback after a renderer exception', () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    function Broken(): React.ReactNode { throw new Error('GPU unavailable') }
    render(<VisualizationErrorBoundary fallback={<div role="alert">Use the word list</div>}><Broken /></VisualizationErrorBoundary>)
    expect(screen.getByRole('alert')).toHaveTextContent('Use the word list')
    expect(screen.queryByRole('button', { name: 'Retry 3D Mode' })).not.toBeInTheDocument()
  })
})
