import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import DimensionalVisualizerPage from '@/app/dimensional-visualizer/page'

// Smoke test for initial page shell (pre-3D integration)
describe('DimensionalVisualizerPage', () => {
  it('renders heading and platform subtitle', () => {
    render(<DimensionalVisualizerPage />)
    expect(screen.getByRole('heading', { name: /Dimensional Visualizer/i })).toBeInTheDocument()
    expect(screen.getByText(/3D Vector Visualization Platform/i)).toBeInTheDocument()
  })
})
