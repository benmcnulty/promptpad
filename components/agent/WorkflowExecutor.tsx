"use client"

import { useState, useCallback, useMemo } from 'react'
import { AgentWorkflow, WorkflowExecution } from '@/types/agent'
import { useOllamaEndpoints } from '@/components/OllamaEndpointProvider'

interface WorkflowExecutorProps {
  workflow: AgentWorkflow
  onWorkflowUpdate: (workflow: AgentWorkflow | ((prev: AgentWorkflow) => AgentWorkflow)) => void
  isExecuting: boolean
  onExecutionStateChange: (isExecuting: boolean) => void
  canExecute: boolean
}

export default function WorkflowExecutor({
  workflow,
  onWorkflowUpdate,
  isExecuting,
  onExecutionStateChange,
  canExecute
}: WorkflowExecutorProps) {
  const [execution, setExecution] = useState<WorkflowExecution | null>(null)
  const [executionLog, setExecutionLog] = useState<Array<{ step: string; message: string; timestamp: number; type: 'info' | 'error' | 'success' }>>([])
  const { getEndpointClient } = useOllamaEndpoints()

  const addLogEntry = useCallback((step: string, message: string, type: 'info' | 'error' | 'success' = 'info') => {
    setExecutionLog(prev => [...prev, { step, message, timestamp: Date.now(), type }])
  }, [])

  const executeWorkflow = useCallback(async () => {
    if (!canExecute || isExecuting) return

    onExecutionStateChange(true)
    
    const newExecution: WorkflowExecution = {
      workflowId: workflow.id,
      callpointResults: {},
      isRunning: true
    }
    
    setExecution(newExecution)
    setExecutionLog([])
    addLogEntry('workflow', `Starting workflow: ${workflow.name}`, 'info')

    // Clear previous results
    onWorkflowUpdate({
      ...workflow,
      callpoints: workflow.callpoints.map((cp) => ({
        ...cp,
        output: undefined,
        error: undefined,
        usage: undefined,
        isExecuting: false
      }))
    })

    try {
      for (let i = 0; i < workflow.callpoints.length; i++) {
        const callpoint = workflow.callpoints[i]
        
        addLogEntry(callpoint.label, `Starting execution...`, 'info')
        
        // Mark as executing
        setExecution(prev => prev ? { ...prev, currentStep: callpoint.id } : null)
        onWorkflowUpdate((prev: AgentWorkflow) => ({
          ...prev,
          callpoints: prev.callpoints.map((cp) => 
            cp.id === callpoint.id 
              ? { ...cp, isExecuting: true, error: undefined, output: undefined }
              : cp
          )
        }))

        try {
          // Get input for this callpoint
          let input = ''
          if (callpoint.inputSource === 'user') {
            input = callpoint.customPrompt || ''
          } else {
            // Find the output from the specified callpoint
            const sourceCallpoint = workflow.callpoints.find(cp => cp.id === callpoint.inputSource)
            if (sourceCallpoint && newExecution.callpointResults[sourceCallpoint.id]) {
              input = newExecution.callpointResults[sourceCallpoint.id].output
            } else {
              throw new Error(`Input source "${callpoint.inputSource}" not found or has no output`)
            }
          }

          if (!input.trim()) {
            throw new Error('No input provided for this step')
          }

          // Get the client for this endpoint
          const client = getEndpointClient(callpoint.endpointId)
          if (!client) {
            throw new Error(`Endpoint "${callpoint.endpointId}" not available`)
          }

          addLogEntry(callpoint.label, `Generating with ${callpoint.modelName}...`, 'info')

          // Execute the generation
          const result = await client.generate(
            callpoint.modelName,
            `${callpoint.systemInstructions}\n\n${input}`,
            { temperature: callpoint.temperature || 0.2 }
          )

          // Store the result
          newExecution.callpointResults[callpoint.id] = {
            output: result.text,
            usage: result.usage,
            timestamp: Date.now()
          }

          addLogEntry(callpoint.label, `Completed successfully (${result.usage.input_tokens} input, ${result.usage.output_tokens} output tokens)`, 'success')

          // Update the callpoint with results
          onWorkflowUpdate((prev: AgentWorkflow) => ({
            ...prev,
            callpoints: prev.callpoints.map((cp) => 
              cp.id === callpoint.id 
                ? { 
                    ...cp, 
                    isExecuting: false, 
                    output: result.text,
                    usage: result.usage,
                    error: undefined
                  }
                : cp
            )
          }))

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error'
          
          addLogEntry(callpoint.label, `Error: ${errorMessage}`, 'error')
          
          // Store the error
          newExecution.callpointResults[callpoint.id] = {
            output: '',
            error: errorMessage,
            timestamp: Date.now()
          }

          // Update the callpoint with error
          onWorkflowUpdate((prev: AgentWorkflow) => ({
            ...prev,
            callpoints: prev.callpoints.map((cp) => 
              cp.id === callpoint.id 
                ? { 
                    ...cp, 
                    isExecuting: false, 
                    error: errorMessage,
                    output: undefined,
                    usage: undefined
                  }
                : cp
            )
          }))

          // Stop execution on error
          break
        }
      }

      addLogEntry('workflow', 'Workflow completed', 'success')

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      addLogEntry('workflow', `Workflow failed: ${errorMessage}`, 'error')
    } finally {
      setExecution(prev => prev ? { ...prev, isRunning: false, currentStep: undefined } : null)
      onExecutionStateChange(false)
    }
  }, [workflow, canExecute, isExecuting, onExecutionStateChange, onWorkflowUpdate, getEndpointClient, addLogEntry])

  const clearResults = useCallback(() => {
    onWorkflowUpdate({
      ...workflow,
      callpoints: workflow.callpoints.map((cp) => ({
        ...cp,
        output: undefined,
        error: undefined,
        usage: undefined,
        isExecuting: false
      }))
    })
    setExecution(null)
    setExecutionLog([])
  }, [workflow, onWorkflowUpdate])

  const totalTokens = useMemo(() => {
    const callpointsWithResults = workflow.callpoints.filter(cp => cp.usage)
    return {
      input: callpointsWithResults.reduce((sum, cp) => sum + (cp.usage?.input_tokens || 0), 0),
      output: callpointsWithResults.reduce((sum, cp) => sum + (cp.usage?.output_tokens || 0), 0)
    }
  }, [workflow.callpoints])

  const getLogIcon = (type: string) => {
    switch (type) {
      case 'success':
        return (
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
        )
      case 'error':
        return (
          <div className="w-3 h-3 rounded-full bg-red-500" />
        )
      default:
        return (
          <div className="w-3 h-3 rounded-full bg-blue-500" />
        )
    }
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-white/20">
        <h3 className="font-semibold text-slate-800 mb-3">Execution</h3>
        
        <div className="space-y-2">
          <button
            onClick={executeWorkflow}
            disabled={!canExecute || isExecuting}
            className="w-full px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
          >
            {isExecuting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Executing...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                </svg>
                <span>Run Workflow</span>
              </>
            )}
          </button>

          {(totalTokens.input > 0 || totalTokens.output > 0) && (
            <button
              onClick={clearResults}
              disabled={isExecuting}
              className="w-full px-3 py-1.5 bg-white/60 hover:bg-white/80 border border-white/40 text-slate-700 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Clear Results
            </button>
          )}
        </div>

        {/* Validation Messages */}
        {!canExecute && workflow.callpoints.length > 0 && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
            <div className="text-sm text-amber-800">
              <p className="font-medium mb-1">Workflow validation:</p>
              <ul className="text-xs space-y-1">
                {workflow.callpoints.some(cp => !cp.endpointId || !cp.modelName) && (
                  <li>• Some agents are missing endpoint/model configuration</li>
                )}
                {workflow.callpoints.some(cp => !cp.systemInstructions.trim()) && (
                  <li>• Some agents are missing system instructions</li>
                )}
                {workflow.callpoints.some(cp => cp.inputSource === 'user' && !cp.customPrompt?.trim()) && (
                  <li>• User input agents need a custom prompt</li>
                )}
              </ul>
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      {(totalTokens.input > 0 || totalTokens.output > 0) && (
        <div className="flex-shrink-0 p-4 border-b border-white/20">
          <div className="bg-white/60 rounded-lg p-3">
            <h4 className="text-sm font-medium text-slate-700 mb-2">Token Usage</h4>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <div className="text-xs text-slate-500">Input</div>
                <div className="font-semibold text-slate-800">{totalTokens.input.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-slate-500">Output</div>
                <div className="font-semibold text-slate-800">{totalTokens.output.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Execution Log */}
      <div className="flex-1 min-h-0 p-4">
        <h4 className="text-sm font-medium text-slate-700 mb-3">Execution Log</h4>
        
        {executionLog.length === 0 ? (
          <div className="text-center text-slate-500 text-sm py-8">
            No execution history yet
          </div>
        ) : (
          <div className="space-y-2 max-h-full overflow-y-auto">
            {executionLog.map((entry, index) => (
              <div key={index} className="flex items-start space-x-3 text-sm">
                {getLogIcon(entry.type)}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-slate-700 truncate">
                      {entry.step}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(entry.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  <div className={`text-xs mt-0.5 ${
                    entry.type === 'error' ? 'text-red-600' :
                    entry.type === 'success' ? 'text-emerald-600' :
                    'text-slate-600'
                  }`}>
                    {entry.message}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}