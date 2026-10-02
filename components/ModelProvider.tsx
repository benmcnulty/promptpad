"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react'
import { useOllamaEndpoints } from '@/components/OllamaEndpointProvider'

export interface ModelInfo {
  name: string
  family?: string
  parameters?: string
  default?: boolean
  endpointId?: string
  endpointLabel?: string
}

interface ModelContextValue {
  models: ModelInfo[]
  selectedModel: string
  selectedEndpointId: string
  selectedEndpointUrl: string | null | undefined
  setSelectedModel: (name: string, endpointId?: string) => void
  getModelsByEndpoint: (endpointId: string) => ModelInfo[]
  getAllAvailableModels: () => ModelInfo[]
  loading: boolean
  error: string | null
  refresh: () => void
}

const DEFAULT_MODEL = 'gpt-oss:20b'
const MODEL_KEY = 'promptpad-model'
const ENDPOINT_KEY = 'promptpad-endpoint'

const ModelContext = createContext<ModelContextValue | null>(null)

export function ModelProvider({ children }: { children: ReactNode }) {
  const [models, setModels] = useState<ModelInfo[]>([])
  const [selectedModel, setSelected] = useState<string>(DEFAULT_MODEL)
  const [selectedEndpointId, setSelectedEndpointId] = useState<string>('default')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const controller = useRef<AbortController | null>(null)
  const { endpoints } = useOllamaEndpoints()
  // Default means the server-configured endpoint. A missing custom selection must fail explicitly.
  const selectedEndpointUrl = selectedEndpointId === 'default' ? undefined
    : endpoints.find(endpoint => endpoint.id === selectedEndpointId)?.url ?? null

  // Load preferences
  useEffect(() => {
    try {
      const storedModel = localStorage.getItem(MODEL_KEY)
      const storedEndpoint = localStorage.getItem(ENDPOINT_KEY)
      
      if (storedModel && typeof storedModel === 'string') {
        setSelected(storedModel)
      }
      if (storedEndpoint && typeof storedEndpoint === 'string') {
        setSelectedEndpointId(storedEndpoint)
      }
    } catch {}
  }, [])

  // Persist preferences
  useEffect(() => {
    try { localStorage.setItem(MODEL_KEY, selectedModel) } catch {}
  }, [selectedModel])

  useEffect(() => {
    try { localStorage.setItem(ENDPOINT_KEY, selectedEndpointId) } catch {}
  }, [selectedEndpointId])

  const fetchModels = useCallback(async () => {
    if (controller.current) controller.current.abort()
    const ctrl = new AbortController()
    controller.current = ctrl
    setLoading(true)
    setError(null)
    
    try {
      // List through the same server routes used for generation, including its allowlist.
      const allModels: ModelInfo[] = []
      const failures: string[] = []
      for (const endpoint of endpoints) {
        const res = await fetch('/api/models', {
          signal: ctrl.signal,
          headers: endpoint.id === 'default' ? {} : { 'X-Ollama-Endpoint': endpoint.url },
        })
        if (!res.ok) {
          failures.push(`${endpoint.label}: models request failed (${res.status})`)
          continue
        }
        const data = await res.json() as ModelInfo[]
        allModels.push(...data.map(model => ({
          ...model, endpointId: endpoint.id,
          endpointLabel: endpoint.id === 'default' ? 'Server default' : endpoint.label,
        })))
      }
      if (ctrl.signal.aborted) return
      setModels(allModels)
      if (failures.length) setError(failures.join('; '))
      
      // Ensure selected model is valid; otherwise prefer default if present
      const hasSelected = allModels.some(m => m.name === selectedModel && m.endpointId === selectedEndpointId)
      if (!hasSelected && allModels.length) {
        const available = allModels.find(m => m.name === DEFAULT_MODEL) || allModels[0]
        setSelected(available.name)
        if (available.endpointId) {
          setSelectedEndpointId(available.endpointId)
        }
      }
    } catch (err) {
      if (!ctrl.signal.aborted) setError(err instanceof Error ? err.message : 'Failed to load models')
    } finally {
      if (controller.current === ctrl) {
        setLoading(false)
        controller.current = null
      }
    }
  }, [selectedModel, selectedEndpointId, endpoints])

  useEffect(() => {
    fetchModels()
    return () => {
      if (controller.current) controller.current.abort()
    }
  }, [fetchModels])

  // Helper functions
  const getModelsByEndpoint = useCallback((endpointId: string) => {
    return models.filter(model => model.endpointId === endpointId)
  }, [models])

  const getAllAvailableModels = useCallback(() => {
    return models
  }, [models])

  const setSelectedModelWithEndpoint = useCallback((name: string, endpointId?: string) => {
    setSelected(name)
    if (endpointId) {
      setSelectedEndpointId(endpointId)
    } else {
      // Find the endpoint for this model
      const model = models.find(m => m.name === name)
      if (model?.endpointId) {
        setSelectedEndpointId(model.endpointId)
      }
    }
  }, [models])

  const value = useMemo<ModelContextValue>(() => ({
    models,
    selectedModel,
    selectedEndpointId,
    selectedEndpointUrl,
    setSelectedModel: setSelectedModelWithEndpoint,
    getModelsByEndpoint,
    getAllAvailableModels,
    loading,
    error,
    refresh: fetchModels,
  }), [models, selectedModel, selectedEndpointId, selectedEndpointUrl, setSelectedModelWithEndpoint, getModelsByEndpoint, getAllAvailableModels, loading, error, fetchModels])

  return <ModelContext.Provider value={value}>{children}</ModelContext.Provider>
}

export function useModel() {
  const ctx = useContext(ModelContext)
  if (!ctx) throw new Error('useModel must be used within ModelProvider')
  return ctx
}

