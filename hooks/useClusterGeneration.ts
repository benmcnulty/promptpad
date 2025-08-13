"use client"

import { useCallback, useState } from 'react'
import type { 
  WordCluster, 
  ClusterGenerationResponse,
  ClusterLayoutMode 
} from '@/lib/vectorization/cluster-types'

export interface GenerationState {
  loading: boolean
  error: string | null
  progress: number
  step: string
}

export function useClusterGeneration(model: string = 'gpt-oss:20b', temperature: number = 0.2) {
  const [state, setState] = useState<GenerationState>({
    loading: false,
    error: null,
    progress: 0,
    step: 'idle'
  })

  // Generate initial cluster from prompt
  const generateFromPrompt = useCallback(async (prompt: string): Promise<WordCluster | null> => {
    setState({ loading: true, error: null, progress: 0, step: 'Initializing request...' })

    try {
      // Simulate progress steps for better UX
      setState(prev => ({ ...prev, progress: 10, step: 'Connecting to AI model...' }))
      await new Promise(resolve => setTimeout(resolve, 200))

      setState(prev => ({ ...prev, progress: 15, step: 'Sending prompt to LLM...' }))

      const response = await fetch('/api/word-cluster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          model,
          temperature
        })
      })

      setState(prev => ({ ...prev, progress: 25, step: 'LLM processing...' }))

      if (!response.ok) {
        throw new Error(`Generation failed (${response.status})`)
      }

      setState(prev => ({ ...prev, progress: 60, step: 'Parsing word associations...' }))

      const data = await response.json() as ClusterGenerationResponse

      if (!data.words || data.words.length !== 12) {
        throw new Error('Invalid response: expected 12 words')
      }

      setState(prev => ({ ...prev, progress: 75, step: 'Validating word list...' }))

      // Validate words data
      const validWords = data.words.filter(word => 
        word && typeof word === 'string' && word.trim().length > 0
      )

      if (validWords.length === 0) {
        throw new Error('No valid words returned from API')
      }

      setState(prev => ({ ...prev, progress: 85, step: 'Creating cluster structure...' }))
      await new Promise(resolve => setTimeout(resolve, 300))

      // Create the cluster object
      const cluster: WordCluster = {
        id: data.clusterId,
        sourcePrompt: prompt,
        words: validWords,
        position: [0, 0, 0], // Root cluster at origin
        connections: [],
        createdAt: Date.now(),
        depth: 0,
        isExpanded: false
      }

      setState(prev => ({ ...prev, progress: 95, step: 'Finalizing cluster...' }))
      await new Promise(resolve => setTimeout(resolve, 200))

      setState(prev => ({ ...prev, progress: 100, step: 'Complete!' }))
      
      // Reset state after a brief delay
      setTimeout(() => {
        setState({ loading: false, error: null, progress: 0, step: 'idle' })
      }, 1000)

      return cluster
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Generation failed'
      setState({ loading: false, error: errorMessage, progress: 0, step: 'error' })
      return null
    }
  }, [model, temperature])

  // Expand a word from an existing cluster
  const expandWord = useCallback(async (
    word: string, 
    parentCluster: WordCluster,
    originalPrompt: string
  ): Promise<WordCluster | null> => {
    setState({ loading: true, error: null, progress: 0, step: `Expanding "${word}"...` })

    try {
      const response = await fetch('/api/expand-cluster', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          word,
          parentClusterId: parentCluster.id,
          originalPrompt,
          model,
          temperature
        })
      })

      if (!response.ok) {
        throw new Error(`Expansion failed (${response.status})`)
      }

      setState(prev => ({ ...prev, progress: 50, step: 'Processing expansion...' }))

      const data = await response.json() as ClusterGenerationResponse

      if (!data.words || !Array.isArray(data.words)) {
        throw new Error('Invalid response: no words returned')
      }

      setState(prev => ({ ...prev, progress: 80, step: 'Creating new cluster...' }))

      // Validate and filter words
      const validWords = data.words.filter(word => 
        word && typeof word === 'string' && word.trim().length > 0
      )

      if (validWords.length === 0) {
        throw new Error('No valid words returned from API')
      }

      // Calculate position for new cluster (offset from parent)
      const newPosition = calculateClusterPosition(parentCluster, parentCluster.depth + 1)

      // Create the new cluster
      const cluster: WordCluster = {
        id: data.clusterId,
        parentWord: word,
        parentClusterId: parentCluster.id,
        sourcePrompt: originalPrompt,
        words: validWords,
        position: newPosition,
        connections: [parentCluster.id],
        createdAt: Date.now(),
        depth: parentCluster.depth + 1,
        isExpanded: false
      }

      setState(prev => ({ ...prev, progress: 100, step: 'Complete' }))
      
      // Reset state after a brief delay
      setTimeout(() => {
        setState({ loading: false, error: null, progress: 0, step: 'idle' })
      }, 1000)

      return cluster
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Expansion failed'
      setState({ loading: false, error: errorMessage, progress: 0, step: 'error' })
      return null
    }
  }, [model, temperature])

  // Generate multiple clusters in batch (for advanced use cases)
  const generateBatch = useCallback(async (
    prompts: string[]
  ): Promise<WordCluster[]> => {
    setState({ loading: true, error: null, progress: 0, step: 'Generating batch...' })

    const results: WordCluster[] = []
    const total = prompts.length

    try {
      for (let i = 0; i < prompts.length; i++) {
        const progress = Math.round((i / total) * 100)
        setState(prev => ({ 
          ...prev, 
          progress, 
          step: `Generating cluster ${i + 1} of ${total}...` 
        }))

        const cluster = await generateFromPrompt(prompts[i])
        if (cluster) {
          // Adjust position for batch generation
          cluster.position = [
            Math.cos((i / total) * Math.PI * 2) * 3,
            Math.sin((i / total) * Math.PI * 2) * 3,
            0
          ]
          results.push(cluster)
        }
      }

      setState({ loading: false, error: null, progress: 100, step: 'Batch complete' })
      return results
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Batch generation failed'
      setState({ loading: false, error: errorMessage, progress: 0, step: 'error' })
      return results
    }
  }, [generateFromPrompt])

  return {
    state,
    generateFromPrompt,
    expandWord,
    generateBatch
  }
}

// Calculate position for a new cluster based on parent and depth
function calculateClusterPosition(parentCluster: WordCluster, depth: number): [number, number, number] {
  const angle = Math.random() * Math.PI * 2 // Random angle around parent
  const distance = 2 + depth * 0.5 // Increase distance with depth
  const heightVariation = (Math.random() - 0.5) * 1.5 // Random height variation

  return [
    parentCluster.position[0] + Math.cos(angle) * distance,
    parentCluster.position[1] + Math.sin(angle) * distance,
    parentCluster.position[2] + heightVariation
  ]
}