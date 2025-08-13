import React from 'react'
import { render, fireEvent, screen, act } from '@/__tests__/utils/test-providers'
import WorkflowExecutor from '@/components/agent/WorkflowExecutor'
import { AgentWorkflow } from '@/types/agent'
import { useOllamaEndpoints } from '@/components/OllamaEndpointProvider'

describe('WorkflowExecutor', () => {
  const baseWorkflow: AgentWorkflow = {
    id: 'wf',
    name: 'WF',
    description: '',
    callpoints: [
      {
        id: 'cp1',
        label: 'Agent 1',
        endpointId: 'default',
        modelName: 'gpt-oss:20b',
        systemInstructions: 'Do it',
        inputSource: 'user',
        customPrompt: 'Hello',
        temperature: 0.2,
        isCollapsed: false
      }
    ],
    createdAt: Date.now(),
    updatedAt: Date.now()
  }

  it('executes workflow successfully and logs entries', async () => {
    const endpointCtx: any = useOllamaEndpoints()
    endpointCtx.getEndpointClient.mockReturnValue({
      generate: jest.fn(async () => ({ text: 'Output', usage: { input_tokens: 5, output_tokens: 7 } }))
    })

    let wfState = baseWorkflow
    const setWorkflow = (updater: any) => {
      wfState = typeof updater === 'function' ? updater(wfState) : updater
    }

    render(
      <WorkflowExecutor
        workflow={wfState}
        onWorkflowUpdate={setWorkflow}
        isExecuting={false}
        onExecutionStateChange={() => {}}
        canExecute={true}
      />
    )

    await act(async () => {
      fireEvent.click(screen.getByText('Run Workflow'))
    })

    expect(screen.getByText(/Completed successfully/)).toBeInTheDocument()
    expect(screen.getByText('Workflow completed')).toBeInTheDocument()
  })

  it('handles missing input error', async () => {
    const endpointCtx: any = useOllamaEndpoints()
    endpointCtx.getEndpointClient.mockReturnValue({
      generate: jest.fn()
    })

    const wf: AgentWorkflow = {
      ...baseWorkflow,
      callpoints: [{ ...baseWorkflow.callpoints[0], customPrompt: '' }]
    }
    let wfState = wf
    const setWorkflow = (updater: any) => { wfState = typeof updater === 'function' ? updater(wfState) : updater }

    render(
      <WorkflowExecutor
        workflow={wfState}
        onWorkflowUpdate={setWorkflow}
        isExecuting={false}
        onExecutionStateChange={() => {}}
        canExecute={true}
      />
    )

    await act(async () => {
      fireEvent.click(screen.getByText('Run Workflow'))
    })

    expect(screen.getByText(/No input provided/)).toBeInTheDocument()
  })
})
