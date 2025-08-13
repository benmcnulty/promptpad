"use client"

import { useState, useEffect } from 'react'
import { useClusterNetwork } from '@/hooks/useClusterNetwork'
import { useClusterGeneration } from '@/hooks/useClusterGeneration'
import { useModel } from '@/components/ModelProvider'
import ClusterDropdown from './cluster/ClusterDropdown'
import NetworkNavigator from './cluster/NetworkNavigator'
import dynamic from 'next/dynamic'
import VisualizationErrorBoundary from './cluster/VisualizationErrorBoundary'

const ClusterVisualizer = dynamic(() => import('./cluster/ClusterVisualizerRobust'), { 
  ssr: false, 
  loading: () => (
    <div className="h-full flex items-center justify-center text-white/70">
      <div className="text-center">
        <div className="text-4xl mb-4">🔮</div>
        <p>Loading visualization...</p>
      </div>
    </div>
  )
})
import EffectsPanel from './cluster/EffectsPanel'
import type { ClusterVisualizationOptions, ClusterLayoutMode } from '@/lib/vectorization/cluster-types'

const DEFAULT_VISUALIZATION_OPTIONS: ClusterVisualizationOptions = {
  layout: 'spherical',
  colorScheme: 'semantic',
  showConnections: true,
  animateExpansion: true,
  particleEffects: true,
  clusterSpacing: 2.0,
  wordSpacing: 0.8
}

export default function WordClusterBuilder() {
  const [prompt, setPrompt] = useState('')
  const [visualOptions, setVisualOptions] = useState<ClusterVisualizationOptions>(DEFAULT_VISUALIZATION_OPTIONS)
  const { selectedModel } = useModel()
  
  const {
    network,
    activeCluster,
    breadcrumbs,
    createNetwork,
    addCluster,
    navigateToCluster,
    navigateBack,
    clearNetwork,
    getVectorFrame
  } = useClusterNetwork()

  const generation = useClusterGeneration(selectedModel, 0.2)

  // Handle initial prompt submission
  const handleStartCluster = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!prompt.trim()) return

    try {
      // Create new network if none exists
      let currentNetwork = network
      if (!currentNetwork) {
        currentNetwork = createNetwork(prompt)
      }

      // Generate initial cluster
      const cluster = await generation.generateFromPrompt(prompt)
      if (cluster) {
        addCluster(cluster)
      }
    } catch (error) {
      console.error('Failed to start cluster:', error)
    }
  }

  // Handle word expansion from cluster
  const handleExpandWord = async (word: string, clusterId: string) => {
    if (!network) return

    const parentCluster = network.clusters.get(clusterId)
    if (!parentCluster) return

    try {
      const newCluster = await generation.expandWord(word, parentCluster, network.rootPrompt)
      if (newCluster) {
        addCluster(newCluster)
        navigateToCluster(newCluster.id, word)
      }
    } catch (error) {
      console.error('Failed to expand word:', error)
    }
  }

  // Get vector frame for visualization
  const vectorFrame = getVectorFrame(visualOptions.layout)

  return (
    <div className="h-full flex flex-col gradient-surface overflow-hidden">
      <main role="main" aria-label="Word Cluster Builder" className="flex-1 flex flex-col max-w-7xl mx-auto w-full gap-4 p-2 sm:p-4 min-h-0 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gradient">Word Cluster Builder</h1>
            <p className="text-slate-600">Interactive 3D word association networks</p>
          </div>
          {network && (
            <div className="flex gap-2">
              <button
                onClick={() => clearNetwork()}
                className="px-3 py-1 text-sm bg-red-100 hover:bg-red-200 text-red-700 rounded-md transition-colors"
              >
                Clear Network
              </button>
            </div>
          )}
        </div>

        {/* Main Interface - Always Present */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0 flex-1">
            
            {/* Left Panel - Navigation and Controls */}
            <div className="flex flex-col gap-4 min-h-0">
              
              {/* Initial Prompt Form - Always Available */}
              {!network && (
                <div className="glass-enhanced rounded-lg border border-white/30 backdrop-blur-md p-4">
                  <h3 className="font-semibold text-slate-800 mb-3">Start Your Word Network</h3>
                  <form onSubmit={handleStartCluster} className="flex flex-col gap-3">
                    <div>
                      <label htmlFor="cluster-prompt" className="block text-sm font-medium text-slate-700 mb-1">
                        Enter a concept or topic to explore
                      </label>
                      <input
                        id="cluster-prompt"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                        placeholder="e.g., artificial intelligence, ocean ecosystems..."
                        className="w-full px-3 py-2 rounded-lg text-sm bg-white text-slate-900 placeholder-slate-500 border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                        disabled={generation.state.loading}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!prompt.trim() || generation.state.loading}
                      className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                    >
                      {generation.state.loading ? generation.state.step : 'Generate Word Cluster'}
                    </button>
                  </form>
                </div>
              )}

              {/* Network Navigator */}
              {network && (
                <NetworkNavigator
                  network={network}
                  activeCluster={activeCluster}
                  breadcrumbs={breadcrumbs}
                  onNavigateToCluster={navigateToCluster}
                  onNavigateBack={navigateBack}
                />
              )}

              {/* Current Cluster Dropdown */}
              {activeCluster && (
                <ClusterDropdown
                  cluster={activeCluster}
                  onExpandWord={handleExpandWord}
                  isLoading={generation.state.loading}
                  loadingStep={generation.state.step}
                />
              )}

              {/* Effects Panel */}
              <EffectsPanel
                options={visualOptions}
                onChange={setVisualOptions}
              />
            </div>

            {/* Center/Right Panel - 3D Visualization */}
            <div className="lg:col-span-2 min-h-0">
              <div className="h-full bg-gradient-to-br from-indigo-900 to-purple-900 rounded-lg border border-white/50 p-3 relative overflow-hidden">
                <ClusterVisualizer
                  frame={vectorFrame}
                  options={visualOptions}
                  activeClusterId={activeCluster?.id}
                  isLoading={generation.state.loading}
                  loadingStep={generation.state.step}
                  loadingProgress={generation.state.progress}
                  onWordClick={(word, clusterId) => {
                    // Handle word clicks in visualization
                    console.log('Word clicked:', word, 'in cluster:', clusterId)
                  }}
                />
                
                {/* Visualization Info */}
                <div className="absolute bottom-3 left-3 text-xs text-white font-semibold bg-black/30 backdrop-blur-sm px-2 py-1 rounded drop-shadow-md border border-white/10">
                  {vectorFrame && (
                    <>
                      Clusters: {vectorFrame.clusters.length} | 
                      Words: {vectorFrame.points.length} | 
                      Connections: {vectorFrame.edges.length}
                    </>
                  )}
                  {!vectorFrame && (
                    <span className="text-cyan-100">No cluster data</span>
                  )}
                </div>
              </div>
            </div>
          </div>

        {/* Error Display */}
        {generation.state.error && (
          <div className="fixed bottom-4 right-4 bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg shadow-lg">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚠️</span>
              <div>
                <div className="font-medium">Generation Error</div>
                <div className="text-sm">{generation.state.error}</div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}