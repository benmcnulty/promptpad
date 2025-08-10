import { render, screen } from '@testing-library/react'
import ProgressTracker from '@/components/ProgressTracker'

describe('ProgressTracker layout', () => {
  it('renders full labels without truncation', () => {
    const steps = [
      { id: '1', label: 'Validate input', status: 'done' as const },
      { id: '2', label: 'Prepare request', status: 'in_progress' as const },
      { id: '3', label: 'Call model', status: 'pending' as const },
      { id: '4', label: 'Process response', status: 'pending' as const },
      { id: '5', label: 'Updated output', status: 'pending' as const },
    ]
    render(<ProgressTracker steps={steps} />)
    steps.forEach(s => {
      expect(screen.getByText(s.label)).toBeInTheDocument()
    })
  })
})
