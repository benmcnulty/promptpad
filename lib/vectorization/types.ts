export interface VectorPoint {
  id: string
  token: string
  position: [number, number, number]
  magnitude?: number
  group?: string
}

export interface VectorEdge {
  from: string
  to: string
  weight?: number
}

export interface VectorFrameMeta {
  source: 'refine' | 'reinforce' | 'spec' | 'demo'
  createdAt: number
}

export interface VectorFrame {
  points: VectorPoint[]
  edges: VectorEdge[]
  meta: VectorFrameMeta
}

export type LayoutMode = 'radialSpiral' | 'sequentialPath'

