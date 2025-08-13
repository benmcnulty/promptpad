import React from 'react'
import { render } from '@testing-library/react'
import VectorPoints from '@/components/visualizer/VectorPoints'
import VectorEdges from '@/components/visualizer/VectorEdges'

const frame = {
  points: [
    { id: '0', token: 'a', position: [0,0,0], magnitude: 0.1 },
    { id: '1', token: 'b', position: [1,0,0], magnitude: 0.9 },
  ],
  edges: [{ from: '0', to: '1', weight: 1 }],
  meta: { source: 't', createdAt: Date.now() }
} as any

// Mock drei Line & three components if necessary
jest.mock('@react-three/drei', () => ({ Line: ({ children }: any) => <>{children}</> }))

describe('Vector 3D primitives', () => {
  it('renders VectorPoints and VectorEdges without crashing', () => {
  render(<><VectorPoints frame={frame} /><VectorEdges frame={frame} /></> as any)
  })
})
