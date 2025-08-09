"use client"

import { useCallback, useMemo, useState } from 'react'

export type RefineMode = 'refine' | 'reinforce'

export interface RefineRequestBody {
  mode: RefineMode
  input?: string
  draft?: string
  model: string
  temperature: number
}

export interface UsageInfo {
  input_tokens: number
  output_tokens: number
}

export interface PatchOp {
  op: 'replace' | 'insert' | 'delete'
  from?: [number, number]
  at?: number
  to?: string
}

export interface RefineResponseBody {
  output: string
  usage: UsageInfo
  patch?: PatchOp[]
}

export type StepStatus = 'pending' | 'in_progress' | 'done' | 'error'

export interface ProgressStep {
  id: string
  label: string
  status: StepStatus
}

export interface RefineState {
  loading: boolean
  error: string | null
  usage: UsageInfo | null
  steps: ProgressStep[]
}

const baseSteps: ProgressStep[] = [
  { id: 'validate', label: 'Validate input', status: 'pending' },
  { id: 'prepare', label: 'Prepare request', status: 'pending' },
  { id: 'call', label: 'Call model', status: 'pending' },
  { id: 'process', label: 'Process response', status: 'pending' },
  { id: 'update', label: 'Update document', status: 'pending' },
]

function advance(steps: ProgressStep[], id: string, status: StepStatus): ProgressStep[] {
  return steps.map(s => (s.id === id ? { ...s, status } : s))
}

type RunResult = { output: string; patch?: PatchOp[]; systemPrompt?: string; fallbackUsed?: boolean }

export function useRefine(model: string = 'gpt-oss:20b', temperature: number = 0.2) {
  const [state, setState] = useState<RefineState>({
    loading: false,
    error: null,
    usage: null,
    steps: baseSteps,
  })

  const reset = useCallback(() => {
    setState({ loading: false, error: null, usage: null, steps: baseSteps })
  }, [])

  const run = useCallback(async (mode: RefineMode, text: string): Promise<RunResult | null> => {
    const body: RefineRequestBody = {
      mode,
      model,
      temperature,
      ...(mode === 'refine' ? { input: text } : { draft: text }),
    }

    // Start
    let steps = baseSteps
    setState({ loading: true, error: null, usage: null, steps: advance(steps, 'validate', 'in_progress') })

    // Validate
    if (!text || text.trim() === '') {
      steps = advance(steps, 'validate', 'error')
      setState({ loading: false, error: 'Text is required', usage: null, steps })
      return null
    }
    steps = advance(steps, 'validate', 'done')
    steps = advance(steps, 'prepare', 'in_progress')
    setState(prev => ({ ...prev, steps }))

    // Prepare
    try {
      // Nothing heavy here yet
      steps = advance(steps, 'prepare', 'done')
      steps = advance(steps, 'call', 'in_progress')
      setState(prev => ({ ...prev, steps }))

      const res = await fetch('/api/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        throw new Error(`Refine request failed (${res.status})`)
      }

      const data = await res.json() as RefineResponseBody & { systemPrompt?: string; fallbackUsed?: boolean }

      steps = advance(steps, 'call', 'done')
      steps = advance(steps, 'process', 'in_progress')
      setState(prev => ({ ...prev, steps }))

      const { output, usage, patch } = data
      steps = advance(steps, 'process', 'done')
      steps = advance(steps, 'update', 'in_progress')
      setState(prev => ({ ...prev, usage, steps }))

      steps = advance(steps, 'update', 'done')
      setState(prev => ({ ...prev, loading: false, steps }))
      return { output, patch, systemPrompt: data.systemPrompt, fallbackUsed: data.fallbackUsed }
    } catch (err) {
      steps = advance(steps, 'call', 'error')
      const msg = err instanceof Error ? err.message : 'Unexpected error'
      setState({ loading: false, error: msg, usage: null, steps })
      return null
    }
  }, [model, temperature])

  const statusSummary = useMemo(() => {
    const current = state.steps.find(s => s.status === 'in_progress')
    return current?.label ?? (state.error ? 'Error' : state.loading ? 'Working...' : 'Idle')
  }, [state])

  return {
    state,
    statusSummary,
    run,
    reset,
  }
}
