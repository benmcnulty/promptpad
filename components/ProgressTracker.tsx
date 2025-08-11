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
  const activeStepIndex = steps.findIndex(step => step.status === 'in_progress')
  const activeStep = activeStepIndex >= 0 ? steps[activeStepIndex] : null
  const completedSteps = steps.filter(step => step.status === 'done').length
  const hasError = steps.some(step => step.status === 'error')
  
  if (compact) {
    return (
      <div className={`flex items-center space-x-2 ${className}`} aria-label="Operation progress tracker">
        <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
          <div 
            className={`h-full transition-all duration-500 ease-out ${
              hasError ? 'bg-red-500' : 'gradient-primary'
            }`}
            style={{ width: `${(completedSteps / steps.length) * 100}%` }}
          />
        </div>
        <span className="text-xs font-medium text-slate-600 min-w-0 whitespace-nowrap">
          {activeStep ? `Step ${activeStepIndex + 1} of ${steps.length}` : `${completedSteps}/${steps.length}`}
        </span>
      </div>
    )
  }

  return (
    <div className={`space-y-3 ${className}`} aria-label="Operation progress tracker">
      {/* Current step status */}
      {activeStep && (
        <div className="text-center mb-2">
          <span className="text-sm font-medium text-slate-700">
            Step {activeStepIndex + 1} of {steps.length}: {activeStep.label}
          </span>
        </div>
      )}
      
      {/* Primary progress bar */}
      <div className="flex items-center space-x-2">
        <div className="flex-1 bg-slate-200 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ease-out ${hasError ? 'bg-red-500' : 'gradient-primary'}`}
            style={{ width: `${(completedSteps / steps.length) * 100}%` }}
          />
        </div>
        <span className="text-sm font-semibold text-slate-700 min-w-0">{completedSteps}/{steps.length}</span>
      </div>

      {/* Icon row with single connector behind */}
      <div className="relative px-2">
        {/* Background line between step centers only */}
        {steps.length > 1 && (
          <div className="absolute left-6 top-1/2 h-0.5 bg-slate-200 -translate-y-1/2" 
               style={{ width: `calc(100% - 3rem)` }} />
        )}
        {/* Progress line - only spans between completed step connections */}
        {steps.length > 1 && (
          <div
            className={`absolute left-6 top-1/2 h-0.5 -translate-y-1/2 transition-all duration-500 ${hasError ? 'bg-red-500' : 'gradient-primary'}`}
            style={{ 
              width: `calc((100% - 3rem) * ${Math.max(0, Math.min(1, (completedSteps - 1) / (steps.length - 1)))})` 
            }}
          />
        )}
        <div className="flex justify-between items-center">
          {steps.map((step, idx) => {
            const isActive = step.status === 'in_progress'
            const isCompleted = step.status === 'done'
            const hasError = step.status === 'error'
            return (
              <div key={step.id} className="relative flex items-center justify-center w-8 h-8">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full transition-all duration-300
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
              </div>
            )
          })}
        </div>
      </div>

      {/* Labels row */}
      <div className="flex justify-between mt-1 px-2">
        {steps.map((step) => {
          const isActive = step.status === 'in_progress'
          const isCompleted = step.status === 'done'
          const hasError = step.status === 'error'
          return (
            <span
              key={step.id}
              className={`text-[9px] xs:text-[10px] sm:text-xs md:text-sm text-center font-medium leading-snug max-w-[4.5rem] xs:max-w-[5.5rem] sm:max-w-none flex-1 mx-0.5 px-0.5 xs:px-1 min-h-[1.25rem] xs:min-h-[1.5rem] flex items-center justify-center
                ${
                  isCompleted
                    ? 'progress-step-label-completed'
                    : hasError
                    ? 'text-red-600 label-contrast'
                    : isActive
                    ? 'progress-step-label-active'
                    : 'progress-step-label-pending'
                }
              `}
            >
              {step.label}
            </span>
          )
        })}
      </div>
    </div>
  )
}
