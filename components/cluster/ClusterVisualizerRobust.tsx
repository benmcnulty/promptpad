"use client"

import React, { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import type { 
  ClusterVectorFrame, 
  ClusterVisualizationOptions
} from '@/lib/vectorization/cluster-types'

interface ClusterVisualizerProps {
  frame: ClusterVectorFrame | null
  options: ClusterVisualizationOptions
  activeClusterId?: string
  isLoading?: boolean
  loadingStep?: string
  loadingProgress?: number
  onWordClick?: (word: string, clusterId: string) => void
}

// Try to load the 3D component, but catch any import errors
const ClusterVisualizer3D = dynamic(
  () => import('./ClusterVisualizer3D').catch(() => {
    // If 3D fails to import, return a placeholder
    return { default: () => null }
  }), 
  { 
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center text-white/70">
        <div className="text-center">
          <div className="text-4xl mb-4">🔮</div>
          <p>Loading 3D visualization...</p>
        </div>
      </div>
    )
  }
)

export default function ClusterVisualizerRobust(props: ClusterVisualizerProps) {
  const [use3D, setUse3D] = useState(false) // Force 2D for debugging
  const [renderFallback, setRenderFallback] = useState(true) // Force 2D for debugging
  
  // Debug logging
  console.log('ClusterVisualizerRobust props:', {
    hasFrame: !!props.frame,
    clustersCount: props.frame?.clusters?.length || 0,
    pointsCount: props.frame?.points?.length || 0,
    isLoading: props.isLoading,
    use3D,
    renderFallback
  })

  // Monitor for React Three Fiber errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      if (event.message?.includes('ReactSharedInternals') || 
          event.message?.includes('ReactCurrentOwner') ||
          event.message?.includes('@react-three/fiber')) {
        console.warn('3D visualization failed, falling back to 2D')
        setUse3D(false)
        setRenderFallback(true)
      }
    }

    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])

  // If we should render fallback, show the 2D version
  if (renderFallback || !use3D) {
    return <Cluster2DFallback {...props} />
  }

  // Try to render 3D, but wrap in error boundary
  return (
    <div className="w-full h-full">
      <ErrorBoundary onError={() => setRenderFallback(true)}>
        <ClusterVisualizer3D {...props} />
      </ErrorBoundary>
    </div>
  )
}

// Simple error boundary component
class ErrorBoundary extends React.Component<
  { children: React.ReactNode, onError: () => void },
  { hasError: boolean }
> {
  constructor(props: any) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error) {
    console.warn('3D Visualization Error:', error)
    this.props.onError()
  }

  render() {
    if (this.state.hasError) {
      return null // Let parent handle fallback
    }
    return this.props.children
  }
}

// 2D Fallback component that works reliably
function Cluster2DFallback({
  frame,
  options,
  activeClusterId,
  isLoading,
  loadingStep,
  loadingProgress,
  onWordClick
}: ClusterVisualizerProps) {
  // Debug logging for 2D fallback
  console.log('Cluster2DFallback received:', {
    frame,
    clustersCount: frame?.clusters?.length || 0,
    pointsCount: frame?.points?.length || 0,
    isLoading,
    loadingStep
  })
  if (isLoading) {
    return (
      <div className="w-full h-full rounded-md overflow-hidden border border-white/20 flex items-center justify-center">
        <div className="text-white/70 text-center">
          <div className="text-4xl mb-4">⚡</div>
          <p className="text-sm mb-2">{loadingStep}</p>
          <div className="w-32 h-2 bg-gray-700 rounded-full mx-auto">
            <div 
              className="h-full bg-blue-500 rounded-full transition-all duration-300"
              style={{ width: `${loadingProgress || 0}%` }}
            />
          </div>
          <p className="text-xs mt-2">{Math.round(loadingProgress || 0)}%</p>
        </div>
      </div>
    )
  }

  if (!frame || !frame.clusters || frame.clusters.length === 0) {
    return (
      <div className="w-full h-full rounded-md overflow-hidden border border-white/30 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="text-4xl mb-4">🔮</div>
          <p className="font-medium text-lg text-white drop-shadow-lg">Generate your first cluster to begin visualization</p>
          <p className="text-cyan-100 text-sm mt-2 font-medium drop-shadow-md">Enter a concept in the left panel to start</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full rounded-md overflow-hidden border border-white/20 p-4">
      <div className="text-white text-center mb-4">
        <div className="text-4xl mb-2">📊</div>
        <p className="text-sm font-medium">Interactive Cluster Network</p>
        <p className="text-xs text-blue-200">2D visualization mode</p>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {frame.clusters.map((cluster, index) => (
          <div 
            key={cluster.id}
            className={`p-3 rounded-lg border transition-all duration-200 ${
              activeClusterId === cluster.id 
                ? 'bg-blue-600/20 border-blue-400 ring-2 ring-blue-400/50' 
                : 'bg-white/10 border-white/20 hover:bg-white/15'
            }`}
          >
            <div className="text-white font-semibold mb-2 flex items-center gap-2 drop-shadow-md">
              <span className="text-cyan-200">🔗</span>
              {cluster.parentWord || 'Root'} Cluster
              <span className="text-xs text-cyan-100 ml-auto font-medium drop-shadow-sm">
                Depth {cluster.depth} • {cluster.words.length} words
              </span>
            </div>
            
            <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
              {cluster.words.map((word, wordIndex) => (
                <button
                  key={`${cluster.id}_${wordIndex}`}
                  onClick={() => onWordClick?.(word, cluster.id)}
                  className="px-2 py-1 text-xs bg-white/30 hover:bg-cyan-500/50 text-white font-semibold rounded transition-all duration-200 hover:scale-105 active:scale-95 border border-white/20 hover:border-cyan-200/50 drop-shadow-sm"
                  title={`Click to expand "${word}"`}
                >
                  {word}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-cyan-100 mt-4 text-center font-semibold drop-shadow-sm">
        Clusters: {frame.clusters.length} | Words: {frame.points.length}
      </div>
    </div>
  )
}