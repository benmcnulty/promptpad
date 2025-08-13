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
  const mounted = useRef(false)
  const { endpoints, getHealthyEndpoints } = useOllamaEndpoints()

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
      // Aggregate models from all healthy endpoints
      const allModels: ModelInfo[] = []
      const healthyEndpoints = getHealthyEndpoints()
      
      if (healthyEndpoints.length === 0) {
        // Fallback to legacy API if no endpoints are healthy
        const res = await fetch('/api/models', { signal: ctrl.signal })
        if (!res.ok) throw new Error(`Models request failed (${res.status})`)
        const data = await res.json() as ModelInfo[]
        allModels.push(...data.map(model => ({ 
          ...model, 
          endpointId: 'default',
          endpointLabel: 'Default (localhost)'
        })))
      } else {
        // Fetch models from all healthy endpoints
        for (const endpoint of healthyEndpoints) {
          // Use the models already loaded by the endpoint provider
          const endpointModels = endpoint.models.map(model => ({
            ...model,
            endpointId: endpoint.id,
            endpointLabel: endpoint.label
          }))
          allModels.push(...endpointModels)
        }
      }
      
      setModels(allModels)
      
      // Ensure selected model is valid; otherwise prefer default if present
      const hasSelected = allModels.some(m => m.name === selectedModel)
      const hasDefault = allModels.some(m => m.name === DEFAULT_MODEL)
      if (!hasSelected && hasDefault) {
        const defaultModel = allModels.find(m => m.name === DEFAULT_MODEL)
        setSelected(DEFAULT_MODEL)
        if (defaultModel?.endpointId) {
          setSelectedEndpointId(defaultModel.endpointId)
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load models')
    } finally {
      setLoading(false)
      controller.current = null
    }
  }, [selectedModel, getHealthyEndpoints])

  useEffect(() => {
    if (mounted.current) return
    mounted.current = true
    fetchModels()
    return () => {
      if (controller.current) controller.current.abort()
      mounted.current = false
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
    setSelectedModel: setSelectedModelWithEndpoint,
    getModelsByEndpoint,
    getAllAvailableModels,
    loading,
    error,
    refresh: fetchModels,
  }), [models, selectedModel, selectedEndpointId, setSelectedModelWithEndpoint, getModelsByEndpoint, getAllAvailableModels, loading, error, fetchModels])

  return <ModelContext.Provider value={value}>{children}</ModelContext.Provider>
}

export function useModel() {
  const ctx = useContext(ModelContext)
  if (!ctx) throw new Error('useModel must be used within ModelProvider')
  return ctx
}

