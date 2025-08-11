"use client"

import { useDebug } from '@/components/DebugProvider'
import { useWelcome } from '@/components/WelcomeProvider'

export default function DebugTerminal() {
  const { showDebug, debugLogs, clearDebugLogs, copySuccess, copyDebugToClipboard } = useDebug()
  const { resetWelcome } = useWelcome()

  if (!showDebug) return null

  return (
    <div className="border-t border-white/20 bg-gray-900 text-green-400 font-mono text-xs max-h-80 overflow-hidden flex flex-col flex-shrink-0">
      <div className="p-3 border-b border-gray-700 flex items-center justify-between bg-gray-800">
        <span className="text-green-300 font-semibold">🖥️ Debug Terminal</span>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={copyDebugToClipboard}
            className="px-2 py-1 bg-sky-700 hover:bg-sky-600 text-white rounded text-xs transition-colors duration-200"
            title="Copy debug output"
            aria-label="Copy debug output"
          >
            {copySuccess ? 'Copied' : 'Copy'}
          </button>
          <button
            type="button"
            onClick={resetWelcome}
            className="px-2 py-1 bg-indigo-700 hover:bg-indigo-600 text-white rounded text-xs transition-colors duration-200"
            title="Reset stored preferences (welcome, accent, model)"
            aria-label="Reset stored preferences"
            data-testid="reset-local-storage"
          >
            Reset Local Storage
          </button>
          <button
            type="button"
            onClick={clearDebugLogs}
            className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs transition-colors duration-200"
          >
            Clear
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-3 space-y-2 select-text">
        {debugLogs.length === 0 ? (
          <div className="text-gray-500">No debug logs yet. Use any tool to see debug output.</div>
        ) : (
          debugLogs.map((log, idx) => (
            <div key={idx} className="border-l-2 border-gray-700 pl-3">
              <div className="flex items-center space-x-2 mb-1">
                <span
                  className={`px-1 rounded text-xs font-bold ${
                    log.type === "request"
                      ? "bg-blue-700 text-blue-200"
                      : log.type === "response"
                      ? "bg-yellow-700 text-yellow-200"
                      : "bg-gray-700 text-gray-300"
                  }`}
                >
                  {log.type.toUpperCase()}
                </span>
                <span className="text-gray-400 text-xs">
                  {new Date(log.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="text-green-300 whitespace-pre-wrap break-words">
                {typeof log.content === "string"
                  ? log.content
                  : JSON.stringify(log.content, null, 2)}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}