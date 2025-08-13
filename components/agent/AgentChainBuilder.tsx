"use client"

import { useState, useCallback, useMemo, useRef } from 'react'
import { AgentCallpoint as AgentCallpointType, AgentWorkflow } from '@/types/agent'
import AgentCallpoint from './AgentCallpoint'
import WorkflowExecutor from './WorkflowExecutor'
import { useWorkflowPersistence } from '@/hooks/useWorkflowPersistence'

function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

function createNewCallpoint(): AgentCallpointType {
  return {
    id: generateId(),
    label: 'New Agent',
    endpointId: 'default',
    modelName: 'gpt-oss:20b',
    systemInstructions: '',
    inputSource: 'user',
    customPrompt: '',
    temperature: 0.2,
    isCollapsed: false
  }
}

export default function AgentChainBuilder() {
  const [workflow, setWorkflow] = useState<AgentWorkflow>({
    id: generateId(),
    name: 'New Workflow',
    description: '',
    callpoints: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  })

  const [isExecuting, setIsExecuting] = useState(false)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const {
    savedWorkflows,
    saveWorkflow,
    deleteWorkflow,
    getWorkflow,
    exportWorkflow,
    importWorkflow
  } = useWorkflowPersistence()

  // Add new callpoint
  const addCallpoint = useCallback(() => {
    const newCallpoint = createNewCallpoint()
    
    // If this is not the first callpoint, set input source to previous callpoint
    if (workflow.callpoints.length > 0) {
      const previousCallpoint = workflow.callpoints[workflow.callpoints.length - 1]
      newCallpoint.inputSource = previousCallpoint.id
    }

    setWorkflow(prev => ({
      ...prev,
      callpoints: [...prev.callpoints, newCallpoint],
      updatedAt: Date.now()
    }))
    setHasUnsavedChanges(true)
  }, [workflow.callpoints])

  // Update callpoint
  const updateCallpoint = useCallback((id: string, updates: Partial<AgentCallpointType>) => {
    setWorkflow(prev => ({
      ...prev,
      callpoints: prev.callpoints.map(cp => 
        cp.id === id ? { ...cp, ...updates } : cp
      ),
      updatedAt: Date.now()
    }))
    setHasUnsavedChanges(true)
  }, [])

  // Remove callpoint
  const removeCallpoint = useCallback((id: string) => {
    setWorkflow(prev => {
      const newCallpoints = prev.callpoints.filter(cp => cp.id !== id)
      
      // Update input sources that referenced the removed callpoint
      const updatedCallpoints = newCallpoints.map(cp => {
        if (cp.inputSource === id) {
          // Find the previous callpoint or set to user
          const currentIndex = newCallpoints.indexOf(cp)
          const previousCallpoint = currentIndex > 0 ? newCallpoints[currentIndex - 1] : null
          return {
            ...cp,
            inputSource: previousCallpoint ? previousCallpoint.id : 'user'
          }
        }
        return cp
      })

      return {
        ...prev,
        callpoints: updatedCallpoints,
        updatedAt: Date.now()
      }
    })
    setHasUnsavedChanges(true)
  }, [])

  // Move callpoint up
  const moveCallpointUp = useCallback((id: string) => {
    setWorkflow(prev => {
      const currentIndex = prev.callpoints.findIndex(cp => cp.id === id)
      if (currentIndex <= 0) return prev

      const newCallpoints = [...prev.callpoints]
      const [removed] = newCallpoints.splice(currentIndex, 1)
      newCallpoints.splice(currentIndex - 1, 0, removed)

      return {
        ...prev,
        callpoints: newCallpoints,
        updatedAt: Date.now()
      }
    })
    setHasUnsavedChanges(true)
  }, [])

  // Move callpoint down
  const moveCallpointDown = useCallback((id: string) => {
    setWorkflow(prev => {
      const currentIndex = prev.callpoints.findIndex(cp => cp.id === id)
      if (currentIndex >= prev.callpoints.length - 1) return prev

      const newCallpoints = [...prev.callpoints]
      const [removed] = newCallpoints.splice(currentIndex, 1)
      newCallpoints.splice(currentIndex + 1, 0, removed)

      return {
        ...prev,
        callpoints: newCallpoints,
        updatedAt: Date.now()
      }
    })
    setHasUnsavedChanges(true)
  }, [])

  // Get available inputs for a callpoint
  const getAvailableInputs = useCallback((callpointId: string) => {
    const inputs: Array<{ id: string; label: string; output?: string }> = [{ id: 'user', label: 'User Input' }]
    
    const callpointIndex = workflow.callpoints.findIndex(cp => cp.id === callpointId)
    
    // Add all previous callpoints as input options
    for (let i = 0; i < callpointIndex; i++) {
      const cp = workflow.callpoints[i]
      inputs.push({
        id: cp.id,
        label: `Output from: ${cp.label}`,
        output: cp.output
      })
    }

    return inputs
  }, [workflow.callpoints])

  // Check if workflow can be executed
  const canExecute = useMemo(() => {
    return workflow.callpoints.length > 0 && 
           workflow.callpoints.every(cp => 
             cp.endpointId && 
             cp.modelName && 
             cp.systemInstructions.trim() &&
             (cp.inputSource === 'user' ? cp.customPrompt?.trim() : true)
           )
  }, [workflow.callpoints])

  // Persistence functions
  const handleSaveWorkflow = useCallback(() => {
    const success = saveWorkflow(workflow)
    if (success) {
      setHasUnsavedChanges(false)
      setShowSaveDialog(false)
    }
  }, [workflow, saveWorkflow])

  const handleLoadWorkflow = useCallback((workflowToLoad: AgentWorkflow) => {
    setWorkflow(workflowToLoad)
    setHasUnsavedChanges(false)
    setShowLoadDialog(false)
  }, [])

  const handleNewWorkflow = useCallback(() => {
    setWorkflow({
      id: generateId(),
      name: 'New Workflow',
      description: '',
      callpoints: [],
      createdAt: Date.now(),
      updatedAt: Date.now()
    })
    setHasUnsavedChanges(false)
  }, [])

  const handleExportWorkflow = useCallback(() => {
    exportWorkflow(workflow)
  }, [workflow, exportWorkflow])

  const handleImportWorkflow = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const importedWorkflow = await importWorkflow(file)
    if (importedWorkflow) {
      setWorkflow(importedWorkflow)
      setHasUnsavedChanges(true)
    }
    
    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [importWorkflow])

  return (
    <div className="h-full flex">
      {/* Main Editor */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Workflow Header */}
        <div className="flex-shrink-0 p-6 bg-white/60 backdrop-blur-sm border-b border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex-1 mr-4">
              <input
                type="text"
                value={workflow.name}
                onChange={(e) => {
                  setWorkflow(prev => ({ 
                    ...prev, 
                    name: e.target.value,
                    updatedAt: Date.now()
                  }))
                  setHasUnsavedChanges(true)
                }}
                className="text-xl font-bold text-slate-800 bg-transparent border-none outline-none focus:bg-white/50 rounded px-2 -ml-2 w-full"
                placeholder="Workflow name"
              />
              <textarea
                value={workflow.description || ''}
                onChange={(e) => {
                  setWorkflow(prev => ({ 
                    ...prev, 
                    description: e.target.value,
                    updatedAt: Date.now()
                  }))
                  setHasUnsavedChanges(true)
                }}
                className="text-sm text-slate-600 bg-transparent border-none outline-none focus:bg-white/50 rounded px-2 -ml-2 w-full mt-1 resize-none"
                placeholder="Workflow description (optional)"
                rows={2}
              />
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="text-xs text-slate-500 bg-white/40 px-2 py-1 rounded-full font-medium">
                {workflow.callpoints.length} agent{workflow.callpoints.length !== 1 ? 's' : ''}
              </span>

              {hasUnsavedChanges && (
                <span className="text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded-full font-medium">
                  Unsaved changes
                </span>
              )}

              {/* File operations */}
              <div className="flex items-center space-x-1">
                <button
                  onClick={handleNewWorkflow}
                  disabled={isExecuting}
                  className="px-3 py-1.5 bg-white/60 hover:bg-white/80 border border-white/40 text-slate-700 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="New workflow"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12zm-9 7a1 1 0 012 0v1.586l2.293-2.293a1 1 0 111.414 1.414L6.414 15H8a1 1 0 010 2H4a1 1 0 01-1-1v-4zm13-1a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 010-2h1.586l-2.293-2.293a1 1 0 111.414-1.414L15 13.586V12a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                </button>

                <button
                  onClick={handleSaveWorkflow}
                  disabled={isExecuting}
                  className="px-3 py-1.5 bg-white/60 hover:bg-white/80 border border-white/40 text-slate-700 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Save workflow"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M7.707 10.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V6h5a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2h5v5.586l-1.293-1.293zM9 4a1 1 0 012 0v2H9V4z" />
                  </svg>
                </button>

                <button
                  onClick={() => setShowLoadDialog(true)}
                  disabled={isExecuting}
                  className="px-3 py-1.5 bg-white/60 hover:bg-white/80 border border-white/40 text-slate-700 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Load workflow"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>

                <button
                  onClick={handleExportWorkflow}
                  disabled={isExecuting}
                  className="px-3 py-1.5 bg-white/60 hover:bg-white/80 border border-white/40 text-slate-700 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Export workflow"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM6.293 6.707a1 1 0 010-1.414l3-3a1 1 0 011.414 0l3 3a1 1 0 01-1.414 1.414L11 5.414V13a1 1 0 11-2 0V5.414L7.707 6.707a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImportWorkflow}
                  className="hidden"
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isExecuting}
                  className="px-3 py-1.5 bg-white/60 hover:bg-white/80 border border-white/40 text-slate-700 text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Import workflow"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              <button
                onClick={addCallpoint}
                disabled={isExecuting}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                </svg>
                <span>Add Agent</span>
              </button>
            </div>
          </div>
        </div>

        {/* Callpoints List */}
        <div className="flex-1 overflow-y-auto p-6">
          {workflow.callpoints.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-slate-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-700 mb-2">
                  No agents in workflow
                </h3>
                <p className="text-slate-500 mb-4 max-w-sm">
                  Start building your multi-agent workflow by adding your first agent.
                </p>
                <button
                  onClick={addCallpoint}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-md transition-colors flex items-center space-x-2 mx-auto"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                  </svg>
                  <span>Add First Agent</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {workflow.callpoints.map((callpoint, index) => (
                <div key={callpoint.id} className="relative">
                  {/* Connection line to next callpoint */}
                  {index < workflow.callpoints.length - 1 && (
                    <div className="absolute left-1/2 -bottom-3 w-0.5 h-6 bg-gradient-to-b from-emerald-300 to-cyan-300 transform -translate-x-0.5 z-10" />
                  )}
                  
                  <AgentCallpoint
                    callpoint={callpoint}
                    availableInputs={getAvailableInputs(callpoint.id)}
                    onUpdate={(updates) => updateCallpoint(callpoint.id, updates)}
                    onRemove={() => removeCallpoint(callpoint.id)}
                    onMoveUp={index > 0 ? () => moveCallpointUp(callpoint.id) : undefined}
                    onMoveDown={index < workflow.callpoints.length - 1 ? () => moveCallpointDown(callpoint.id) : undefined}
                    showMoveUp={index > 0}
                    showMoveDown={index < workflow.callpoints.length - 1}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Execution Panel */}
      <div className="w-80 border-l border-white/20 bg-white/40 backdrop-blur-sm">
        <WorkflowExecutor
          workflow={workflow}
          onWorkflowUpdate={setWorkflow}
          isExecuting={isExecuting}
          onExecutionStateChange={setIsExecuting}
          canExecute={canExecute}
        />
      </div>

      {/* Load Workflow Dialog */}
      {showLoadDialog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-white/95 backdrop-blur-md border border-white/40 rounded-lg shadow-2xl max-w-md w-full m-4">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-slate-800 mb-4">Load Workflow</h3>
              
              {savedWorkflows.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-slate-500 mb-4">No saved workflows found</div>
                  <button
                    onClick={() => setShowLoadDialog(false)}
                    className="px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white text-sm font-medium rounded-md transition-colors"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
                  {savedWorkflows.map((savedWorkflow) => (
                    <div
                      key={savedWorkflow.id}
                      className="p-3 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0 mr-3">
                          <h4 className="font-medium text-slate-800 truncate">
                            {savedWorkflow.name}
                          </h4>
                          <p className="text-sm text-slate-600 truncate">
                            {savedWorkflow.description || 'No description'}
                          </p>
                          <div className="text-xs text-slate-500 mt-1">
                            {savedWorkflow.callpoints.length} agent{savedWorkflow.callpoints.length !== 1 ? 's' : ''} • 
                            Last updated {new Date(savedWorkflow.updatedAt).toLocaleDateString()}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleLoadWorkflow(savedWorkflow)}
                            className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-md transition-colors"
                          >
                            Load
                          </button>
                          <button
                            onClick={() => deleteWorkflow(savedWorkflow.id)}
                            className="px-3 py-1.5 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-md transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {savedWorkflows.length > 0 && (
                <div className="flex justify-end">
                  <button
                    onClick={() => setShowLoadDialog(false)}
                    className="px-4 py-2 bg-slate-500 hover:bg-slate-600 text-white text-sm font-medium rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}