"use client"

import { useState, useRef, useEffect } from 'react'
import { useTheme } from '@/components/ThemeProvider'

type Accent = 'emerald' | 'sapphire' | 'violet' | 'coral' | 'golden'

interface AccentOption {
  value: Accent
  label: string
  gradientClasses: string
}

const ACCENT_OPTIONS: AccentOption[] = [
  {
    value: 'emerald',
    label: 'Emerald',
    gradientClasses: 'bg-gradient-to-r from-teal-500 to-emerald-600'
  },
  {
    value: 'sapphire', 
    label: 'Sapphire',
    gradientClasses: 'bg-gradient-to-r from-cyan-500 to-sky-600'
  },
  {
    value: 'violet',
    label: 'Violet', 
    gradientClasses: 'bg-gradient-to-r from-indigo-500 to-violet-600'
  },
  {
    value: 'coral',
    label: 'Coral',
    gradientClasses: 'bg-gradient-to-r from-pink-500 to-orange-600'
  },
  {
    value: 'golden',
    label: 'Golden', 
    gradientClasses: 'bg-gradient-to-r from-amber-500 to-yellow-600'
  }
]

export default function ThemeDropdown() {
  const { accent, setAccent } = useTheme()
  const [isOpen, setIsOpen] = useState(false)
  const [shouldOpenUpward, setShouldOpenUpward] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentOption = ACCENT_OPTIONS.find(option => option.value === accent) || ACCENT_OPTIONS[0]

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Close dropdown on escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  const checkPositioning = () => {
    if (dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect()
      const dropdownHeight = 220 // Approximate height of dropdown with 5 items
      const viewportHeight = window.innerHeight
      
      // Check if dropdown would go below viewport
      const spaceBelow = viewportHeight - rect.bottom
      const spaceAbove = rect.top
      
      setShouldOpenUpward(spaceBelow < dropdownHeight && spaceAbove > dropdownHeight)
    }
  }

  const handleSelect = (option: AccentOption) => {
    setAccent(option.value)
    setIsOpen(false)
  }

  const handleToggle = () => {
    if (!isOpen) {
      checkPositioning()
    }
    setIsOpen(!isOpen)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="sr-only" htmlFor="theme-dropdown">Theme accent color</label>
      
      {/* Trigger button */}
      <button
        id="theme-dropdown"
        onClick={handleToggle}
        className="flex items-center space-x-2 bg-white/60 hover:bg-white/80 border border-white/40 px-3 py-1.5 text-xs rounded-md font-medium focus-visible transition-all duration-200"
  aria-label="Select theme accent color"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        type="button"
      >
        {/* Current selection with gradient */}
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${currentOption.gradientClasses} shadow-sm`} />
          <span className="text-slate-600 font-medium">{currentOption.label}</span>
        </div>
        
        {/* Chevron */}
        <svg 
          className={`w-3 h-3 text-slate-500 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div 
          className={`absolute ${shouldOpenUpward ? 'bottom-full mb-2' : 'top-full mt-2'} right-0 w-40 bg-white/95 backdrop-blur-md border border-white/40 rounded-lg shadow-elegant z-50 overflow-hidden ${shouldOpenUpward ? 'animate-fade-in-down' : 'animate-fade-in-up'}`}
        >
          <ul role="listbox" className="py-1">
            {ACCENT_OPTIONS.map((option) => {
              const isSelected = option.value === accent
              
              return (
                <li key={option.value} role="option" aria-selected={isSelected}>
                  <button
                    onClick={() => handleSelect(option)}
                    className={`w-full flex items-center space-x-3 px-3 py-2.5 text-sm font-medium transition-all duration-150 text-left ${
                      isSelected 
                        ? 'bg-slate-100 text-slate-900 font-semibold' 
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                    type="button"
                  >
                    {/* Gradient preview */}
                    <div className={`w-4 h-4 rounded-full ${option.gradientClasses} shadow-sm flex-shrink-0`} />
                    
                    {/* Option text with gradient styling */}
                    <span 
                      className={`flex-1 ${option.gradientClasses} bg-clip-text text-transparent font-semibold`}
                      style={{ 
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent'
                      }}
                    >
                      {option.label}
                    </span>
                    
                    {/* Selection indicator */}
                    {isSelected && (
                      <svg className="w-4 h-4 text-emerald-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}