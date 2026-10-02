import React from 'react'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ModelProvider, useModel } from '@/components/ModelProvider'

const mockEndpoints = [
  { id: 'default', label: 'Browser localhost', url: 'http://localhost:11434', models: [{ name: 'browser-only:7b' }] },
  { id: 'remote', label: 'LAN', url: 'http://ollama-lan:11434', models: [{ name: 'stale-browser-model:7b' }] },
]
jest.mock('@/components/OllamaEndpointProvider', () => ({
  useOllamaEndpoints: () => ({ endpoints: mockEndpoints }),
}))

function Selection() {
  const model = useModel()
  return <>
    <output data-testid="selection">{model.selectedModel}|{model.selectedEndpointId}|{model.selectedEndpointUrl ?? 'server'}</output>
    <output data-testid="catalog">{model.models.map(entry => `${entry.name}|${entry.endpointId}`).join(',')}</output>
    <button onClick={() => model.setSelectedModel('shared:7b', 'remote')}>Choose LAN model</button>
  </>
}

describe('model catalog and endpoint consistency', () => {
  const previousFetch = global.fetch
  beforeEach(() => { localStorage.clear() })
  afterAll(() => { global.fetch = previousFetch })
  function catalog(defaultModels: string[], remoteModels: string[]) {
    global.fetch = jest.fn().mockImplementation((_url, options) => Promise.resolve({
      ok: true,
      json: async () => (options.headers['X-Ollama-Endpoint'] ? remoteModels : defaultModels).map(name => ({ name })),
    }))
    render(<ModelProvider><Selection /></ModelProvider>)
  }

  it('uses the server catalog and selects an installed model when the default is absent', async () => {
    catalog(['server-model:7b'], [])
    await waitFor(() => expect(screen.getByTestId('selection')).toHaveTextContent('server-model:7b|default|server'))
    expect(screen.getByTestId('catalog')).not.toHaveTextContent('browser-only')
  })

  it('keeps identical model names associated with the selected endpoint', async () => {
    catalog(['shared:7b'], ['shared:7b'])
    await waitFor(() => expect(screen.getByTestId('catalog')).toHaveTextContent('shared:7b|remote'))
    act(() => { fireEvent.click(screen.getByRole('button', { name: 'Choose LAN model' })) })
    await waitFor(() => expect(screen.getByTestId('selection')).toHaveTextContent('shared:7b|remote|http://ollama-lan:11434'))
    expect(global.fetch).toHaveBeenCalledWith('/api/models', expect.objectContaining({ headers: { 'X-Ollama-Endpoint': 'http://ollama-lan:11434' } }))
  })

  it('preserves an unavailable saved pair until the user deliberately chooses a replacement', async () => {
    localStorage.setItem('promptpad-model', 'shared:7b')
    localStorage.setItem('promptpad-endpoint', 'remote')
    catalog(['shared:7b'], ['other:7b'])
    await waitFor(() => expect(screen.getByTestId('catalog')).toHaveTextContent('other:7b|remote'))
    expect(screen.getByTestId('selection')).toHaveTextContent('shared:7b|remote|http://ollama-lan:11434')
  })
})
