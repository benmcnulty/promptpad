"use client"

import { useEffect, useRef, useState } from 'react'
import { useModel } from '@/components/ModelProvider'

export default function ModelDropdown() {
  const { models, selectedModel, setSelectedModel, loading, error, refresh } = useModel()
  const [isOpen, setIsOpen] = useState(false)
  const [shouldOpenUpward, setShouldOpenUpward] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Outside click
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false) }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  // Esc key
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setIsOpen(false) }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  const checkPositioning = () => {
    if (!ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const menuHeight = 240
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    setShouldOpenUpward(spaceBelow < menuHeight && spaceAbove > menuHeight)
  }

  const handleToggle = () => {
    if (!isOpen) {
      checkPositioning()
      if (!models.length && !loading) refresh()
    }
    setIsOpen(!isOpen)
  }

  const current = selectedModel
  const label = current

  return (
    <div className="relative" ref={ref}>
      <label className="sr-only" htmlFor="model-dropdown">Ollama model</label>
      <button
        id="model-dropdown"
        type="button"
        onClick={handleToggle}
        className="flex items-center space-x-2 bg-white/60 hover:bg-white/80 border border-white/40 px-3 py-1.5 text-xs rounded-md font-medium focus-visible transition-all duration-200"
        aria-haspopup="listbox"
        aria-label="Model selector"
        title={error ? `Models: ${error}` : 'Select model'}
      >
        <span className="text-slate-600 font-medium">{label}</span>
        <svg className={`w-3 h-3 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {isOpen && (
        <div className={`absolute ${shouldOpenUpward ? 'bottom-full mb-2' : 'top-full mt-2'} right-0 w-56 bg-white/95 backdrop-blur-md border border-white/40 rounded-lg shadow-elegant z-50 overflow-hidden ${shouldOpenUpward ? 'animate-fade-in-down' : 'animate-fade-in-up'}`}>
          <ul className="py-1 max-h-64 overflow-auto" aria-label="Model options">
            {loading && (
              <li className="px-3 py-2 text-sm text-slate-600">Loading models…</li>
            )}
            {!loading && models.map(m => {
              const isSelected = m.name === selectedModel
              return (
                <li key={m.name}>
                  <button
                    type="button"
                    aria-current={isSelected ? 'true' : undefined}
                    onClick={() => { setSelectedModel(m.name); setIsOpen(false) }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 text-sm text-left transition-colors ${isSelected ? 'bg-slate-100 text-slate-900 font-semibold' : 'text-slate-700 hover:bg-slate-50'}`}
                  >
                    <span className="truncate mr-2">{m.name}</span>
                    {isSelected && (
                      <svg className="w-4 h-4 text-emerald-600 ml-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </li>
              )
            })}
            {!loading && models.length === 0 && (
              <li className="px-3 py-2 text-sm text-slate-600">No models available</li>
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

