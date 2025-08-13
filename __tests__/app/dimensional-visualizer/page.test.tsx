import '@testing-library/jest-dom'
import { render, screen } from '@testing-library/react'
import { ModelProvider } from '@/components/ModelProvider'
import DimensionalVisualizerPage from '@/app/dimensional-visualizer/page'

// Smoke test for initial page shell (pre-3D integration)
describe('DimensionalVisualizerPage', () => {
  it('renders heading and mode toggle', () => {
    render(
      <ModelProvider>
        <DimensionalVisualizerPage />
      </ModelProvider>
    )
    expect(screen.getByRole('heading', { name: /Dimensional Visualizer/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Word Clusters/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Text Vectorization/i })).toBeInTheDocument()
  })
})
