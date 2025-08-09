"use client"

interface Step {
  id: string
  label: string
  status: 'pending' | 'in_progress' | 'done' | 'error'
}

export default function ProgressTracker({ steps, className = '' }: { steps: Step[]; className?: string }) {
  return (
    <div className={`flex items-center space-x-4 text-sm ${className}`} aria-label="Refine progress tracker">
      {steps.map((s, idx) => (
        <div key={s.id} className="flex items-center">
          <span
            className={[
              'inline-block w-2 h-2 rounded-full mr-2',
              s.status === 'done' && 'bg-green-500',
              s.status === 'in_progress' && 'bg-yellow-500 animate-pulse',
              s.status === 'error' && 'bg-red-500',
              s.status === 'pending' && 'bg-gray-300',
            ].filter(Boolean).join(' ')}
            aria-label={`${s.label}: ${s.status}`}
          />
          <span className={s.status === 'error' ? 'text-red-600' : s.status === 'in_progress' ? 'text-gray-800' : 'text-gray-600'}>
            {s.label}
          </span>
          {idx < steps.length - 1 && <span className="mx-3 text-gray-300">→</span>}
        </div>
      ))}
    </div>
  )
}

