"use client"

import { useState } from 'react'
import AgentChainBuilder from '@/components/agent/AgentChainBuilder'

export default function AgentEditorPage() {
  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-teal-50 to-blue-50">
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 bg-white/80 backdrop-blur-sm border-b border-white/20">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-800 text-emboss-subtle">
                Agent Editor
              </h1>
              <p className="text-slate-600 text-sm mt-1">
                Design multi-agent workflows with dynamic LLM orchestration
              </p>
            </div>
            
            <div className="flex items-center space-x-3">
              <span className="text-xs text-slate-500 bg-white/60 px-2 py-1 rounded-full font-medium border border-white/40">
                Beta
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0">
        <AgentChainBuilder />
      </div>
    </div>
  )
}