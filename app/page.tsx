'use client'

import { useCallback, useMemo, useState } from 'react'
import StatusBar from '@/components/StatusBar'
import TokenCounter from '@/components/TokenCounter'
import ProgressTracker from '@/components/ProgressTracker'
import { useRefine } from '@/hooks/useRefine'

export default function Home() {
  const [inputText, setInputText] = useState('')
  const [outputText, setOutputText] = useState('')
  const { state, statusSummary, run, reset } = useRefine('gpt-oss:20b', 0.2)

  const canRefine = useMemo(() => inputText.trim().length > 0 && !state.loading, [inputText, state.loading])
  const canReinforce = useMemo(() => outputText.trim().length > 0 && !state.loading, [outputText, state.loading])

  const onRefine = useCallback(async () => {
    const res = await run('refine', inputText)
    if (res && res.output) setOutputText(res.output)
  }, [run, inputText])

  const onReinforce = useCallback(async () => {
    const res = await run('reinforce', outputText)
    if (res && res.output) setOutputText(res.output)
  }, [run, outputText])
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Promptpad
        </h1>
      </header>

      {/* Main Content - Split Layout */}
      <main className="flex-1 flex">
        {/* Left Pane - Input */}
        <div className="w-1/2 border-r border-gray-200 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">
              Input
            </h2>
            <div className="text-sm text-gray-500 mb-4">
              Enter your terse instructions below
            </div>
          </div>
          
          <div className="flex-1 p-4">
            <textarea
              className="w-full h-full resize-none border-2 border-gray-300 rounded-lg p-4 form-control focus-visible"
              placeholder="Enter your prompt ideas here..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              aria-label="Prompt input area"
            />
          </div>

          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <TokenCounter text={inputText} />
              <button 
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus-visible disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!canRefine}
                aria-label="Refine prompt"
                onClick={onRefine}
              >
                Refine
              </button>
            </div>
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>{statusSummary}</span>
              <button
                className="text-gray-400 hover:text-gray-600 focus-visible"
                onClick={reset}
                aria-label="Reset progress"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Right Pane - Output */}
        <div className="w-1/2 flex flex-col">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">
              Output
            </h2>
            <div className="text-sm text-gray-500 mb-4">
              Refined prompt will appear here
            </div>
          </div>
          
          <div className="flex-1 p-4">
            <textarea
              className="w-full h-full resize-none border-2 border-gray-300 rounded-lg p-4 form-control focus-visible"
              placeholder="Refined prompt will appear here..."
              value={outputText}
              onChange={(e) => setOutputText(e.target.value)}
              aria-label="Prompt output area"
            />
          </div>

          <div className="p-4 border-t border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <TokenCounter text={outputText} />
              <div className="flex space-x-2">
                <button 
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus-visible disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled
                  aria-label="Undo last change"
                >
                  Undo
                </button>
                <button 
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 focus-visible disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!canReinforce}
                  aria-label="Reinforce edited prompt"
                  onClick={onReinforce}
                >
                  Reinforce
                </button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-500">
                Usage: <span className="font-mono">in {state.usage?.input_tokens ?? 0} · out {state.usage?.output_tokens ?? 0}</span>
              </div>
              <ProgressTracker steps={state.steps} />
            </div>
          </div>
        </div>
      </main>

      {/* Empty State Message */}
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center max-w-md px-6 py-8">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Welcome to Promptpad
          </h3>
          <p className="text-gray-500 mb-4">
            Your local-first prompt drafting tool. To get started:
          </p>
          <div className="text-sm text-gray-600 bg-white p-4 rounded-lg border">
            <code className="block font-mono text-xs">
              ollama pull gpt-oss:20b
            </code>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <StatusBar />
    </div>
  )
}
