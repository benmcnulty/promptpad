"use client"

import { useState, useEffect, useMemo } from 'react'
import { useModel } from '@/components/ModelProvider'
import { useOllamaEndpoints } from '@/components/OllamaEndpointProvider'
import { AgentCallpoint as AgentCallpointType } from '@/types/agent'

interface AgentCallpointProps {
  callpoint: AgentCallpointType
  availableInputs: Array<{ id: string; label: string; output?: string }>
  onUpdate: (updates: Partial<AgentCallpointType>) => void
  onRemove: () => void
  onMoveUp?: () => void
  onMoveDown?: () => void
  showMoveUp?: boolean
  showMoveDown?: boolean
}

export default function AgentCallpoint({
  callpoint,
  availableInputs,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  showMoveUp = false,
  showMoveDown = false
}: AgentCallpointProps) {
  const { getAllAvailableModels } = useModel()
  const { endpoints, getHealthyEndpoints } = useOllamaEndpoints()
  const [isExpanded, setIsExpanded] = useState(!callpoint.isCollapsed)

  const allModels = getAllAvailableModels()
  const healthyEndpoints = getHealthyEndpoints()

  // Group models by endpoint for the dropdown
  const modelsByEndpoint = useMemo(() => {
    return allModels.reduce((acc, model) => {
      const endpointId = model.endpointId || 'default'
      const endpointLabel = model.endpointLabel || 'Unknown'
      
      if (!acc[endpointId]) {
        acc[endpointId] = {
          label: endpointLabel,
          models: []
        }
      }
      acc[endpointId].models.push(model)
      return acc
    }, {} as Record<string, { label: string; models: typeof allModels }>)
  }, [allModels])

  // Update collapsed state
  useEffect(() => {
    onUpdate({ isCollapsed: !isExpanded })
  }, [isExpanded, onUpdate])

  const getStatusIcon = () => {
    if (callpoint.isExecuting) {
      return (
        <div className="w-4 h-4 rounded-full bg-amber-500 animate-pulse shadow-amber-500/30 shadow-lg" />
      )
    }
    if (callpoint.error) {
      return (
        <div className="w-4 h-4 rounded-full bg-red-500 shadow-red-500/30 shadow-lg" />
      )
    }
    if (callpoint.output) {
      return (
        <div className="w-4 h-4 rounded-full bg-emerald-500 shadow-emerald-500/30 shadow-lg" />
      )
    }
    return (
      <div className="w-4 h-4 rounded-full bg-slate-300" />
    )
  }

  const getSelectedEndpoint = () => {
    return endpoints.find(ep => ep.id === callpoint.endpointId)
  }

  const selectedEndpoint = getSelectedEndpoint()

  return (
    <div className="bg-white/80 backdrop-blur-sm border border-white/40 rounded-lg shadow-soft">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-white/20">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <input
              type="text"
              value={callpoint.label}
              onChange={(e) => onUpdate({ label: e.target.value })}
              className="font-semibold text-slate-800 bg-transparent border-none outline-none focus:bg-white/50 rounded px-1 -ml-1"
              placeholder="Agent name"
            />
            <div className="text-xs text-slate-500 mt-0.5">
              {selectedEndpoint ? (
                <span>{selectedEndpoint.label} • {callpoint.modelName}</span>
              ) : (
                <span className="text-red-500">Endpoint not found</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Move controls */}
          {showMoveUp && (
            <button
              onClick={onMoveUp}
              className="p-1.5 hover:bg-white/60 rounded-md transition-colors text-slate-600 hover:text-slate-800"
              title="Move up"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}
          {showMoveDown && (
            <button
              onClick={onMoveDown}
              className="p-1.5 hover:bg-white/60 rounded-md transition-colors text-slate-600 hover:text-slate-800"
              title="Move down"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          )}

          {/* Collapse/Expand */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 hover:bg-white/60 rounded-md transition-colors text-slate-600 hover:text-slate-800"
            title={isExpanded ? "Collapse" : "Expand"}
          >
            <svg className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>

          {/* Remove */}
          <button
            onClick={onRemove}
            className="p-1.5 hover:bg-red-100 rounded-md transition-colors text-red-600 hover:text-red-800"
            title="Remove agent"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* Endpoint & Model Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Endpoint & Model
              </label>
              <select
                value={`${callpoint.endpointId}:${callpoint.modelName}`}
                onChange={(e) => {
                  const [endpointId, modelName] = e.target.value.split(':', 2)
                  onUpdate({ endpointId, modelName })
                }}
                className="w-full px-3 py-2 bg-white/70 border border-white/40 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="">Select endpoint and model</option>
                {Object.entries(modelsByEndpoint).map(([endpointId, endpoint]) => (
                  <optgroup key={endpointId} label={endpoint.label}>
                    {endpoint.models.map(model => (
                      <option key={`${endpointId}:${model.name}`} value={`${endpointId}:${model.name}`}>
                        {model.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Temperature
              </label>
              <input
                type="number"
                min="0"
                max="1"
                step="0.1"
                value={callpoint.temperature || 0.2}
                onChange={(e) => onUpdate({ temperature: parseFloat(e.target.value) || 0.2 })}
                className="w-full px-3 py-2 bg-white/70 border border-white/40 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Input Source */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Input Source
            </label>
            <select
              value={callpoint.inputSource}
              onChange={(e) => onUpdate({ inputSource: e.target.value })}
              className="w-full px-3 py-2 bg-white/70 border border-white/40 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              {availableInputs.map(input => (
                <option key={input.id} value={input.id}>
                  {input.label}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Prompt (for user input) */}
          {callpoint.inputSource === 'user' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                User Input Prompt
              </label>
              <textarea
                value={callpoint.customPrompt || ''}
                onChange={(e) => onUpdate({ customPrompt: e.target.value })}
                className="w-full px-3 py-2 bg-white/70 border border-white/40 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                rows={3}
                placeholder="Enter the initial prompt for this workflow..."
              />
            </div>
          )}

          {/* System Instructions */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              System Instructions
            </label>
            <textarea
              value={callpoint.systemInstructions}
              onChange={(e) => onUpdate({ systemInstructions: e.target.value })}
              className="w-full px-3 py-2 bg-white/70 border border-white/40 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              rows={4}
              placeholder="Define the role and behavior for this agent..."
            />
          </div>

          {/* Output Preview */}
          {callpoint.output && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Output
              </label>
              <div className="bg-slate-50 border border-slate-200 rounded-md p-3 text-sm text-slate-700 max-h-32 overflow-y-auto">
                {callpoint.output}
              </div>
              {callpoint.usage && (
                <div className="text-xs text-slate-500 mt-1">
                  {callpoint.usage.input_tokens} input tokens, {callpoint.usage.output_tokens} output tokens
                </div>
              )}
            </div>
          )}

          {/* Error Display */}
          {callpoint.error && (
            <div>
              <label className="block text-sm font-medium text-red-700 mb-2">
                Error
              </label>
              <div className="bg-red-50 border border-red-200 rounded-md p-3 text-sm text-red-700">
                {callpoint.error}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}