"use client"

import { useEffect, useState } from 'react'
import type { LayoutMode } from '@/lib/vectorization'

export interface ControlsState {
  layout: LayoutMode
  pointSize: number
  edgeOpacity: number
  animate: boolean
  speed?: number
  trails?: boolean
  trailStrength?: number
}

const KEY = 'ppviz:v1:controls'

export default function ControlsPanel({ value, onChange }: { value?: Partial<ControlsState>, onChange: (s: ControlsState) => void }) {
  const [state, setState] = useState<ControlsState>({
    layout: value?.layout ?? 'radialSpiral',
    pointSize: value?.pointSize ?? 0.03,
    edgeOpacity: value?.edgeOpacity ?? 0.35,
    animate: value?.animate ?? true,
    speed: value?.speed ?? 1.0,
    trails: value?.trails ?? true,
    trailStrength: value?.trailStrength ?? 0.08,
  })

  // load persisted
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) {
        const parsed = JSON.parse(raw)
        setState((s) => ({ ...s, ...parsed }))
      }
    } catch {}
  }, [])

  // persist and notify
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(state)) } catch {}
    onChange(state)
  }, [state, onChange])

  return (
    <div className="glass-enhanced rounded-lg border border-white/30 backdrop-blur-md p-3 text-sm">
      <div className="font-semibold text-slate-800 mb-2">Controls</div>
      <div className="grid grid-cols-2 gap-3">
        <label className="flex flex-col gap-1">
          <span className="text-slate-600">Layout</span>
          <select
            className="border border-gray-300 rounded px-2 py-1"
            value={state.layout}
            onChange={(e) => setState({ ...state, layout: e.target.value as LayoutMode })}
          >
            <option value="radialSpiral">Radial Spiral</option>
            <option value="sequentialPath">Sequential Path</option>
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-slate-600">Point Size</span>
          <input
            type="range" min={0.01} max={0.08} step={0.005}
            value={state.pointSize}
            onChange={(e) => setState({ ...state, pointSize: Number(e.target.value) })}
          />
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-slate-600">Edge Opacity</span>
          <input
            type="range" min={0} max={1} step={0.05}
            value={state.edgeOpacity}
            onChange={(e) => setState({ ...state, edgeOpacity: Number(e.target.value) })}
          />
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={state.animate}
            onChange={(e) => setState({ ...state, animate: e.target.checked })}
          />
          <span className="text-slate-600">Animate</span>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-slate-600">Speed</span>
          <input
            type="range" min={0.2} max={3} step={0.1}
            value={state.speed}
            onChange={(e) => setState({ ...state, speed: Number(e.target.value) })}
          />
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!state.trails}
            onChange={(e) => setState({ ...state, trails: e.target.checked })}
          />
          <span className="text-slate-600">Trails</span>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-slate-600">Trail Strength</span>
          <input
            type="range" min={0.02} max={0.2} step={0.01}
            value={state.trailStrength}
            onChange={(e) => setState({ ...state, trailStrength: Number(e.target.value) })}
            disabled={!state.trails}
          />
        </label>
      </div>
    </div>
  )
}
