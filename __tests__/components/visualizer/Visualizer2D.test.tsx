import React from 'react'
import { render, screen } from '@testing-library/react'
import Visualizer2D from '@/components/visualizer/Visualizer2D'

const frame = {
  points: [
    { id: '0', token: 'a', position: [0,0,0], magnitude: 0.2 },
    { id: '1', token: 'b', position: [0.5,0.2,0.1], magnitude: 0.5 },
  ],
  edges: [{ from: '0', to: '1', weight: 1 }],
  meta: { source: 'test', createdAt: Date.now() }
} as any

describe('Visualizer2D', () => {
  it('renders canvas with aria label', () => {
    render(<Visualizer2D frame={frame} animate={false} trails={false} />)
    const canvas = screen.getByRole('img', { name: /vector visualization/i })
    expect(canvas).toBeInTheDocument()
  })
})
