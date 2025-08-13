"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, ReactNode } from 'react'
import { OllamaClient } from '@/lib/ollama'
import { ModelInfo } from '@/components/ModelProvider'

export interface OllamaEndpoint {
  id: string
  label: string
  url: string
  isDefault: boolean
  healthStatus: 'healthy' | 'error' | 'checking'
  lastChecked: number
  models: ModelInfo[]
  errorMessage?: string
}

interface OllamaEndpointContextValue {
  endpoints: OllamaEndpoint[]
  addEndpoint: (label: string, url: string) => Promise<OllamaEndpoint>
  removeEndpoint: (id: string) => void
  updateEndpoint: (id: string, updates: Partial<OllamaEndpoint>) => void
  checkEndpointHealth: (id: string) => Promise<void>
  checkAllEndpointsHealth: () => Promise<void>
  getEndpointClient: (id: string) => OllamaClient | null
  getHealthyEndpoints: () => OllamaEndpoint[]
  loading: boolean
  error: string | null
}

const ENDPOINTS_KEY = 'promptpad-ollama-endpoints'
const DEFAULT_ENDPOINT_URL = 'http://localhost:11434'

const OllamaEndpointContext = createContext<OllamaEndpointContextValue | null>(null)

function generateId(): string {
  return Math.random().toString(36).substr(2, 9)
}

function createDefaultEndpoint(): OllamaEndpoint {
  return {
    id: 'default',
    label: 'Default (localhost)',
    url: DEFAULT_ENDPOINT_URL,
    isDefault: true,
    healthStatus: 'checking',
    lastChecked: 0,
    models: []
  }
}

