import React from 'react'
import { act, fireEvent, render, screen, cleanup } from '@testing-library/react'
import { OllamaEndpointProvider, useOllamaEndpoints } from '@/components/OllamaEndpointProvider'
import { ModelProvider, useModel } from '@/components/ModelProvider'
import { ThemeProvider } from '@/components/ThemeProvider'
import StatusBar from '@/components/StatusBar'
import { useRefine } from '@/hooks/useRefine'

const remoteUrl = 'http://ollama-lan:11434'
const modelName = 'shared:7b'
const endpoint = (id: string, url: string) => ({
  id, url, label: id, isDefault: id === 'default', healthStatus: 'checking', lastChecked: 0, models: [],
})

function Controls() {
  const model = useModel()
  const endpoints = useOllamaEndpoints()
  const refine = useRefine(model.selectedModel, 0.2, model.selectedEndpointUrl)
  return <>
    <output data-testid="selection">{model.selectedModel}|{model.selectedEndpointId}|{model.selectedEndpointUrl === null ? 'removed' : model.selectedEndpointUrl ?? 'server'}</output>
    <output data-testid="health">{endpoints.endpoints.map(ep => `${ep.id}:${ep.healthStatus}`).join(',')}</output>
    <output data-testid="refine-error">{refine.state.error}</output>
    <button onClick={() => model.setSelectedModel(modelName, 'remote')}>Choose LAN</button>
    <button onClick={() => model.setSelectedModel(modelName, 'default')}>Choose default</button>
    <button onClick={() => endpoints.removeEndpoint('remote')}>Remove LAN</button>
    <button onClick={() => { void endpoints.addEndpoint('Added', 'http://added:11434') }}>Add endpoint</button>
    <button onClick={() => { void refine.run('refine', 'Test prompt') }}>Refine</button>
  </>
}

function mount(status = false) {
  return render(<ThemeProvider><OllamaEndpointProvider><ModelProvider>
    <Controls />{status && <StatusBar />}
  </ModelProvider></OllamaEndpointProvider></ThemeProvider>)
}

const reply = (value: unknown, ok = true, status = ok ? 200 : 400) => ({ ok, status, json: async () => value })
async function tick(ms = 0) {
  await act(async () => { await jest.advanceTimersByTimeAsync(ms) })
}

