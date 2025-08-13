"use client"

import { useState, useRef, useEffect } from 'react'
import { useOllamaEndpoints, OllamaEndpoint } from '@/components/OllamaEndpointProvider'

interface OllamaEndpointSlideoutProps {
  isOpen: boolean
  onClose: () => void
}

export default function OllamaEndpointSlideout({ isOpen, onClose }: OllamaEndpointSlideoutProps) {
  const {
    endpoints,
    addEndpoint,
    removeEndpoint,
    updateEndpoint,
    checkEndpointHealth,
    checkAllEndpointsHealth,
    loading
  } = useOllamaEndpoints()

  const [newEndpointLabel, setNewEndpointLabel] = useState('')
  const [newEndpointUrl, setNewEndpointUrl] = useState('')
  const [isAddingEndpoint, setIsAddingEndpoint] = useState(false)
  const [editingEndpoint, setEditingEndpoint] = useState<string | null>(null)
  const [editLabel, setEditLabel] = useState('')
  const [editUrl, setEditUrl] = useState('')
  const slideoutRef = useRef<HTMLDivElement>(null)

  // Handle outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (slideoutRef.current && !slideoutRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (editingEndpoint) {
          setEditingEndpoint(null)
        } else if (isAddingEndpoint) {
          setIsAddingEndpoint(false)
          setNewEndpointLabel('')
          setNewEndpointUrl('')
        } else {
          onClose()
        }
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose, editingEndpoint, isAddingEndpoint])

  const handleAddEndpoint = async () => {
    if (!newEndpointLabel.trim() || !newEndpointUrl.trim()) return

    try {
      await addEndpoint(newEndpointLabel.trim(), newEndpointUrl.trim())
      setNewEndpointLabel('')
      setNewEndpointUrl('')
      setIsAddingEndpoint(false)
    } catch (err) {
      console.error('Failed to add endpoint:', err)
    }
  }

  const handleEditEndpoint = (endpoint: OllamaEndpoint) => {
    setEditingEndpoint(endpoint.id)
    setEditLabel(endpoint.label)
    setEditUrl(endpoint.url)
  }

  const handleSaveEdit = () => {
    if (!editingEndpoint || !editLabel.trim() || !editUrl.trim()) return

    updateEndpoint(editingEndpoint, {
      label: editLabel.trim(),
      url: editUrl.trim()
    })
    setEditingEndpoint(null)
    setEditLabel('')
    setEditUrl('')
    
    // Re-check health after URL change
    checkEndpointHealth(editingEndpoint)
  }

  const handleCancelEdit = () => {
    setEditingEndpoint(null)
    setEditLabel('')
    setEditUrl('')
  }

  const handleRemoveEndpoint = (id: string) => {
    try {
      removeEndpoint(id)
    } catch (err) {
      console.error('Failed to remove endpoint:', err)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-emerald-500 shadow-emerald-500/30'
      case 'error':
        return 'bg-red-500 shadow-red-500/30'
      case 'checking':
        return 'bg-amber-500 shadow-amber-500/30 animate-pulse'
      default:
        return 'bg-slate-400'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'Connected'
      case 'error':
        return 'Error'
      case 'checking':
        return 'Checking...'
      default:
        return 'Unknown'
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex justify-end">
      <div
        ref={slideoutRef}
        className="w-full max-w-lg bg-white/95 backdrop-blur-md shadow-2xl h-full overflow-y-auto animate-slide-in-right border-l border-white/40"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <h2 className="text-xl font-bold text-slate-800">Ollama Endpoints</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/60 rounded-lg transition-colors text-slate-600 hover:text-slate-800"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Refresh All Button */}
          <div className="flex justify-between items-center">
            <span className="text-sm text-slate-600 font-medium">
              {endpoints.length} endpoint{endpoints.length !== 1 ? 's' : ''} configured
            </span>
            <button
              onClick={checkAllEndpointsHealth}
              disabled={loading}
              className="px-3 py-1.5 bg-white/60 hover:bg-white/80 border border-white/40 rounded-md text-sm font-medium text-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
            >
              <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
              </svg>
              <span>Refresh All</span>
            </button>
          </div>

          {/* Endpoints List */}
          <div className="space-y-4">
            {endpoints.map((endpoint) => (
              <div
                key={endpoint.id}
                className="bg-white/60 backdrop-blur-sm border border-white/40 rounded-lg p-4 shadow-soft"
              >
                {editingEndpoint === endpoint.id ? (
                  /* Edit Mode */
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Label
                      </label>
                      <input
                        type="text"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        className="w-full px-3 py-2 bg-white/70 border border-white/40 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="Endpoint label"
                        disabled={endpoint.isDefault}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        URL
                      </label>
                      <input
                        type="url"
                        value={editUrl}
                        onChange={(e) => setEditUrl(e.target.value)}
                        className="w-full px-3 py-2 bg-white/70 border border-white/40 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        placeholder="http://localhost:11434"
                        disabled={endpoint.isDefault}
                      />
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={handleSaveEdit}
                        disabled={!editLabel.trim() || !editUrl.trim()}
                        className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Save
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-3 py-1.5 bg-white/60 hover:bg-white/80 border border-white/40 text-slate-700 text-sm font-medium rounded-md transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  /* View Mode */
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-3 h-3 rounded-full transition-all duration-300 ${getStatusColor(endpoint.healthStatus)}`}
                        />
                        <div>
                          <h3 className="font-semibold text-slate-800 flex items-center space-x-2">
                            <span>{endpoint.label}</span>
                            {endpoint.isDefault && (
                              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-medium border border-blue-200">
                                Default
                              </span>
                            )}
                          </h3>
                          <p className="text-sm text-slate-600">{endpoint.url}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => checkEndpointHealth(endpoint.id)}
                          className="p-1.5 hover:bg-white/60 rounded-md transition-colors text-slate-600 hover:text-slate-800"
                          title="Check health"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleEditEndpoint(endpoint)}
                          className="p-1.5 hover:bg-white/60 rounded-md transition-colors text-slate-600 hover:text-slate-800"
                          title="Edit endpoint"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        {!endpoint.isDefault && (
                          <button
                            onClick={() => handleRemoveEndpoint(endpoint.id)}
                            className="p-1.5 hover:bg-red-100 rounded-md transition-colors text-red-600 hover:text-red-800"
                            title="Remove endpoint"
                          >
                            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <span className={`font-medium ${
                        endpoint.healthStatus === 'healthy' ? 'text-emerald-700' :
                        endpoint.healthStatus === 'error' ? 'text-red-700' :
                        'text-amber-700'
                      }`}>
                        {getStatusText(endpoint.healthStatus)}
                      </span>
                      <span className="text-slate-600">
                        {endpoint.models.length} model{endpoint.models.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {endpoint.errorMessage && (
                      <div className="mt-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">
                        {endpoint.errorMessage}
                      </div>
                    )}

                    {endpoint.models.length > 0 && (
                      <details className="mt-3">
                        <summary className="text-sm font-medium text-slate-700 cursor-pointer hover:text-slate-900">
                          Available Models ({endpoint.models.length})
                        </summary>
                        <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                          {endpoint.models.map((model) => (
                            <div
                              key={model.name}
                              className="text-xs text-slate-600 bg-white/50 border border-white/30 rounded px-2 py-1 font-mono"
                            >
                              {model.name}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add New Endpoint */}
          {isAddingEndpoint ? (
            <div className="bg-white/60 backdrop-blur-sm border border-white/40 rounded-lg p-4 shadow-soft">
              <h3 className="font-semibold text-slate-800 mb-3">Add New Endpoint</h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Label
                  </label>
                  <input
                    type="text"
                    value={newEndpointLabel}
                    onChange={(e) => setNewEndpointLabel(e.target.value)}
                    className="w-full px-3 py-2 bg-white/70 border border-white/40 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="e.g., Remote Server"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    URL
                  </label>
                  <input
                    type="url"
                    value={newEndpointUrl}
                    onChange={(e) => setNewEndpointUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-white/70 border border-white/40 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    placeholder="http://192.168.1.100:11434"
                  />
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={handleAddEndpoint}
                    disabled={!newEndpointLabel.trim() || !newEndpointUrl.trim()}
                    className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Endpoint
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingEndpoint(false)
                      setNewEndpointLabel('')
                      setNewEndpointUrl('')
                    }}
                    className="px-3 py-1.5 bg-white/60 hover:bg-white/80 border border-white/40 text-slate-700 text-sm font-medium rounded-md transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setIsAddingEndpoint(true)}
              className="w-full p-4 border-2 border-dashed border-white/40 hover:border-emerald-400 hover:bg-emerald-50/50 rounded-lg transition-colors text-slate-600 hover:text-emerald-700 flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">Add New Endpoint</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}