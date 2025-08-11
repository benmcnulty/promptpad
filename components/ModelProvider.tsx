"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react'

export interface ModelInfo {
  name: string
  family?: string
  parameters?: string
  default?: boolean
}

interface ModelContextValue {
  models: ModelInfo[]
  selectedModel: string
  setSelectedModel: (name: string) => void
  loading: boolean
  error: string | null
  refresh: () => void
}

const DEFAULT_MODEL = 'gpt-oss:20b'
const MODEL_KEY = 'promptpad-model'

const ModelContext = createContext<ModelContextValue | null>(null)

export function ModelProvider({ children }: { children: ReactNode }) {
  const [models, setModels] = useState<ModelInfo[]>([])
  const [selectedModel, setSelected] = useState<string>(DEFAULT_MODEL)
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const controller = useRef<AbortController | null>(null)
  const mounted = useRef(false)

  // Load preference
  useEffect(() => {
    try {
      const stored = localStorage.getItem(MODEL_KEY)
      if (stored && typeof stored === 'string') {
        setSelected(stored)
      }
    } catch {}
  }, [])

  // Persist preference
  useEffect(() => {
    try { localStorage.setItem(MODEL_KEY, selectedModel) } catch {}
  }, [selectedModel])

  const fetchModels = useCallback(async () => {
    if (controller.current) controller.current.abort()
    const ctrl = new AbortController()
    controller.current = ctrl
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/models', { signal: ctrl.signal })
      if (!res.ok) throw new Error(`Models request failed (${res.status})`)
      const data = await res.json() as ModelInfo[]
      setModels(data)
      // Ensure selected model is valid; otherwise prefer default if present
      const hasSelected = data.some(m => m.name === selectedModel)
      const hasDefault = data.some(m => m.name === DEFAULT_MODEL)
      if (!hasSelected && hasDefault) setSelected(DEFAULT_MODEL)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load models')
    } finally {
      setLoading(false)
      controller.current = null
    }
  }, [selectedModel])

  useEffect(() => {
    if (mounted.current) return
    mounted.current = true
    fetchModels()
    return () => {
      if (controller.current) controller.current.abort()
      mounted.current = false
    }
  }, [fetchModels])

  const value = useMemo<ModelContextValue>(() => ({
    models,
    selectedModel,
    setSelectedModel: setSelected,
    loading,
    error,
    refresh: fetchModels,
  }), [models, selectedModel, loading, error, fetchModels])

  return <ModelContext.Provider value={value}>{children}</ModelContext.Provider>
}

export function useModel() {
  const ctx = useContext(ModelContext)
  if (!ctx) throw new Error('useModel must be used within ModelProvider')
  return ctx
}

