import React from 'react'
import { render, fireEvent } from '@/__tests__/utils/test-providers'
import AgentCallpoint from '@/components/agent/AgentCallpoint'

describe('AgentCallpoint', () => {
  const baseCallpoint = {
    id: 'cp1',
    label: 'Test Agent',
    endpointId: 'default',
    modelName: 'gpt-oss:20b',
    systemInstructions: 'You are helpful',
    inputSource: 'user',
    customPrompt: 'Hello world',
    temperature: 0.2,
    isCollapsed: false
  }

  const availableInputs = [{ id: 'user', label: 'User Input' }]

  it('renders and toggles collapse state', () => {
    const onUpdate = jest.fn()
    const { getByTitle } = render(
      <AgentCallpoint
        callpoint={baseCallpoint as any}
        availableInputs={availableInputs}
        onUpdate={onUpdate}
        onRemove={jest.fn()}
      />
    )

    const toggle = getByTitle('Collapse')
    fireEvent.click(toggle)
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ isCollapsed: true }))
  })

  it('updates label and temperature and prompt', () => {
    const onUpdate = jest.fn()
  const { getByPlaceholderText, container } = render(
      <AgentCallpoint
        callpoint={baseCallpoint as any}
        availableInputs={availableInputs}
        onUpdate={onUpdate}
        onRemove={jest.fn()}
      />
    )

    fireEvent.change(getByPlaceholderText('Agent name'), { target: { value: 'Renamed' } })
    // Temperature input isn't explicitly associated with the label via htmlFor, grab by type/attributes
    const tempInput = container.querySelector('input[type="number"][step="0.1"]') as HTMLInputElement
    if (!tempInput) throw new Error('Temperature input not found')
    fireEvent.change(tempInput, { target: { value: '0.3' } })
  const promptArea = container.querySelector('textarea[placeholder="Enter the initial prompt for this workflow..."]') as HTMLTextAreaElement
  if (!promptArea) throw new Error('Prompt textarea not found')
  fireEvent.change(promptArea, { target: { value: 'New prompt' } })

    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ label: 'Renamed' }))
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ temperature: 0.3 }))
    expect(onUpdate).toHaveBeenCalledWith(expect.objectContaining({ customPrompt: 'New prompt' }))
  })
})
