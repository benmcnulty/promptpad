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
    
    // Should show current step information
    expect(screen.getByText('Step 2 of 5: Prepare request')).toBeInTheDocument()
    
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
    
    expect(screen.getByText('✓ All steps completed (3/3)')).toBeInTheDocument()
  })

  it('shows error state when a step fails', () => {
    const steps = [
      { id: '1', label: 'Validate input', status: 'done' as const },
      { id: '2', label: 'Call model', status: 'error' as const },
      { id: '3', label: 'Process response', status: 'pending' as const },
    ]
    render(<ProgressTracker steps={steps} />)
    
    expect(screen.getByText('⚠ Error in process (1/3 completed)')).toBeInTheDocument()
  })
})
