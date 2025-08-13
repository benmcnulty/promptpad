"use client"

import type { ClusterVectorFrame, ClusterVisualizationOptions } from '@/lib/vectorization/cluster-types'

interface FallbackVisualizerProps {
  frame: ClusterVectorFrame
  options: ClusterVisualizationOptions
  activeClusterId?: string
  onWordClick?: (word: string, clusterId: string) => void
}

export default function ClusterVisualizer3DFallback({ 
  frame, 
  options, 
  activeClusterId, 
  onWordClick 
}: FallbackVisualizerProps) {
  if (!frame || !frame.clusters || frame.clusters.length === 0) {
    return (
      <div className="w-full h-full rounded-md overflow-hidden border border-white/20 flex items-center justify-center">
        <div className="text-white/70 text-center">
          <div className="text-4xl mb-4">🔮</div>
          <p>Generate your first cluster to begin visualization</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full rounded-md overflow-hidden border border-white/20 p-4">
      <div className="text-white/70 text-center mb-4">
        <div className="text-4xl mb-2">📊</div>
        <p className="text-sm">2D Network Visualization</p>
        <p className="text-xs opacity-60">3D mode requires WebGL support</p>
      </div>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {frame.clusters.map((cluster, index) => (
          <div 
            key={cluster.id}
            className={`p-3 rounded-lg border ${
              activeClusterId === cluster.id 
                ? 'bg-blue-600/20 border-blue-400' 
                : 'bg-white/10 border-white/20'
            }`}
          >
            <div className="text-white font-medium mb-2">
              {cluster.parentWord || 'Root'} Cluster
              <span className="text-xs text-white/60 ml-2">
                Depth {cluster.depth}
              </span>
            </div>
            
            <div className="grid grid-cols-4 gap-2">
              {cluster.words.map((word, wordIndex) => (
                <button
                  key={`${cluster.id}_${wordIndex}`}
                  onClick={() => onWordClick?.(word, cluster.id)}
                  className="px-2 py-1 text-xs bg-white/20 hover:bg-white/30 text-white rounded transition-colors"
                >
                  {word}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="text-xs text-white/50 mt-4 text-center">
        Clusters: {frame.clusters.length} | Words: {frame.points.length}
      </div>
    </div>
  )
}