describe('real endpoint and model providers', () => {
  const previousFetch = global.fetch
  let fetchMock: jest.Mock
  let rejectRemote: boolean
  beforeEach(() => {
    jest.useFakeTimers()
    localStorage.clear()
    localStorage.setItem('promptpad-ollama-endpoints', JSON.stringify([
      endpoint('default', 'http://localhost:11434'), endpoint('remote', remoteUrl),
    ]))
    rejectRemote = false
    fetchMock = jest.fn(async (url: string, options?: RequestInit) => {
      if (url === '/api/git-info') return reply({ sha: 'abc1234' })
      if (url === '/api/models') {
        const headers = options?.headers as Record<string, string> | undefined
        return rejectRemote && headers?.['X-Ollama-Endpoint'] === remoteUrl
          ? reply({ error: 'Endpoint is not allowed' }, false)
          : reply([{ name: modelName }])
      }
      if (url.endsWith('/api/version')) return reply({ version: 'test' })
      if (url.endsWith('/api/tags')) return reply({ models: [{ name: modelName }] })
      if (url === '/api/refine') return reply({ output: 'Refined', usage: { input_tokens: 1, output_tokens: 1 } })
      throw new Error(`Unexpected test request: ${url}`)
    })
    global.fetch = fetchMock
  })
  afterEach(() => { cleanup(); jest.useRealTimers(); global.fetch = previousFetch })

  it('does not restart catalog requests or the initial timer when health metadata changes', async () => {
    mount()
    await tick(100)
    expect(screen.getByTestId('health')).toHaveTextContent('default:healthy,remote:healthy')
    expect(JSON.parse(localStorage.getItem('promptpad-ollama-endpoints')!).map((ep: { healthStatus: string }) => ep.healthStatus))
      .toEqual(['healthy', 'healthy'])
    const catalog = () => fetchMock.mock.calls.filter(([url]) => url === '/api/models')
    const health = () => fetchMock.mock.calls.filter(([url]) => url.endsWith('/api/version'))
    expect(catalog()).toHaveLength(2)
    expect(health()).toHaveLength(2)
    await tick(2000)
    expect(catalog()).toHaveLength(2)
    expect(health()).toHaveLength(2)
    expect(catalog().every(([, options]) => !options.signal.aborted)).toBe(true)
    await tick(27900)
    expect(health()).toHaveLength(4)
    expect(catalog()).toHaveLength(2)
    await tick(1000)
    expect(health()).toHaveLength(4)
  })

  it('checks the newly added endpoint rather than a stale pre-add closure', async () => {
    mount()
    await tick(100)
    fireEvent.click(screen.getByRole('button', { name: 'Add endpoint' }))
    await tick()
    expect(fetchMock).toHaveBeenCalledWith('http://added:11434/api/version', expect.any(Object))
    expect(fetchMock).toHaveBeenCalledWith('http://added:11434/api/tags', expect.any(Object))
    expect(screen.getByTestId('health').textContent?.split(',')).toHaveLength(3)
    expect(screen.getByTestId('health').textContent).not.toContain('checking')
  })

  it('keeps a removed selected endpoint invalid through catalog completion and blocks generation', async () => {
    mount()
    await tick(100)
    fireEvent.click(screen.getByRole('button', { name: 'Choose LAN' }))
    fireEvent.click(screen.getByRole('button', { name: 'Refine' }))
    await tick()
    expect(fetchMock).toHaveBeenCalledWith('/api/refine', expect.objectContaining({
      headers: expect.objectContaining({ 'X-Ollama-Endpoint': remoteUrl }),
    }))
    fireEvent.click(screen.getByRole('button', { name: 'Remove LAN' }))
    await tick()
    expect(screen.getByTestId('selection')).toHaveTextContent(`${modelName}|remote|removed`)
    const generationCount = fetchMock.mock.calls.filter(([url]) => url === '/api/refine').length
    fireEvent.click(screen.getByRole('button', { name: 'Refine' }))
    await tick()
    expect(screen.getByTestId('refine-error')).toHaveTextContent('Selected Ollama endpoint no longer exists')
    expect(fetchMock.mock.calls.filter(([url]) => url === '/api/refine')).toHaveLength(generationCount)
    fireEvent.click(screen.getByRole('button', { name: 'Choose default' }))
    fireEvent.click(screen.getByRole('button', { name: 'Refine' }))
    await tick()
    expect(screen.getByTestId('selection')).toHaveTextContent(`${modelName}|default|server`)
    expect(fetchMock.mock.calls.filter(([url]) => url === '/api/refine').slice(-1)[0]?.[1].headers)
      .toEqual({ 'Content-Type': 'application/json' })
  })

  it('reports an unapproved selected endpoint as an error even while default and browser health succeed', async () => {
    rejectRemote = true
    mount(true)
    await tick(100)
    expect(screen.getByLabelText('Ollama status: connected')).toBeInTheDocument()
    expect(screen.getByTestId('health')).toHaveTextContent('remote:healthy')
    fireEvent.click(screen.getByRole('button', { name: 'Choose LAN' }))
    await tick()
    expect(screen.getByLabelText('Ollama status: error')).toBeInTheDocument()
    expect(fetchMock.mock.calls.filter(([url]) => url === '/api/models').slice(-1)[0]?.[1].headers)
      .toEqual({ 'Content-Type': 'application/json', 'X-Ollama-Endpoint': remoteUrl })
    fireEvent.click(screen.getByRole('button', { name: 'Remove LAN' }))
    await tick()
    expect(screen.getByLabelText('Ollama status: error')).toBeInTheDocument()
    expect(screen.getByTestId('selection')).toHaveTextContent(`${modelName}|remote|removed`)
  })

  it('ignores a late status response after the user selects another endpoint', async () => {
    mount(true)
    await tick(100)
    let resolveRemote!: (value: ReturnType<typeof reply>) => void
    const originalImplementation = fetchMock.getMockImplementation()!
    fetchMock.mockImplementation((url, options) => {
      if (url === '/api/models' && options?.headers?.['X-Ollama-Endpoint'] === remoteUrl) {
        return new Promise(resolve => { resolveRemote = resolve })
      }
      return originalImplementation(url, options)
    })
    fireEvent.click(screen.getByRole('button', { name: 'Choose LAN' }))
    await tick()
    const remoteSignal = fetchMock.mock.calls.filter(([url]) => url === '/api/models').slice(-1)[0]?.[1].signal
    fireEvent.click(screen.getByRole('button', { name: 'Choose default' }))
    await tick()
    expect(remoteSignal.aborted).toBe(true)
    expect(screen.getByLabelText('Ollama status: connected')).toBeInTheDocument()
    await act(async () => { resolveRemote(reply({}, false)) })
    expect(screen.getByLabelText('Ollama status: connected')).toBeInTheDocument()
  })
})
