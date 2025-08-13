import type { VectorPoint, VectorEdge } from './types'

export interface WordCluster {
  id: string
  parentWord?: string
  parentClusterId?: string
  sourcePrompt: string
  words: string[]
  position: [number, number, number]
  connections: string[] // IDs of connected clusters
  createdAt: number
  depth: number // How many steps from root
  isExpanded: boolean // Whether user has explored this cluster
}

export interface NavigationNode {
  clusterId: string
  wordSelected: string
  timestamp: number
  depth: number
}

export interface ClusterNetwork {
  id: string
  rootPrompt: string
  clusters: Map<string, WordCluster>
  navigationHistory: NavigationNode[]
  activeClusterId: string
  createdAt: number
  lastModified: number
}

export interface ClusterVectorFrame {
  clusters: WordCluster[]
  points: VectorPoint[]
  edges: VectorEdge[]
  meta: {
    source: 'word-cluster'
    networkId: string
    createdAt: number
  }
}

export interface ClusterGenerationRequest {
  prompt: string
  parentWord?: string
  parentClusterId?: string
  model: string
  temperature: number
}

export interface ClusterGenerationResponse {
  words: string[]
  clusterId: string
  usage: {
    input_tokens: number
    output_tokens: number
  }
  systemPrompt?: string
  fallbackUsed?: boolean
}

export interface ClusterVisualizationOptions {
  layout: ClusterLayoutMode
  colorScheme: ColorScheme
  showConnections: boolean
  animateExpansion: boolean
  particleEffects: boolean
  clusterSpacing: number
  wordSpacing: number
}

export type ClusterLayoutMode = 
  | 'spherical'     // Words arranged in sphere around center
  | 'grid'          // Words in 3D grid formation
  | 'organic'       // Natural, physics-based positioning
  | 'hierarchical'  // Tree-like branching structure
  | 'radial'        // Clusters radiating from center

export type ColorScheme = 
  | 'semantic'      // Colors based on word meaning/similarity
  | 'depth'         // Colors based on navigation depth
  | 'rainbow'       // Full spectrum gradient
  | 'monochrome'    // Single hue variations
  | 'custom'        // User-defined palette

export interface ClusterEffects {
  particleTrails: boolean
  wordGlow: boolean
  connectionPulse: boolean
  hoverHighlight: boolean
  expansionAnimation: boolean
  cameraTransitions: boolean
}