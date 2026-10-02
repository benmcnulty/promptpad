import React from 'react'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import AgentEditorPage from '@/app/agent-editor/page'
import { AgentWorkflow } from '@/types/agent'

// Keep editor, builder, callpoints, executor and persistence real. Only the
// provider/model boundary is replaced; no inference requests leave Jest.
const mockGenerate = jest.fn()
jest.mock('@/components/ModelProvider', () => ({
  useModel: () => ({ getAllAvailableModels: () => [
    { name: 'gpt-oss:20b', endpointId: 'default', endpointLabel: 'Local' },
    { name: 'llama3.1:8b', endpointId: 'remote', endpointLabel: 'Remote' }
  ] })
}))
jest.mock('@/components/OllamaEndpointProvider', () => ({
  useOllamaEndpoints: () => ({
    endpoints: [{ id: 'default', label: 'Local' }, { id: 'remote', label: 'Remote' }],
    getHealthyEndpoints: () => [], getEndpointClient: () => ({ generate: mockGenerate })
  })
}))
const key = 'promptpad-agent-workflows'
const names = () => screen.getAllByPlaceholderText('Agent name')
const agent = (i: number) => within(names()[i].closest('.shadow-soft') as HTMLElement)
const saved = (): AgentWorkflow[] => JSON.parse(localStorage.getItem(key) || '[]')
const change = (element: HTMLElement, value: string) => fireEvent.change(element, { target: { value } })
function add(count: number) {
  for (let i = 0; i < count; i++) fireEvent.click(screen.getByRole('button', { name: 'Add Agent' }))
}
function configure(i: number, label: string) {
  change(names()[i], label)
  change(agent(i).getByPlaceholderText('Define the role and behavior for this agent...'), `Instructions for ${label}`)
}
const prompt = () => agent(0).getByPlaceholderText('Enter the initial prompt for this workflow...')

