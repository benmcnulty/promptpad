"use client"

import { useCallback, useEffect, useState } from 'react'
import type { 
  ClusterNetwork, 
  WordCluster, 
  NavigationNode,
  ClusterVectorFrame,
  ClusterLayoutMode
} from '@/lib/vectorization/cluster-types'
import type { VectorPoint, VectorEdge } from '@/lib/vectorization/types'

const STORAGE_KEY = 'ppviz:cluster-network:v1'

interface ClusterNetworkState {
  network: ClusterNetwork | null
  loading: boolean
  error: string | null
}

export function useClusterNetwork() {
  const [state, setState] = useState<ClusterNetworkState>({
    network: null,
    loading: false,
    error: null
  })

  // Load persisted network on mount (but allow manual override)
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        // Only auto-load if the network has actual clusters
        if (parsed.clusters && Object.keys(parsed.clusters).length > 0) {
          // Convert Map back from stored object
          const network: ClusterNetwork = {
            ...parsed,
            clusters: new Map(Object.entries(parsed.clusters || {}))
          }
          setState(prev => ({ ...prev, network }))
        }
      }
    } catch (error) {
      console.warn('Failed to load cluster network from storage:', error)
    }
  }, [])

  // Persist network changes
  const persistNetwork = useCallback((network: ClusterNetwork) => {
    try {
      // Convert Map to object for storage
      const toStore = {
        ...network,
        clusters: Object.fromEntries(network.clusters)
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toStore))
    } catch (error) {
      console.warn('Failed to persist cluster network:', error)
    }
  }, [])

  // Create a new network from initial prompt
  const createNetwork = useCallback((prompt: string): ClusterNetwork => {
    const network: ClusterNetwork = {
      id: `network_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      rootPrompt: prompt,
      clusters: new Map(),
      navigationHistory: [],
      activeClusterId: '',
      createdAt: Date.now(),
      lastModified: Date.now()
    }

    setState(prev => ({ ...prev, network }))
    persistNetwork(network)
    return network
  }, [persistNetwork])

  // Add a new cluster to the network
  const addCluster = useCallback((cluster: WordCluster) => {
    setState(prev => {
      if (!prev.network) return prev
      
      const updatedNetwork = {
        ...prev.network,
        clusters: new Map(prev.network.clusters.set(cluster.id, cluster)),
        activeClusterId: cluster.id,
        lastModified: Date.now()
      }
      
      persistNetwork(updatedNetwork)
      return { ...prev, network: updatedNetwork }
    })
  }, [persistNetwork])

  // Navigate to a cluster and record navigation history
  const navigateToCluster = useCallback((clusterId: string, selectedWord?: string) => {
    setState(prev => {
      if (!prev.network || !prev.network.clusters.has(clusterId)) return prev
      
      const navigationNode: NavigationNode = {
        clusterId,
        wordSelected: selectedWord || '',
        timestamp: Date.now(),
        depth: prev.network.clusters.get(clusterId)?.depth || 0
      }
      
      const updatedNetwork = {
        ...prev.network,
        activeClusterId: clusterId,
        navigationHistory: [...prev.network.navigationHistory, navigationNode],
        lastModified: Date.now()
      }
      
      persistNetwork(updatedNetwork)
      return { ...prev, network: updatedNetwork }
    })
  }, [persistNetwork])

  // Go back to a previous cluster in navigation history
  const navigateBack = useCallback((steps: number = 1) => {
    setState(prev => {
      if (!prev.network || prev.network.navigationHistory.length === 0) return prev
      
      const newHistoryLength = Math.max(0, prev.network.navigationHistory.length - steps)
      const newHistory = prev.network.navigationHistory.slice(0, newHistoryLength)
      const activeClusterId = newHistory.length > 0 
        ? newHistory[newHistory.length - 1].clusterId 
        : ''
      
      const updatedNetwork = {
        ...prev.network,
        activeClusterId,
        navigationHistory: newHistory,
        lastModified: Date.now()
      }
      
      persistNetwork(updatedNetwork)
      return { ...prev, network: updatedNetwork }
    })
  }, [persistNetwork])

  // Clear the current network
  const clearNetwork = useCallback(() => {
    setState(prev => ({ ...prev, network: null }))
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch (error) {
      console.warn('Failed to clear network storage:', error)
    }
  }, [])

  // Convert network to vector frame for visualization
  const getVectorFrame = useCallback((layoutMode: ClusterLayoutMode = 'spherical'): ClusterVectorFrame | null => {
    if (!state.network || !state.network.clusters || state.network.clusters.size === 0) {
      return null
    }

    const clusters = Array.from(state.network.clusters.values())
    if (clusters.length === 0) {
      return null
    }

    const points: VectorPoint[] = []
    const edges: VectorEdge[] = []

    // Create points for each word in each cluster
    clusters.forEach((cluster, clusterIndex) => {
      if (!cluster || !cluster.words || !Array.isArray(cluster.words)) {
        return
      }

      cluster.words.forEach((word, wordIndex) => {
        if (!word || typeof word !== 'string') {
          return
        }

        const position = calculateWordPosition(
          cluster, 
          wordIndex, 
          clusterIndex, 
          clusters.length, 
          layoutMode
        )
        
        points.push({
          id: `${cluster.id}_${wordIndex}`,
          token: word,
          position,
          magnitude: 0.5 + (cluster.depth * 0.1),
          group: cluster.id
        })
      })

      // Create edges between connected clusters
      if (cluster.connections && Array.isArray(cluster.connections)) {
        cluster.connections.forEach(connectedClusterId => {
          if (state.network!.clusters.has(connectedClusterId)) {
            // Connect first words of each cluster as a simple connection
            const fromId = `${cluster.id}_0`
            const toId = `${connectedClusterId}_0`
            
            // Only add edge if both points exist
            const fromExists = points.some(p => p.id === fromId)
            const toExists = points.some(p => p.id === toId) || 
                            clusters.some(c => c.id === connectedClusterId && c.words.length > 0)
            
            if (fromExists && toExists) {
              edges.push({
                from: fromId,
                to: toId,
                weight: 0.5
              })
            }
          }
        })
      }
    })

    // Validate we have valid data
    if (points.length === 0) {
      return null
    }

    return {
      clusters,
      points,
      edges,
      meta: {
        source: 'word-cluster',
        networkId: state.network.id,
        createdAt: state.network.createdAt
      }
    }
  }, [state.network])

  // Get current active cluster
  const activeCluster = state.network?.activeClusterId 
    ? state.network.clusters.get(state.network.activeClusterId) || null
    : null

  // Get navigation breadcrumbs
  const breadcrumbs = state.network?.navigationHistory.map(node => ({
    clusterId: node.clusterId,
    wordSelected: node.wordSelected,
    cluster: state.network?.clusters.get(node.clusterId)
  })) || []

  return {
    network: state.network,
    activeCluster,
    breadcrumbs,
    loading: state.loading,
    error: state.error,
    createNetwork,
    addCluster,
    navigateToCluster,
    navigateBack,
    clearNetwork,
    getVectorFrame
  }
}

// Calculate 3D position for a word within a cluster
function calculateWordPosition(
  cluster: WordCluster, 
  wordIndex: number, 
  clusterIndex: number, 
  totalClusters: number,
  layoutMode: ClusterLayoutMode
): [number, number, number] {
  // Validate inputs
  if (!cluster || !cluster.position || cluster.position.length !== 3) {
    return [0, 0, 0]
  }

  const baseX = cluster.position[0] || 0
  const baseY = cluster.position[1] || 0
  const baseZ = cluster.position[2] || 0
  const wordCount = cluster.words?.length || 1
  
  switch (layoutMode) {
    case 'spherical': {
      // Arrange words in a sphere around cluster center
      const phi = Math.acos(-1 + (2 * wordIndex) / wordCount)
      const theta = Math.sqrt(wordCount * Math.PI) * phi
      const radius = 0.8
      
      const x = baseX + radius * Math.cos(theta) * Math.sin(phi)
      const y = baseY + radius * Math.sin(theta) * Math.sin(phi)
      const z = baseZ + radius * Math.cos(phi)
      
      return [
        isNaN(x) ? baseX : x,
        isNaN(y) ? baseY : y,
        isNaN(z) ? baseZ : z
      ]
    }
    
    case 'grid': {
      // Arrange in a 3D grid
      const gridSize = Math.max(1, Math.ceil(Math.cbrt(wordCount)))
      const x = (wordIndex % gridSize) - gridSize / 2
      const y = (Math.floor(wordIndex / gridSize) % gridSize) - gridSize / 2
      const z = Math.floor(wordIndex / (gridSize * gridSize)) - gridSize / 2
      
      return [
        baseX + x * 0.3,
        baseY + y * 0.3,
        baseZ + z * 0.3
      ]
    }
    
    case 'radial': {
      // Arrange in concentric circles
      const angle = (wordIndex / Math.max(1, wordCount)) * Math.PI * 2
      const radius = 0.5 + (wordIndex % 3) * 0.3
      
      return [
        baseX + radius * Math.cos(angle),
        baseY + radius * Math.sin(angle),
        baseZ + (Math.sin(wordIndex) * 0.2)
      ]
    }
    
    case 'hierarchical': {
      // Tree-like arrangement
      const level = Math.floor(wordIndex / 3)
      const angleOffset = (wordIndex % 3) * (Math.PI * 2 / 3)
      const radius = 0.5 + level * 0.4
      
      return [
        baseX + radius * Math.cos(angleOffset),
        baseY + level * 0.5,
        baseZ + radius * Math.sin(angleOffset)
      ]
    }
    
    case 'organic':
    default: {
      // Default to simple circular arrangement with some randomness
      const angle = (wordIndex / Math.max(1, wordCount)) * Math.PI * 2
      const radius = 0.6
      const randomOffset = (wordIndex * 0.1) % 0.2 - 0.1
      
      return [
        baseX + radius * Math.cos(angle) + randomOffset,
        baseY + radius * Math.sin(angle) + randomOffset,
        baseZ + randomOffset
      ]
    }
  }
}