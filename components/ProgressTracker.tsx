"use client"

// Using inline SVG icons to avoid external dependencies
const CheckIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
  </svg>
)

const ExclamationTriangleIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 20 20">
    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.19-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
  </svg>
)

interface Step {
  id: string
  label: string
  status: 'pending' | 'in_progress' | 'done' | 'error'
}

interface ProgressTrackerProps {
  steps: Step[]
  className?: string
}

export default function ProgressTracker({ steps, className = '' }: ProgressTrackerProps) {
  const activeStepIndex = steps.findIndex(step => step.status === 'in_progress')
  const activeStep = activeStepIndex >= 0 ? steps[activeStepIndex] : null
  const completedSteps = steps.filter(step => step.status === 'done').length
  const hasError = steps.some(step => step.status === 'error')
  const isProcessing = activeStep !== null
  const isComplete = completedSteps === steps.length && !hasError
  
  return (
    <div className={`space-y-3 ${className}`} aria-label="Operation progress tracker">
      {/* Current step status - improved typography and contrast */}
      <div className="text-center min-h-[1.5rem] flex items-center justify-center">
        {isProcessing ? (
          <div className="flex flex-col items-center space-y-1">
            <span className="text-base font-semibold text-slate-900 tracking-wide">
              Step {activeStepIndex + 1} of {steps.length}
            </span>
            <span className="text-sm font-medium text-slate-700 bg-white/40 px-2 py-1 rounded-md backdrop-blur-sm border border-white/30">
              {activeStep.label}
            </span>
          </div>
        ) : isComplete ? (
          <div className="flex items-center space-x-2">
            <CheckIcon className="w-5 h-5 text-emerald-600" />
            <span className="text-base font-semibold text-emerald-700 tracking-wide">
              All steps completed ({steps.length}/{steps.length})
            </span>
          </div>
        ) : hasError ? (
          <div className="flex items-center space-x-2">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-600" />
            <span className="text-base font-semibold text-red-700 tracking-wide">
              Error in process ({completedSteps}/{steps.length} completed)
            </span>
          </div>
        ) : steps.length > 0 ? (
          <span className="text-base font-medium text-slate-600 tracking-wide">
            Ready to start ({steps.length} steps)
          </span>
        ) : (
          <span className="text-base font-medium text-slate-600 tracking-wide">
            Choose an enhancement mode to begin
          </span>
        )}
      </div>
      
      {/* Progress bar - enhanced with better contrast */}
      {steps.length > 0 && (
        <div className="flex items-center space-x-4">
          <div className="flex-1 bg-slate-300/60 rounded-full h-3 overflow-hidden shadow-inner">
            <div
              className={`h-full transition-all duration-700 ease-out shadow-sm ${
                hasError ? 'bg-red-500' : 'gradient-primary'
              }`}
              style={{ width: `${(completedSteps / steps.length) * 100}%` }}
            />
          </div>
          <div className="bg-white/50 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-white/40 shadow-soft">
            <span className="text-sm font-bold text-slate-800 tabular-nums tracking-wider">
              {completedSteps}/{steps.length}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
