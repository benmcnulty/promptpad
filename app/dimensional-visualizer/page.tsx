"use client"

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import Visualizer2D from '@/components/visualizer/Visualizer2D'
import ControlsPanel, { type ControlsState } from '@/components/visualizer/ControlsPanel'
import { vectorizeText } from '@/lib/vectorization'
import { useModel } from '@/components/ModelProvider'
import { useRefine } from '@/hooks/useRefine'

const Visualizer3D = process.env.NEXT_PUBLIC_ENABLE_R3F === '1'
  ? dynamic(() => import('@/components/visualizer/Visualizer3D.r3f'), { ssr: false, loading: () => null })
  : null

export default function DimensionalVisualizerPage() {
  const [input, setInput] = useState('Analyze customer sentiment across reviews for the last 90 days and surface themes.')
  const [output, setOutput] = useState('')
  const [controls, setControls] = useState<ControlsState>({ layout: 'radialSpiral', pointSize: 0.03, edgeOpacity: 0.35, animate: true })
  const { selectedModel } = useModel()
  const { run, state } = useRefine(selectedModel, 0.2)

  const visualText = output || `User: ${input}\nAI: The overall sentiment trends positive, with notable clusters around delivery speed, packaging quality, and support responsiveness. Some outliers indicate confusion around return policies.`
  const frame = useMemo(() => vectorizeText(visualText, controls.layout), [visualText, controls.layout])

  return (
    <div className="h-full flex flex-col gradient-surface overflow-hidden">
      <main role="main" aria-label="Dimensional Visualizer" className="flex-1 flex flex-col max-w-7xl mx-auto w-full gap-4 p-2 sm:p-4 min-h-0 overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gradient">Dimensional Visualizer</h1>
            <p className="text-slate-600">3D Vector Visualization Platform</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
          <div className="flex flex-col gap-3 min-h-0">
            <form
              className="glass-enhanced rounded-lg border border-white/30 backdrop-blur-md p-4 text-left"
              onSubmit={async (e) => {
                e.preventDefault()
                const res = await run('refine', input)
                if (res?.output) setOutput(res.output)
              }}
            >
              <label htmlFor="viz-input" className="block text-sm font-medium text-slate-700 mb-1">Enter text to visualize</label>
              <div className="flex gap-2">
                <input
                  id="viz-input"
                  name="viz-input"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type something..."
                  className="flex-1 px-3 py-2 rounded-lg text-sm bg-white text-slate-900 placeholder-slate-500 border border-slate-300 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                />
                <button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-60"
                  disabled={state.loading}
                >
                  {state.loading ? 'Generating…' : 'Visualize'}
                </button>
              </div>
              {state.error && (
                <div className="mt-2 text-sm text-red-700 bg-red-50 px-3 py-2 rounded border border-red-200">
                  {state.error}
                </div>
              )}
            </form>
            <div className="glass-enhanced rounded-lg border border-white/30 backdrop-blur-md p-4 min-h-0">
              <div className="font-semibold text-slate-700 mb-2">LLM Output</div>
              <pre className="whitespace-pre-wrap text-sm leading-5 bg-white/70 border border-gray-200 rounded-md p-3 max-h-[360px] overflow-auto">
                {output || 'Submit text to generate and visualize an LLM response.'}
              </pre>
            </div>
          </div>

          <div className="flex flex-col gap-3 min-h-0">
            <ControlsPanel value={controls} onChange={setControls} />
            <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-lg border border-white/50 p-3 relative overflow-hidden min-h-0">
              <div className="rounded-md overflow-hidden">
                {process.env.NEXT_PUBLIC_ENABLE_R3F === '1' && Visualizer3D ? (
                  <Visualizer3D frame={frame} pointSize={controls.pointSize} edgeOpacity={controls.edgeOpacity} animate={controls.animate} />
                ) : (
                  <Visualizer2D
                    frame={frame}
                    width={640}
                    height={360}
                    pointSize={controls.pointSize * 60}
                    edgeOpacity={controls.edgeOpacity}
                    animate={controls.animate}
                    speed={controls.speed}
                    trails={controls.trails}
                    trailStrength={controls.trailStrength}
                  />
                )}
              </div>
              <div className="mt-2 text-xs text-white/70">
                {process.env.NEXT_PUBLIC_ENABLE_R3F === '1' ? '3D interactive scene (OrbitControls enabled)' : '2D projection fallback; enable 3D with NEXT_PUBLIC_ENABLE_R3F=1'}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
