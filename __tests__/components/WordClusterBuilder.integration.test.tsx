import React from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import WordClusterBuilder from '@/components/WordClusterBuilder'

// Exercise the real generation/network hooks and the real fallback/navigation
// UI. Mock only the selected-model context, lazy loading boundary and fetch.
jest.mock('@/components/ModelProvider', () => ({
  useModel: () => ({ selectedModel: 'gpt-oss:20b', selectedEndpointUrl: 'http://selected.invalid:11434' })
}))
jest.mock('next/dynamic', () => {
  const React = jest.requireActual('react')
  return (load: () => Promise<any>, options: any) => function LazyBoundary(props: any) {
    const [Component, setComponent] = React.useState(null)
    React.useEffect(() => {
      let mounted = true
      load().then(module => { if (mounted) setComponent(() => module.default) })
      return () => { mounted = false }
    }, [])
    return Component ? React.createElement(Component, props) : options?.loading ? React.createElement(options.loading) : null
  }
})

const words = ['seed', 'soil', 'water', 'sun', 'roots', 'leaves', 'flowers', 'shade', 'bees', 'compost', 'mulch', 'harvest']
const response = (clusterId: string, list = words) => ({ ok: true, json: async () => ({ clusterId, words: list, usage: { input_tokens: 4, output_tokens: 8 } }) })
const advance = (ms = 1800) => act(async () => { await jest.advanceTimersByTimeAsync(ms) })
function submit() {
  fireEvent.change(screen.getByLabelText('Enter a concept or topic to explore'), { target: { value: 'Explore gardens' } })
  fireEvent.click(screen.getByRole('button', { name: 'Generate Word Cluster' }))
}
describe('word network public flows', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.useFakeTimers()
    ;(global.fetch as jest.Mock).mockReset()
    jest.spyOn(console, 'log').mockImplementation(() => {})
  })
  afterEach(() => { jest.restoreAllMocks(); jest.useRealTimers() })

  it('generates, persists, expands from the visual word list and restores the network on remount', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce(response('root')).mockResolvedValueOnce(response('expanded', words.map(word => `${word}ed`)))
    const first = render(<WordClusterBuilder />)
    expect(screen.getByRole('button', { name: 'Generate Word Cluster' })).toBeDisabled()
    submit()
    await advance()
    await waitFor(() => expect(screen.getByText('Interactive Cluster Network')).toBeInTheDocument())
    expect(screen.getByRole('heading', { name: 'Root cluster' })).toBeInTheDocument()
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0]
    expect(url).toBe('/api/word-cluster')
    expect(init.headers).toMatchObject({ 'X-Ollama-Endpoint': 'http://selected.invalid:11434' })
    expect(JSON.parse(init.body)).toEqual({ prompt: 'Explore gardens', model: 'gpt-oss:20b', temperature: 0.2 })
    // This click is the visualizer button, not the separate dropdown Add control.
    fireEvent.click(screen.getByTitle('Click to expand "seed"'))
    await advance(1100)
    expect(global.fetch).toHaveBeenCalledTimes(2)
    const [expandUrl, expandInit] = (global.fetch as jest.Mock).mock.calls[1]
    expect(expandUrl).toBe('/api/expand-cluster')
    expect(JSON.parse(expandInit.body)).toEqual({ word: 'seed', parentClusterId: 'root', originalPrompt: 'Explore gardens', model: 'gpt-oss:20b', temperature: 0.2 })
    expect(screen.getByRole('heading', { name: 'seed cluster' })).toBeInTheDocument()
    const stored = JSON.parse(localStorage.getItem('ppviz:cluster-network:v1')!)
    expect(Object.keys(stored.clusters)).toEqual(['root', 'expanded'])
    expect(stored.activeClusterId).toBe('expanded')
    expect(stored.clusters.expanded).toMatchObject({ parentWord: 'seed', parentClusterId: 'root', depth: 1, connections: ['root'] })
    first.unmount()
    render(<WordClusterBuilder />)
    await waitFor(() => expect(screen.getByRole('heading', { name: 'seed cluster' })).toBeInTheDocument())
    expect(global.fetch).toHaveBeenCalledTimes(2)
    fireEvent.click(screen.getByRole('button', { name: 'Clear Network' }))
    expect(screen.getByRole('button', { name: 'Generate Word Cluster' })).toBeInTheDocument()
    expect(localStorage.getItem('ppviz:cluster-network:v1')).toBeNull()
  })

  it('shows provider failure, allows clearing and retries successfully', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false, status: 503 }).mockResolvedValueOnce(response('retry'))
    render(<WordClusterBuilder />)
    submit()
    await advance(250)
    expect(screen.getByText('Generation Error')).toBeInTheDocument()
    expect(screen.getByText('Generation failed (503)')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Clear Network' }))
    submit()
    await advance()
    expect(screen.getByRole('heading', { name: 'Root cluster' })).toBeInTheDocument()
    expect(screen.queryByText('Generation Error')).not.toBeInTheDocument()
    expect(global.fetch).toHaveBeenCalledTimes(2)
  })

  it('does not resurrect a network cleared while a generation request is pending', async () => {
    let finish!: (value: unknown) => void
    ;(global.fetch as jest.Mock).mockImplementationOnce(() => new Promise(resolve => { finish = resolve }))
    render(<WordClusterBuilder />)
    submit()
    await advance(200)
    expect(global.fetch).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getByRole('button', { name: 'Clear Network' }))
    await act(async () => finish(response('deleted')))
    await advance()
    expect(localStorage.getItem('ppviz:cluster-network:v1')).toBeNull()
    expect(screen.queryByRole('heading', { name: 'Root cluster' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Generate Word Cluster' })).toBeEnabled()
    ;(global.fetch as jest.Mock).mockResolvedValueOnce(response('new'))
    submit()
    await advance()
    expect(JSON.parse(localStorage.getItem('ppviz:cluster-network:v1')!).clusters).toHaveProperty('new')
    expect(JSON.parse(localStorage.getItem('ppviz:cluster-network:v1')!).clusters).not.toHaveProperty('deleted')
  })

  it('keeps the root usable after a failed expansion and permits another expansion', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce(response('root')).mockResolvedValueOnce({ ok: false, status: 500 }).mockResolvedValueOnce(response('expanded'))
    render(<WordClusterBuilder />)
    submit()
    await advance()
    await waitFor(() => expect(screen.getByTitle('Click to expand "seed"')).toBeInTheDocument())
    fireEvent.click(screen.getByTitle('Expand seed into a new cluster'))
    await advance(1)
    expect(screen.getByText('Expansion failed (500)')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Root cluster' })).toBeInTheDocument()
    fireEvent.click(screen.getByTitle('Expand seed into a new cluster'))
    await advance(1100)
    expect(screen.getByRole('heading', { name: 'seed cluster' })).toBeInTheDocument()
    expect(screen.queryByText('Generation Error')).not.toBeInTheDocument()
    expect(global.fetch).toHaveBeenCalledTimes(3)
  })
})
