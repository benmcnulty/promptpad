import React from 'react'
import { render } from '@testing-library/react'
import VectorEdges from '@/components/visualizer/VectorEdges'

const frame = {
  points: [
    { id: '0', token: 'a', position: [0,0,0], magnitude: 0.1 },
    { id: '1', token: 'b', position: [1,0,0], magnitude: 0.9 },
  ],
  edges: [{ from: '0', to: '1', weight: 1 }],
  meta: { source: 't', createdAt: Date.now() }
} as any

// Assert the line data sent to the GPU boundary. Instance positioning and
// updates are exercised with real Three objects in SceneLogic.test.tsx.
jest.mock('@react-three/drei', () => ({ Line: ({ points, opacity }: any) => <div data-testid="line" data-points={JSON.stringify(points)} data-opacity={opacity} /> }))

describe('Vector 3D primitives', () => {
  it('passes the actual endpoint positions and opacity to the line boundary', () => {
    const { getByTestId } = render(<VectorEdges frame={frame} opacity={0.6} />)
    expect(getByTestId('line')).toHaveAttribute('data-points', '[[0,0,0],[1,0,0]]')
    expect(getByTestId('line')).toHaveAttribute('data-opacity', '0.6')
  })
  it('filters edges with a missing endpoint rather than passing invalid coordinates', () => {
    const { queryByTestId } = render(<VectorEdges frame={{ ...frame, edges: [{ from: 'missing', to: '1', weight: 1 }] }} />)
    expect(queryByTestId('line')).not.toBeInTheDocument()
  })
})
