import { render, screen } from '@testing-library/react'
import ProgressTracker from '@/components/ProgressTracker'

describe('ProgressTracker layout', () => {
  it('shows current step and progress information', () => {
    const steps = [
      { id: '1', label: 'Validate input', status: 'done' as const },
      { id: '2', label: 'Prepare request', status: 'in_progress' as const },
      { id: '3', label: 'Call model', status: 'pending' as const },
      { id: '4', label: 'Process response', status: 'pending' as const },
      { id: '5', label: 'Updated output', status: 'pending' as const },
    ]
    render(<ProgressTracker steps={steps} />)
    
  // Should show current step information (text split across nodes)
  expect(screen.getByText((content, node) => /Step\s*2\s*of\s*5/.test(content))).toBeInTheDocument()
  expect(screen.getByText(/Prepare request/)).toBeInTheDocument()
    
    // Should show progress counter
    expect(screen.getByText('1/5')).toBeInTheDocument()
  })

  it('shows completion status when all steps are done', () => {
    const steps = [
      { id: '1', label: 'Validate input', status: 'done' as const },
      { id: '2', label: 'Prepare request', status: 'done' as const },
      { id: '3', label: 'Call model', status: 'done' as const },
    ]
    render(<ProgressTracker steps={steps} />)
    
  expect(screen.getByText((c) => /All steps completed/.test(c))).toBeInTheDocument()
  })

  it('shows error state when a step fails', () => {
    const steps = [
      { id: '1', label: 'Validate input', status: 'done' as const },
      { id: '2', label: 'Call model', status: 'error' as const },
      { id: '3', label: 'Process response', status: 'pending' as const },
    ]
    render(<ProgressTracker steps={steps} />)
    
  expect(screen.getByText((c) => /Error in process/.test(c))).toBeInTheDocument()
  })
})