describe('agent editor workflow regressions', () => {
  beforeEach(() => {
    localStorage.clear()
    mockGenerate.mockReset().mockResolvedValue({ text: 'Fresh output', usage: { input_tokens: 3, output_tokens: 5 } })
  })
  afterEach(() => jest.restoreAllMocks())

  it('validates incomplete agents and closes an empty load dialog', () => {
    render(<AgentEditorPage />)
    expect(screen.getByRole('heading', { name: 'Agent Editor' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Run Workflow' })).toBeDisabled()
    fireEvent.click(screen.getByTitle('Load workflow'))
    expect(screen.getByText('No saved workflows found')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.queryByText('Load Workflow')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Add First Agent' }))
    expect(screen.getByText('1 agent')).toBeInTheDocument()
    expect(screen.getByText(/missing system instructions/)).toBeInTheDocument()
    expect(screen.getByText(/User input agents need a custom prompt/)).toBeInTheDocument()
    configure(0, 'Research')
    change(prompt(), '   ')
    expect(screen.getByRole('button', { name: 'Run Workflow' })).toBeDisabled()
    change(prompt(), 'Summarize findings')
    expect(screen.getByRole('button', { name: 'Run Workflow' })).toBeEnabled()
    expect(mockGenerate).not.toHaveBeenCalled()
  })

  it('preserves tagged models and zero temperature when toggling persisted collapse state', () => {
    render(<AgentEditorPage />)
    add(1)
    change(agent(0).getAllByRole('combobox')[0], 'remote:llama3.1:8b')
    change(agent(0).getByRole('spinbutton'), '0')
    fireEvent.click(agent(0).getByTitle('Collapse'))
    fireEvent.click(screen.getByTitle('Save workflow'))
    expect(saved()[0].callpoints[0]).toMatchObject({ endpointId: 'remote', modelName: 'llama3.1:8b', temperature: 0, isCollapsed: true })
    expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument()
    fireEvent.click(agent(0).getByTitle('Expand'))
    expect(agent(0).getByRole('spinbutton')).toHaveValue(0)
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument()
    change(agent(0).getAllByRole('combobox')[0], '')
    expect(screen.getByText(/missing endpoint\/model configuration/)).toBeInTheDocument()
  })

  it('restores saved collapse state on same-mounted reload without overwriting it or marking it dirty', () => {
    render(<AgentEditorPage />)
    add(1)
    configure(0, 'Saved agent')
    const nameInput = names()[0]
    fireEvent.click(agent(0).getByTitle('Collapse'))
    fireEvent.click(screen.getByTitle('Save workflow'))
    const savedId = saved()[0].id
    expect(saved()[0].callpoints[0].isCollapsed).toBe(true)
    expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument()

    fireEvent.click(agent(0).getByTitle('Expand'))
    change(agent(0).getByPlaceholderText('Define the role and behavior for this agent...'), 'Unsaved instructions')
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument()
    for (let reload = 0; reload < 2; reload++) {
      fireEvent.click(screen.getByTitle('Load workflow'))
      fireEvent.click(screen.getByRole('button', { name: 'Load' }))
      expect(names()[0]).toBe(nameInput)
      expect(agent(0).getByTitle('Expand')).toBeInTheDocument()
      expect(agent(0).queryByPlaceholderText('Define the role and behavior for this agent...')).not.toBeInTheDocument()
      expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument()
      expect(saved()[0]).toMatchObject({ id: savedId, callpoints: [expect.objectContaining({ isCollapsed: true, systemInstructions: 'Instructions for Saved agent' })] })
    }

    fireEvent.click(agent(0).getByTitle('Expand'))
    expect(agent(0).getByPlaceholderText('Define the role and behavior for this agent...')).toHaveValue('Instructions for Saved agent')
    fireEvent.click(screen.getByTitle('Save workflow'))
    expect(saved()[0].callpoints[0].isCollapsed).toBe(false)
    fireEvent.click(agent(0).getByTitle('Collapse'))
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument()
    fireEvent.click(screen.getByTitle('Load workflow'))
    fireEvent.click(screen.getByRole('button', { name: 'Load' }))
    expect(names()[0]).toBe(nameInput)
    expect(agent(0).getByTitle('Collapse')).toBeInTheDocument()
    expect(agent(0).getByPlaceholderText('Define the role and behavior for this agent...')).toHaveValue('Instructions for Saved agent')
    expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument()
  })

  it('chains new agents, reorders their data and rewires deleted input sources', () => {
    render(<AgentEditorPage />)
    add(3)
    ;['First', 'Second', 'Third'].forEach((label, i) => configure(i, label))
    expect(agent(1).getAllByRole('combobox')[1]).toHaveDisplayValue('Output from: First')
    expect(agent(2).getAllByRole('combobox')[1]).toHaveDisplayValue('Output from: Second')
    fireEvent.click(agent(2).getByTitle('Move up'))
    expect(names().map(input => (input as HTMLInputElement).value)).toEqual(['First', 'Third', 'Second'])
    fireEvent.click(agent(1).getByTitle('Move down'))
    expect(names().map(input => (input as HTMLInputElement).value)).toEqual(['First', 'Second', 'Third'])
    fireEvent.click(agent(1).getByTitle('Remove agent'))
    expect(agent(1).getAllByRole('combobox')[1]).toHaveDisplayValue('Output from: First')
    fireEvent.click(agent(0).getByTitle('Remove agent'))
    expect(agent(0).getAllByRole('combobox')[1]).toHaveDisplayValue('User Input')
    expect(prompt()).toBeInTheDocument()
    fireEvent.click(agent(0).getByTitle('Remove agent'))
    expect(screen.getByText('No agents in workflow')).toBeInTheDocument()
  })

  it('saves, overwrites, reloads and deletes persisted workflows', () => {
    const first = render(<AgentEditorPage />)
    add(1)
    configure(0, 'Research')
    change(screen.getByPlaceholderText('Workflow name'), 'Research workflow')
    change(screen.getByPlaceholderText('Workflow description (optional)'), 'A saved chain')
    fireEvent.click(screen.getByTitle('Save workflow'))
    const id = saved()[0].id
    expect(saved()[0]).toMatchObject({ name: 'Research workflow', description: 'A saved chain' })
    change(screen.getByPlaceholderText('Workflow name'), 'Revised workflow')
    fireEvent.click(screen.getByTitle('Save workflow'))
    expect(saved()).toHaveLength(1)
    expect(saved()[0].id).toBe(id)
    first.unmount()
    render(<AgentEditorPage />)
    fireEvent.click(screen.getByTitle('Load workflow'))
    expect(screen.getByText('Revised workflow')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))
    fireEvent.click(screen.getByTitle('Load workflow'))
    fireEvent.click(screen.getByRole('button', { name: 'Load' }))
    expect(screen.getByPlaceholderText('Workflow name')).toHaveValue('Revised workflow')
    expect(names()[0]).toHaveValue('Research')
    expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument()
    fireEvent.click(screen.getByTitle('New workflow'))
    expect(screen.getByText('No agents in workflow')).toBeInTheDocument()
    fireEvent.click(screen.getByTitle('Load workflow'))
    fireEvent.click(screen.getByRole('button', { name: 'Delete' }))
    expect(saved()).toEqual([])
    expect(screen.getByText('No saved workflows found')).toBeInTheDocument()
  })

  it('retains unsaved edits on quota failure and allows a successful retry', () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {})
    render(<AgentEditorPage />)
    add(1)
    const write = jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => { throw new DOMException('Full', 'QuotaExceededError') })
    fireEvent.click(screen.getByTitle('Save workflow'))
    expect(localStorage.getItem(key)).toBeNull()
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument()
    expect(error).toHaveBeenCalledWith('Failed to save workflow:', expect.any(DOMException))
    write.mockRestore()
    fireEvent.click(screen.getByTitle('Save workflow'))
    expect(saved()).toHaveLength(1)
    expect(screen.queryByText('Unsaved changes')).not.toBeInTheDocument()
  })

  it('ignores malformed stored JSON and starts a usable editor', () => {
    localStorage.setItem(key, '{bad json')
    const warning = jest.spyOn(console, 'warn').mockImplementation(() => {})
    render(<AgentEditorPage />)
    expect(screen.getByText('No agents in workflow')).toBeInTheDocument()
    expect(warning).toHaveBeenCalledWith('Failed to load workflows from localStorage:', expect.any(Error))
    add(1)
    expect(names()).toHaveLength(1)
  })

  it('imports with new identity, rejects invalid files and allows selecting a file again', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => {})
    const { container } = render(<AgentEditorPage />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    for (const content of ['{', JSON.stringify({ name: 'Missing identity', callpoints: [] })]) {
      fireEvent.change(input, { target: { files: [new File([content], 'broken.json')] } })
      await waitFor(() => expect(error).toHaveBeenCalled())
      expect(screen.getByPlaceholderText('Workflow name')).toHaveValue('New Workflow')
      error.mockClear()
    }
    const file = new File([JSON.stringify({ id: 'original', name: 'Portable', callpoints: [], createdAt: 1, updatedAt: 2 })], 'workflow.json')
    fireEvent.change(input, { target: { files: [file] } })
    await waitFor(() => expect(screen.getByPlaceholderText('Workflow name')).toHaveValue('Portable (Imported)'))
    expect(input.value).toBe('')
    expect(screen.getByText('Unsaved changes')).toBeInTheDocument()
    fireEvent.click(screen.getByTitle('Save workflow'))
    expect(saved()[0].id).not.toBe('original')
    fireEvent.change(input, { target: { files: [file] } })
    await waitFor(() => expect(screen.getByText('Unsaved changes')).toBeInTheDocument())
    fireEvent.click(screen.getByTitle('Save workflow'))
    expect(saved()).toHaveLength(2)
    expect(saved()[0].id).not.toBe(saved()[1].id)
    fireEvent.change(input, { target: { files: [] } })
    expect(screen.getByPlaceholderText('Workflow name')).toHaveValue('Portable (Imported)')
  })

  it('executes a two-step chain, locks file controls while pending and clears results', async () => {
    let resolveFirst!: (value: unknown) => void
    mockGenerate.mockImplementationOnce(() => new Promise(resolve => { resolveFirst = resolve }))
    render(<AgentEditorPage />)
    add(2)
    configure(0, 'Research')
    configure(1, 'Summarize')
    change(prompt(), 'Initial input')
    change(agent(0).getByRole('spinbutton'), '0')
    fireEvent.click(screen.getByRole('button', { name: 'Run Workflow' }))
    expect(screen.getByRole('button', { name: 'Executing...' })).toBeDisabled()
    for (const title of ['New workflow', 'Save workflow', 'Load workflow', 'Export workflow', 'Import workflow']) expect(screen.getByTitle(title)).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Add Agent' })).toBeDisabled()
    expect(mockGenerate).toHaveBeenNthCalledWith(1, 'gpt-oss:20b', 'Instructions for Research\n\nInitial input', { temperature: 0 })
    await act(async () => resolveFirst({ text: 'Research result', usage: { input_tokens: 11, output_tokens: 13 } }))
    await waitFor(() => expect(screen.getByText('Workflow completed')).toBeInTheDocument())
    expect(mockGenerate).toHaveBeenNthCalledWith(2, 'gpt-oss:20b', 'Instructions for Summarize\n\nResearch result', { temperature: 0.2 })
    expect(agent(0).getByText('Research result')).toBeInTheDocument()
    expect(agent(1).getByText('Fresh output')).toBeInTheDocument()
    expect(screen.getByText('Token Usage')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Clear Results' }))
    expect(screen.queryByText('Research result')).not.toBeInTheDocument()
    expect(screen.queryByText('Fresh output')).not.toBeInTheDocument()
    expect(screen.getByText('No execution history yet')).toBeInTheDocument()
    expect(screen.queryByText('Token Usage')).not.toBeInTheDocument()
  })

  it('stops at a failed step and retries without stale output or errors', async () => {
    mockGenerate.mockRejectedValueOnce(new Error('Endpoint offline'))
    render(<AgentEditorPage />)
    add(2)
    configure(0, 'Research')
    configure(1, 'Summarize')
    change(prompt(), 'Initial input')
    fireEvent.click(screen.getByRole('button', { name: 'Run Workflow' }))
    await waitFor(() => expect(agent(0).getByText('Endpoint offline')).toBeInTheDocument())
    expect(mockGenerate).toHaveBeenCalledTimes(1)
    expect(agent(1).queryByText('Fresh output')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Run Workflow' }))
    await waitFor(() => expect(mockGenerate).toHaveBeenCalledTimes(3))
    expect(agent(0).queryByText('Endpoint offline')).not.toBeInTheDocument()
    expect(agent(1).getByText('Fresh output')).toBeInTheDocument()
    expect(screen.queryByText('Error: Endpoint offline')).not.toBeInTheDocument()
  })
})
