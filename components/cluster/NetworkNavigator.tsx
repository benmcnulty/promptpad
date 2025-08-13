"use client"

import { useMemo } from 'react'
import type { ClusterNetwork, WordCluster } from '@/lib/vectorization/cluster-types'

interface Breadcrumb {
  clusterId: string
  wordSelected: string
  cluster?: WordCluster
}

interface NetworkNavigatorProps {
  network: ClusterNetwork
  activeCluster: WordCluster | null
  breadcrumbs: Breadcrumb[]
  onNavigateToCluster: (clusterId: string, selectedWord?: string) => void
  onNavigateBack: (steps?: number) => void
}

export default function NetworkNavigator({
  network,
  activeCluster,
  breadcrumbs,
  onNavigateToCluster,
  onNavigateBack
}: NetworkNavigatorProps) {
  const clusters = Array.from(network.clusters.values())
  
  // Calculate network statistics
  const networkStats = useMemo(() => {
    const totalWords = clusters.reduce((sum, cluster) => sum + cluster.words.length, 0)
    const maxDepth = Math.max(...clusters.map(c => c.depth))
    const totalConnections = clusters.reduce((sum, cluster) => sum + cluster.connections.length, 0)
    
    return {
      clusterCount: clusters.length,
      totalWords,
      maxDepth,
      totalConnections: totalConnections / 2 // Divide by 2 since connections are bidirectional
    }
  }, [clusters])

  const handleClusterClick = (cluster: WordCluster) => {
    onNavigateToCluster(cluster.id)
  }

  const handleBreadcrumbClick = (index: number) => {
    const stepsBack = breadcrumbs.length - index
    if (stepsBack > 0) {
      onNavigateBack(stepsBack)
    }
  }

  const getClusterDisplayName = (cluster: WordCluster) => {
    if (cluster.parentWord) {
      return cluster.parentWord
    }
    return 'Root'
  }

  const getDepthColor = (depth: number) => {
    const colors = [
      'bg-blue-100 text-blue-800 border-blue-200',      // Depth 0
      'bg-green-100 text-green-800 border-green-200',   // Depth 1
      'bg-purple-100 text-purple-800 border-purple-200', // Depth 2
      'bg-orange-100 text-orange-800 border-orange-200', // Depth 3
      'bg-pink-100 text-pink-800 border-pink-200',      // Depth 4+
    ]
    return colors[Math.min(depth, colors.length - 1)]
  }

  return (
    <div className="glass-enhanced rounded-lg border border-white/30 backdrop-blur-md p-4">
      
      {/* Network Overview */}
      <div className="mb-4">
        <h3 className="font-semibold text-slate-800 mb-2">Network Overview</h3>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-slate-50 p-2 rounded">
            <div className="font-medium text-slate-600">Clusters</div>
            <div className="text-lg font-bold text-slate-800">{networkStats.clusterCount}</div>
          </div>
          <div className="bg-slate-50 p-2 rounded">
            <div className="font-medium text-slate-600">Total Words</div>
            <div className="text-lg font-bold text-slate-800">{networkStats.totalWords}</div>
          </div>
          <div className="bg-slate-50 p-2 rounded">
            <div className="font-medium text-slate-600">Max Depth</div>
            <div className="text-lg font-bold text-slate-800">{networkStats.maxDepth}</div>
          </div>
          <div className="bg-slate-50 p-2 rounded">
            <div className="font-medium text-slate-600">Connections</div>
            <div className="text-lg font-bold text-slate-800">{networkStats.totalConnections}</div>
          </div>
        </div>
      </div>

      {/* Breadcrumb Navigation */}
      {breadcrumbs.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium text-slate-700 mb-2">Navigation Path</h4>
          <div className="flex flex-wrap gap-1">
            {breadcrumbs.map((breadcrumb, index) => (
              <div key={`${breadcrumb.clusterId}-${index}`} className="flex items-center">
                <button
                  onClick={() => handleBreadcrumbClick(index)}
                  className={`px-2 py-1 text-xs rounded border transition-colors ${
                    index === breadcrumbs.length - 1
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'
                  }`}
                  title={`Navigate to ${breadcrumb.wordSelected || 'cluster'}`}
                >
                  {breadcrumb.wordSelected || `Cluster ${index + 1}`}
                </button>
                {index < breadcrumbs.length - 1 && (
                  <span className="mx-1 text-slate-400">→</span>
                )}
              </div>
            ))}
          </div>
          
          {breadcrumbs.length > 1 && (
            <button
              onClick={() => onNavigateBack(1)}
              className="mt-2 text-xs text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Go back one step
            </button>
          )}
        </div>
      )}

      {/* Cluster List */}
      <div className="mb-4">
        <h4 className="text-sm font-medium text-slate-700 mb-2">All Clusters</h4>
        <div className="space-y-2 max-h-48 overflow-y-auto">
          {clusters
            .sort((a, b) => a.depth - b.depth || a.createdAt - b.createdAt)
            .map((cluster) => (
              <button
                key={cluster.id}
                onClick={() => handleClusterClick(cluster)}
                className={`w-full p-2 text-left rounded-md border transition-all duration-200 ${
                  activeCluster?.id === cluster.id
                    ? 'bg-blue-50 border-blue-300 text-blue-800'
                    : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`px-1.5 py-0.5 text-xs rounded border ${getDepthColor(cluster.depth)}`}>
                      D{cluster.depth}
                    </div>
                    <span className="font-medium text-sm">
                      {getClusterDisplayName(cluster)}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {cluster.words.length} words
                  </div>
                </div>
                
                {cluster.parentWord && (
                  <div className="mt-1 text-xs text-gray-500 ml-8">
                    from {cluster.parentWord}
                  </div>
                )}
              </button>
            ))
          }
        </div>
      </div>

      {/* Quick Actions */}
      <div className="border-t border-gray-200 pt-3">
        <h4 className="text-sm font-medium text-slate-700 mb-2">Quick Actions</h4>
        <div className="space-y-1">
          {clusters.length > 1 && (
            <button
              onClick={() => {
                const rootCluster = clusters.find(c => c.depth === 0)
                if (rootCluster) onNavigateToCluster(rootCluster.id)
              }}
              className="w-full text-left text-xs text-blue-600 hover:text-blue-800 py-1"
            >
              🏠 Go to root cluster
            </button>
          )}
          
          {breadcrumbs.length > 0 && (
            <button
              onClick={() => onNavigateBack(breadcrumbs.length)}
              className="w-full text-left text-xs text-orange-600 hover:text-orange-800 py-1"
            >
              ⏪ Reset to beginning
            </button>
          )}
          
          <div className="text-xs text-gray-500 py-1">
            💡 Click any cluster to jump to it
          </div>
        </div>
      </div>

      {/* Network Info */}
      <div className="mt-3 pt-2 border-t border-gray-200 text-xs text-gray-500">
        <div>Root: {network.rootPrompt}</div>
        <div>Created: {new Date(network.createdAt).toLocaleString()}</div>
        <div>Network ID: {network.id.slice(-8)}</div>
      </div>
    </div>
  )
}