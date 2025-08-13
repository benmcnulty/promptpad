import '@testing-library/jest-dom'
import { screen } from '@testing-library/react'
import { render } from '@/__tests__/utils/test-providers'
import DimensionalVisualizerPage from '@/app/dimensional-visualizer/page'

// Smoke test for initial page shell (pre-3D integration)
describe('DimensionalVisualizerPage', () => {
  it('renders heading and mode toggle', () => {
    render(<DimensionalVisualizerPage />, { wrapper: 'model' })
    expect(screen.getByRole('heading', { name: /Dimensional Visualizer/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Word Clusters/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Text Vectorization/i })).toBeInTheDocument()
  })
})
