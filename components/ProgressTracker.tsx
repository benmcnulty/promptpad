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
  compact?: boolean
}

export default function ProgressTracker({ steps, className = '', compact = false }: ProgressTrackerProps) {
  const activeStep = steps.findIndex(step => step.status === 'in_progress')
  const completedSteps = steps.filter(step => step.status === 'done').length
  const hasError = steps.some(step => step.status === 'error')
  
  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`} aria-label="Refine progress tracker">
        <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ease-out ${
              hasError ? 'bg-red-500' : 'gradient-primary'
            }`}
            style={{ width: `${(completedSteps / steps.length) * 100}%` }}
          />
        </div>
        <span className="text-xs font-medium text-slate-600 min-w-0 whitespace-nowrap">
          {completedSteps}/{steps.length}
        </span>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`} aria-label="Refine progress tracker">
      {/* Progress bar */}
      <div className="flex items-center space-x-2">
        <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ease-out ${
              hasError ? 'bg-red-500' : 'gradient-primary'
            }`}
            style={{ width: `${(completedSteps / steps.length) * 100}%` }}
          />
        </div>
        <span className="text-sm font-semibold text-slate-700 min-w-0">
          {completedSteps}/{steps.length}
        </span>
      </div>
      
      {/* Step indicators */}
      <div className="flex items-center justify-between">
        {steps.map((step, idx) => {
          const isActive = step.status === 'in_progress'
          const isCompleted = step.status === 'done'
          const hasError = step.status === 'error'
          const isPending = step.status === 'pending'
          
          return (
            <div key={step.id} className="flex flex-col items-center space-y-1 min-w-0 flex-1">
              {/* Icon */}
              <div className={`
                relative flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300
                ${
                  isCompleted
                    ? 'gradient-primary text-white shadow-soft'
                    : hasError
                    ? 'bg-red-500 text-white shadow-soft'
                    : isActive
                    ? 'progress-step-active shadow-soft animate-pulse-glow'
                    : 'bg-slate-100 text-slate-400 border border-slate-200'
                }
              `}>
                {isCompleted ? (
                  <CheckIcon className="w-4 h-4" />
                ) : hasError ? (
                  <ExclamationTriangleIcon className="w-4 h-4" />
                ) : (
                  <span className="text-xs font-bold">{idx + 1}</span>
                )}
              </div>
              
              {/* Label */}
              <span className={`
                text-xs text-center font-medium transition-colors duration-200 leading-tight max-w-[6rem] px-1 break-words
                ${
                  isCompleted
                    ? 'progress-step-label-completed'
                    : hasError
                    ? 'text-red-600'
                    : isActive
                    ? 'progress-step-label-active'
                    : 'progress-step-label-pending'
                }
              `}>
                {step.label}
              </span>
              
              {/* Connection line */}
              {idx < steps.length - 1 && (
                <div className={`
                  absolute top-4 left-1/2 w-full h-0.5 -z-10 transition-colors duration-300
                  ${
                    steps[idx + 1].status === 'done' || steps[idx + 1].status === 'in_progress'
                      ? 'progress-step-connection-active'
                      : 'progress-step-connection-inactive'
                  }
                `} style={{ transform: 'translateX(50%)' }} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

