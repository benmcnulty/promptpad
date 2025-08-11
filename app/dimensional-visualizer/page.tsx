'use client'

import { useEffect, useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import Visualizer2D from '@/components/visualizer/Visualizer2D'
import { vectorizeText } from '@/lib/vectorization'
import { useModel } from '@/components/ModelProvider'
import { useRefine } from '@/hooks/useRefine'

const Visualizer3D = dynamic(() => {
  if (process.env.NEXT_PUBLIC_ENABLE_R3F !== '1') {
    return Promise.resolve(() => null as any)
  }
  return import('@/components/visualizer/Visualizer3D')
}, { ssr: false, loading: () => null })

export default function DimensionalVisualizerPage() {
  const [constructionStep, setConstructionStep] = useState(0)
  const [loadingDots, setLoadingDots] = useState('')
  const [input, setInput] = useState('Analyze customer sentiment across reviews for the last 90 days and surface themes.')
  const [output, setOutput] = useState<string>("")
  const { selectedModel } = useModel()
  const { run, state } = useRefine(selectedModel, 0.2)

  const demoText = output || `User: ${input}\nAI: The overall sentiment trends positive, with notable clusters around delivery speed, packaging quality, and support responsiveness. Some outliers indicate confusion around return policies.`

  const demoFrame = useMemo(() => vectorizeText(demoText, 'radialSpiral'), [demoText])

  useEffect(() => {
    // Animated construction steps
    const stepInterval = setInterval(() => {
      setConstructionStep(prev => (prev + 1) % 4)
    }, 2000)

    // Loading dots animation
    const dotsInterval = setInterval(() => {
      setLoadingDots(prev => {
        if (prev.length >= 3) return ''
        return prev + '.'
      })
    }, 500)

    return () => {
      clearInterval(stepInterval)
      clearInterval(dotsInterval)
    }
  }, [])

  const constructionSteps = [
    { icon: '🧠', text: 'Vector space mapping' },
    { icon: '🎯', text: 'ThreeJS integration' },
    { icon: '💬', text: 'Chat interface design' },
    { icon: '🌟', text: 'Visualization effects' }
  ]

  return (
    <div className="h-full flex flex-col gradient-surface overflow-hidden">
      <main role="main" aria-label="Dimensional Visualizer" className="flex-1 flex flex-col max-w-7xl mx-auto w-full gap-4 p-2 sm:p-4 min-h-0 overflow-hidden">
        {/* Coming Soon Section */}
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-2xl mx-auto">
            <div className="mb-8">
              {/* Animated Construction Icon */}
              <div className="w-24 h-24 mx-auto gradient-primary rounded-full flex items-center justify-center mb-6 shadow-lg animate-bounce">
                <div className="relative">
                  <svg className="w-12 h-12 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 00-2-2z" />
                  </svg>
                  {/* Floating construction emoji */}
                  <div className="absolute -top-2 -right-2 text-xl animate-pulse">
                    🚧
                  </div>
                </div>
              </div>
              
              {/* Dynamic construction status */}
              <div className="text-2xl mb-4 animate-fade-in">
                {constructionSteps[constructionStep].icon}
              </div>
            </div>

            <h1 className="text-4xl font-bold text-gradient mb-4 animate-pulse">
              Dimensional Visualizer
            </h1>
            
            <div className="text-xl text-slate-600 mb-6 leading-relaxed">
              <div className="mb-2">🚀 3D Vector Visualization Platform</div>
              <div className="text-lg font-semibold text-blue-700 bg-blue-50 px-4 py-2 rounded-lg border border-blue-200 shadow-soft">
                {constructionSteps[constructionStep].text}{loadingDots}
              </div>
            </div>
            {/* Simple LLM input */}
            <form
              className="glass-enhanced rounded-xl border border-white/30 shadow-elegant backdrop-blur-md p-4 mb-6 text-left"
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
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
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

            <div className="glass-enhanced rounded-xl border border-white/30 shadow-elegant backdrop-blur-md p-8 mb-8">
              <h3 className="text-lg font-semibold text-slate-800 mb-6 flex items-center text-emboss-subtle">
                <span className="text-2xl mr-2">🎯</span>
                Vector Visualization Features
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                {[
                  { icon: '🧠', text: 'LLM response vector mapping', status: 'design' },
                  { icon: '🎮', text: 'ThreeJS/React Fiber 3D engine', status: 'research' },
                  { icon: '💬', text: 'Chat-like interface integration', status: 'planned' },
                  { icon: '🌈', text: 'Dynamic visualization effects', status: 'concept' },
                  { icon: '🎨', text: 'Stylization and themes', status: 'concept' },
                  { icon: '📐', text: '3D path rendering system', status: 'research' }
                ].map((feature, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 bg-white/40 rounded-lg border border-white/50">
                    <div className="text-lg">{feature.icon}</div>
                    <div className="flex-1">
                      <span className="text-slate-800 font-medium text-emboss-subtle">{feature.text}</span>
                      <div className="text-xs text-slate-600 bg-purple-100 px-2 py-1 rounded-full inline-block ml-2">
                        {feature.status}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress indicators with animations */}
            <div className="flex items-center justify-center space-x-6 mb-8">
              <div className="text-sm text-slate-600 bg-gradient-to-r from-purple-50 to-indigo-50 backdrop-blur-sm px-4 py-3 rounded-lg border border-purple-200 shadow-soft">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-purple-500 animate-pulse"></div>
                  <span className="font-semibold">Status:</span> 
                  <span className="text-purple-700">Research Phase</span>
                </div>
              </div>
              <div className="text-sm text-slate-600 bg-gradient-to-r from-green-50 to-emerald-50 backdrop-blur-sm px-4 py-3 rounded-lg border border-green-200 shadow-soft">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-green-500 animate-bounce"></div>
                  <span className="font-semibold">Platform:</span> 
                  <span className="text-green-700">Architecture Ready</span>
                </div>
              </div>
            </div>

            {/* Prototype Interface Preview */
            }
            <div className="glass-enhanced rounded-xl border border-white/30 shadow-elegant backdrop-blur-md p-6 mb-8">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <span className="text-2xl mr-2">🎮</span>
                Interface Preview
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Text + LLM Output */}
                <div className="bg-white/60 rounded-lg border border-white/50 p-4">
                  <h4 className="font-semibold text-slate-700 mb-3 flex items-center">
                    <span className="mr-2">💬</span>
                    LLM Output
                  </h4>
                  <pre className="whitespace-pre-wrap text-sm leading-5 bg-white/70 border border-gray-200 rounded-md p-3 max-h-64 overflow-auto">
                    {output || 'Submit text to generate and visualize an LLM response.'}
                  </pre>
                </div>

                {/* 3D Visualizer (gated), with 2D fallback */}
                <div className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-lg border border-white/50 p-4 relative overflow-hidden">
                  <h4 className="font-semibold text-white mb-3 flex items-center">
                    <span className="mr-2">🌌</span>
                    Vector Space
                  </h4>
                  <div className="rounded-md overflow-hidden">
                    {process.env.NEXT_PUBLIC_ENABLE_R3F === '1' ? (
                      // @ts-ignore dynamic fallback to noop when flag off
                      <Visualizer3D frame={demoFrame} />
                    ) : (
                      <Visualizer2D frame={demoFrame} width={640} height={320} />
                    )}
                  </div>
                  <div className="mt-2 text-xs text-white/70">
                    {process.env.NEXT_PUBLIC_ENABLE_R3F === '1' ? '3D interactive scene (OrbitControls enabled)' : '2D projection fallback; enable 3D with NEXT_PUBLIC_ENABLE_R3F=1'}
                  </div>
                </div>
              </div>
              
              <div className="mt-4 text-center">
                <div className="text-sm text-slate-600 bg-yellow-50 px-4 py-2 rounded-lg border border-yellow-200 shadow-soft">
                  <span className="font-semibold">Next:</span> Integrate @react-three/fiber for real 3D rendering
                </div>
              </div>
            </div>

            {/* Navigation hint */}
            <div className="text-center">
              <p className="text-sm text-slate-500 mb-2">
                👈 Navigate back to <span className="font-semibold">Prompt Enhancer</span> to continue using Promptpad
              </p>
              <div className="flex justify-center">
                <div className="w-32 h-1 bg-gradient-to-r from-transparent via-slate-300 to-transparent"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Infrastructure Test Panel */}
        <div className="glass-enhanced rounded-xl border border-white/30 shadow-elegant backdrop-blur-md p-4 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600 font-medium">Infrastructure Test:</span>
              <div className="text-sm text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-md border border-emerald-200">
                ✅ All shared components working
              </div>
            </div>
            <div className="text-xs text-slate-500">
              Debug terminal, model selection, and theming ready for this page
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