export function OllamaEndpointProvider({ children }: { children: ReactNode }) {
  const [endpoints, setEndpoints] = useState<OllamaEndpoint[]>([createDefaultEndpoint()])
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const mounted = useRef(false)
  const checkingRef = useRef<Set<string>>(new Set())

  // Load endpoints from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(ENDPOINTS_KEY)
      if (stored) {
        const parsed = JSON.parse(stored) as OllamaEndpoint[]
        // Ensure we always have at least the default endpoint
        const hasDefault = parsed.some(ep => ep.isDefault)
        if (!hasDefault) {
          parsed.unshift(createDefaultEndpoint())
        }
        setEndpoints(parsed)
      }
    } catch (err) {
      console.warn('Failed to load endpoints from localStorage:', err)
      setEndpoints([createDefaultEndpoint()])
    }
  }, [])

  // Persist endpoints to localStorage
  const persistEndpoints = useCallback((newEndpoints: OllamaEndpoint[]) => {
    try {
      localStorage.setItem(ENDPOINTS_KEY, JSON.stringify(newEndpoints))
    } catch (err) {
      console.warn('Failed to persist endpoints to localStorage:', err)
    }
  }, [])

  // Get client for specific endpoint
  const getEndpointClient = useCallback((id: string): OllamaClient | null => {
    const endpoint = endpoints.find(ep => ep.id === id)
    if (!endpoint) return null
    return new OllamaClient(endpoint.url)
  }, [endpoints])

  // Check health of specific endpoint
  const checkEndpointHealth = useCallback(async (id: string) => {
    if (checkingRef.current.has(id)) return
    checkingRef.current.add(id)

    const endpoint = endpoints.find(ep => ep.id === id)
    if (!endpoint) {
      checkingRef.current.delete(id)
      return
    }

    setEndpoints(prev => prev.map(ep => 
      ep.id === id 
        ? { ...ep, healthStatus: 'checking' as const }
        : ep
    ))

    try {
      const client = new OllamaClient(endpoint.url)
      const isHealthy = await client.healthCheck()
      
      let models: ModelInfo[] = []
      let errorMessage: string | undefined

      if (isHealthy) {
        try {
          const ollamaModels = await client.listModels()
          models = ollamaModels.map(model => ({
            name: model.name,
            family: model.name.split(':')[0] || 'unknown',
            parameters: model.name.split(':')[1] || 'unknown'
          }))
        } catch (modelError) {
          console.warn(`Failed to fetch models for endpoint ${endpoint.label}:`, modelError)
          errorMessage = modelError instanceof Error ? modelError.message : 'Failed to fetch models'
        }
      } else {
        errorMessage = 'Health check failed'
      }

      setEndpoints(prev => prev.map(ep => 
        ep.id === id 
          ? { 
              ...ep, 
              healthStatus: isHealthy ? 'healthy' as const : 'error' as const,
              lastChecked: Date.now(),
              models,
              errorMessage
            }
          : ep
      ))
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Connection failed'
      setEndpoints(prev => prev.map(ep => 
        ep.id === id 
          ? { 
              ...ep, 
              healthStatus: 'error' as const,
              lastChecked: Date.now(),
              models: [],
              errorMessage
            }
          : ep
      ))
    } finally {
      checkingRef.current.delete(id)
    }
  }, [endpoints])

  // Check health of all endpoints
  const checkAllEndpointsHealth = useCallback(async () => {
    setLoading(true)
    setError(null)
    
    try {
      await Promise.all(endpoints.map(ep => checkEndpointHealth(ep.id)))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check endpoint health')
    } finally {
      setLoading(false)
    }
  }, [endpoints, checkEndpointHealth])

  // Add new endpoint
  const addEndpoint = useCallback(async (label: string, url: string): Promise<OllamaEndpoint> => {
    const id = generateId()
    const newEndpoint: OllamaEndpoint = {
      id,
      label,
      url: url.replace(/\/$/, ''), // Remove trailing slash
      isDefault: false,
      healthStatus: 'checking',
      lastChecked: 0,
      models: []
    }

    const updatedEndpoints = [...endpoints, newEndpoint]
    setEndpoints(updatedEndpoints)
    persistEndpoints(updatedEndpoints)

    // Check health of new endpoint
    await checkEndpointHealth(id)
    
    return newEndpoint
  }, [endpoints, persistEndpoints, checkEndpointHealth])

  // Remove endpoint
  const removeEndpoint = useCallback((id: string) => {
    const endpoint = endpoints.find(ep => ep.id === id)
    if (endpoint?.isDefault) {
      throw new Error('Cannot remove default endpoint')
    }

    const updatedEndpoints = endpoints.filter(ep => ep.id !== id)
    setEndpoints(updatedEndpoints)
    persistEndpoints(updatedEndpoints)
  }, [endpoints, persistEndpoints])

  // Update endpoint
  const updateEndpoint = useCallback((id: string, updates: Partial<OllamaEndpoint>) => {
    const updatedEndpoints = endpoints.map(ep => 
      ep.id === id ? { ...ep, ...updates } : ep
    )
    setEndpoints(updatedEndpoints)
    persistEndpoints(updatedEndpoints)
  }, [endpoints, persistEndpoints])

  // Get healthy endpoints
  const getHealthyEndpoints = useCallback(() => {
    return endpoints.filter(ep => ep.healthStatus === 'healthy')
  }, [endpoints])

  // Initial health check on mount
  useEffect(() => {
    if (mounted.current) return
    mounted.current = true
    
    // Small delay to allow UI to render before health checks
    const timer = setTimeout(() => {
      checkAllEndpointsHealth()
    }, 100)

    return () => {
      clearTimeout(timer)
      mounted.current = false
    }
  }, [checkAllEndpointsHealth])

  // Periodic health checks every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!document.hidden) {
        checkAllEndpointsHealth()
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [checkAllEndpointsHealth])

  // Update localStorage whenever endpoints change
  useEffect(() => {
    persistEndpoints(endpoints)
  }, [endpoints, persistEndpoints])

  const value = useMemo<OllamaEndpointContextValue>(() => ({
    endpoints,
    addEndpoint,
    removeEndpoint,
    updateEndpoint,
    checkEndpointHealth,
    checkAllEndpointsHealth,
    getEndpointClient,
    getHealthyEndpoints,
    loading,
    error
  }), [
    endpoints,
    addEndpoint,
    removeEndpoint,
    updateEndpoint,
    checkEndpointHealth,
    checkAllEndpointsHealth,
    getEndpointClient,
    getHealthyEndpoints,
    loading,
    error
  ])

  return (
    <OllamaEndpointContext.Provider value={value}>
      {children}
    </OllamaEndpointContext.Provider>
  )
}

export function useOllamaEndpoints() {
  const context = useContext(OllamaEndpointContext)
  if (!context) {
    throw new Error('useOllamaEndpoints must be used within OllamaEndpointProvider')
  }
  return context
}