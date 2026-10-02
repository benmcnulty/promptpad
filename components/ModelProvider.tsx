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
  const selection = useRef({ model: DEFAULT_MODEL, endpointId: 'default', allowInitialDefault: true })
  const [preferencesLoaded, setPreferencesLoaded] = useState(false)
  const { endpoints } = useOllamaEndpoints()
  // Health/model metadata changes do not change the server catalog destinations.
  const endpointConfigKey = JSON.stringify(endpoints.map(({ id, label, url }) => ({ id, label, url })))
  const endpointConfigurations = useMemo(() => JSON.parse(endpointConfigKey) as Array<{
    id: string; label: string; url: string
  }>, [endpointConfigKey])
  // Default means the server-configured endpoint. A missing custom selection must fail explicitly.
  const selectedEndpointUrl = selectedEndpointId === 'default' ? undefined
    : endpoints.find(endpoint => endpoint.id === selectedEndpointId)?.url ?? null

  // Load preferences
  useEffect(() => {
    try {
      const storedModel = localStorage.getItem(MODEL_KEY)
      const storedEndpoint = localStorage.getItem(ENDPOINT_KEY)
      
      if (storedModel && typeof storedModel === 'string') {
        selection.current.model = storedModel
        selection.current.allowInitialDefault = false
        setSelected(storedModel)
      }
      if (storedEndpoint && typeof storedEndpoint === 'string') {
        selection.current.endpointId = storedEndpoint
        if (storedEndpoint !== 'default') selection.current.allowInitialDefault = false
        setSelectedEndpointId(storedEndpoint)
      }
    } catch {}
    setPreferencesLoaded(true)
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
      for (const endpoint of endpointConfigurations) {
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
      
      // Pick an installed server-default model only during first-use initialization.
      // Saved/custom selections and removed endpoints require a deliberate user choice.
      const current = selection.current
      const hasSelected = allModels.some(m => m.name === current.model && m.endpointId === current.endpointId)
      if (!hasSelected && current.allowInitialDefault && current.endpointId === 'default') {
        const defaultModels = allModels.filter(m => m.endpointId === 'default')
        const available = defaultModels.find(m => m.name === DEFAULT_MODEL) || defaultModels[0]
        if (available) {
          selection.current = { model: available.name, endpointId: 'default', allowInitialDefault: false }
          setSelected(available.name)
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
  }, [endpointConfigurations])

  useEffect(() => {
    if (!preferencesLoaded) return
    fetchModels()
    return () => {
      if (controller.current) controller.current.abort()
    }
  }, [fetchModels, preferencesLoaded])

  // Helper functions
  const getModelsByEndpoint = useCallback((endpointId: string) => {
    return models.filter(model => model.endpointId === endpointId)
  }, [models])

  const getAllAvailableModels = useCallback(() => {
    return models
  }, [models])

  const setSelectedModelWithEndpoint = useCallback((name: string, endpointId?: string) => {
    const chosenEndpoint = endpointId ?? models.find(m => m.name === name)?.endpointId ?? selection.current.endpointId
    selection.current = { model: name, endpointId: chosenEndpoint, allowInitialDefault: false }
    setSelected(name)
    setSelectedEndpointId(chosenEndpoint)
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

