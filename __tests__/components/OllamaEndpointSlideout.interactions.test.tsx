import React from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import OllamaEndpointSlideout from '@/components/OllamaEndpointSlideout'

const endpoint = (id: string, status: string) => ({
  id, label: id === 'default' ? 'Local' : id, url: `http://${id}.invalid:11434`,
  isDefault: id === 'default', healthStatus: status, lastChecked: 1,
  models: status === 'healthy' ? [{ name: 'gpt-oss:20b' }] : [],
  ...(status === 'error' ? { errorMessage: 'Service offline' } : {})
})
const mockContext = {
  endpoints: [endpoint('default', 'healthy'), endpoint('Remote', 'error'), endpoint('Pending', 'checking'), endpoint('Unreported', 'unknown')],
  loading: false, addEndpoint: jest.fn(), updateEndpoint: jest.fn(), removeEndpoint: jest.fn(), checkEndpointHealth: jest.fn(), checkAllEndpointsHealth: jest.fn()
}
jest.mock('@/components/OllamaEndpointProvider', () => ({ useOllamaEndpoints: () => mockContext }))
const change = (element: HTMLElement, value: string) => fireEvent.change(element, { target: { value } })
describe('endpoint slideout configuration controls', () => {
  beforeEach(() => { for (const fn of [mockContext.addEndpoint, mockContext.updateEndpoint, mockContext.removeEndpoint, mockContext.checkEndpointHealth, mockContext.checkAllEndpointsHealth]) fn.mockReset(); mockContext.loading = false })
  afterEach(() => jest.restoreAllMocks())

  it('displays provider status and models, checks health and protects the default endpoint', () => {
    const close = jest.fn()
    const { rerender } = render(<OllamaEndpointSlideout isOpen={false} onClose={close} />)
    expect(screen.queryByText('Ollama Endpoints')).not.toBeInTheDocument()
    rerender(<OllamaEndpointSlideout isOpen onClose={close} />)
    for (const status of ['Connected', 'Error', 'Checking...', 'Unknown', 'Service offline']) expect(screen.getByText(status, { exact: true })).toBeInTheDocument()
    expect(screen.getByText('gpt-oss:20b')).toBeInTheDocument()
    expect(screen.getAllByTitle('Remove endpoint')).toHaveLength(3)
    fireEvent.click(screen.getByRole('button', { name: 'Refresh All' }))
    expect(mockContext.checkAllEndpointsHealth).toHaveBeenCalledTimes(1)
    fireEvent.click(screen.getAllByTitle('Check health')[1])
    expect(mockContext.checkEndpointHealth).toHaveBeenCalledWith('Remote')
    fireEvent.click(screen.getAllByTitle('Edit endpoint')[0])
    expect(screen.getByPlaceholderText('Endpoint label')).toBeDisabled()
    expect(screen.getByPlaceholderText('http://localhost:11434')).toBeDisabled()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    fireEvent.click(screen.getAllByTitle('Remove endpoint')[0])
    expect(mockContext.removeEndpoint).toHaveBeenCalledWith('Remote')
    mockContext.loading = true
    rerender(<OllamaEndpointSlideout isOpen onClose={close} />)
    expect(screen.getByRole('button', { name: 'Refresh All' })).toBeDisabled()
  })

  it('validates and trims additions, retains rejected edits and permits a successful retry', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {})
    mockContext.addEndpoint.mockRejectedValueOnce(new Error('URL not allowed')).mockResolvedValueOnce(endpoint('New', 'healthy'))
    render(<OllamaEndpointSlideout isOpen onClose={jest.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Add New Endpoint' }))
    expect(screen.getByRole('button', { name: 'Add Endpoint' })).toBeDisabled()
    change(screen.getByPlaceholderText('e.g., Remote Server'), '   ')
    change(screen.getByPlaceholderText('http://192.168.1.100:11434'), 'http://new.invalid:11434')
    expect(screen.getByRole('button', { name: 'Add Endpoint' })).toBeDisabled()
    change(screen.getByPlaceholderText('e.g., Remote Server'), '  New  ')
    fireEvent.click(screen.getByRole('button', { name: 'Add Endpoint' }))
    await waitFor(() => expect(error).toHaveBeenCalledWith('Failed to add endpoint:', expect.any(Error)))
    expect(screen.getByPlaceholderText('e.g., Remote Server')).toHaveValue('  New  ')
    fireEvent.click(screen.getByRole('button', { name: 'Add Endpoint' }))
    await waitFor(() => expect(screen.queryByPlaceholderText('e.g., Remote Server')).not.toBeInTheDocument())
    expect(mockContext.addEndpoint).toHaveBeenLastCalledWith('New', 'http://new.invalid:11434')
    fireEvent.click(screen.getByRole('button', { name: 'Add New Endpoint' }))
    change(screen.getByPlaceholderText('e.g., Remote Server'), 'Discard')
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    fireEvent.click(screen.getByRole('button', { name: 'Add New Endpoint' }))
    expect(screen.getByPlaceholderText('e.g., Remote Server')).toHaveValue('')
  })

  it('validates edits, saves trimmed values and rechecks that exact endpoint', () => {
    render(<OllamaEndpointSlideout isOpen onClose={jest.fn()} />)
    fireEvent.click(screen.getAllByTitle('Edit endpoint')[1])
    change(screen.getByPlaceholderText('Endpoint label'), '   ')
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled()
    change(screen.getByPlaceholderText('Endpoint label'), '  Revised  ')
    change(screen.getByPlaceholderText('http://localhost:11434'), 'http://revised.invalid:11434')
    fireEvent.click(screen.getByRole('button', { name: 'Save' }))
    expect(mockContext.updateEndpoint).toHaveBeenCalledWith('Remote', { label: 'Revised', url: 'http://revised.invalid:11434' })
    expect(mockContext.checkEndpointHealth).toHaveBeenCalledWith('Remote')
    expect(screen.queryByPlaceholderText('Endpoint label')).not.toBeInTheDocument()
  })

  it('cancels nested forms with Escape before closing, handles outside clicks and cleans listeners', () => {
    const close = jest.fn()
    const { unmount } = render(<OllamaEndpointSlideout isOpen onClose={close} />)
    fireEvent.click(screen.getAllByTitle('Edit endpoint')[1])
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByPlaceholderText('Endpoint label')).not.toBeInTheDocument()
    expect(close).not.toHaveBeenCalled()
    fireEvent.click(screen.getByRole('button', { name: 'Add New Endpoint' }))
    change(screen.getByPlaceholderText('e.g., Remote Server'), 'Discard')
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByPlaceholderText('e.g., Remote Server')).not.toBeInTheDocument()
    expect(close).not.toHaveBeenCalled()
    fireEvent.keyDown(document, { key: 'x' })
    expect(close).not.toHaveBeenCalled()
    fireEvent.mouseDown(screen.getByText('Ollama Endpoints'))
    expect(close).not.toHaveBeenCalled()
    fireEvent.keyDown(document, { key: 'Escape' })
    fireEvent.mouseDown(document.body)
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(close).toHaveBeenCalledTimes(3)
    unmount()
    fireEvent.keyDown(document, { key: 'Escape' })
    fireEvent.mouseDown(document.body)
    expect(close).toHaveBeenCalledTimes(3)
  })
})
