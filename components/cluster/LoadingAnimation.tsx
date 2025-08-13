"use client"

import { useEffect, useState } from 'react'

interface LoadingAnimationProps {
  step: string
  progress: number
  className?: string
}

export default function LoadingAnimation({ step, progress, className = "" }: LoadingAnimationProps) {
  const [dots, setDots] = useState('')
  const [pulsePhase, setPulsePhase] = useState(0)

  // Animated dots effect
  useEffect(() => {
    const interval = setInterval(() => {
      setDots(prev => {
        switch (prev) {
          case '': return '.'
          case '.': return '..'
          case '..': return '...'
          case '...': return ''
          default: return ''
        }
      })
    }, 500)

    return () => clearInterval(interval)
  }, [])

  // Pulse animation for the orb
  useEffect(() => {
    const interval = setInterval(() => {
      setPulsePhase(prev => (prev + 1) % 100)
    }, 50)

    return () => clearInterval(interval)
  }, [])

  const orbScale = 1 + Math.sin(pulsePhase * 0.1) * 0.3
  const orbOpacity = 0.7 + Math.sin(pulsePhase * 0.15) * 0.3

  return (
    <div className={`flex flex-col items-center justify-center space-y-4 ${className}`}>
      {/* Animated Orb */}
      <div className="relative">
        {/* Outer pulse rings */}
        <div 
          className="absolute inset-0 rounded-full bg-blue-400/20 animate-ping"
          style={{ 
            transform: `scale(${1.5 + Math.sin(pulsePhase * 0.08) * 0.5})`,
            animationDuration: '2s'
          }}
        />
        <div 
          className="absolute inset-0 rounded-full bg-purple-400/30 animate-ping"
          style={{ 
            transform: `scale(${1.2 + Math.sin(pulsePhase * 0.12) * 0.3})`,
            animationDuration: '1.5s',
            animationDelay: '0.5s'
          }}
        />
        
        {/* Main orb */}
        <div 
          className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 shadow-lg"
          style={{ 
            transform: `scale(${orbScale})`,
            opacity: orbOpacity,
            boxShadow: `0 0 ${20 + Math.sin(pulsePhase * 0.1) * 10}px rgba(59, 130, 246, 0.5)`
          }}
        >
          {/* Inner glow */}
          <div className="w-full h-full rounded-full bg-gradient-to-br from-white/30 to-transparent" />
        </div>

        {/* Floating particles */}
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-blue-300/60 rounded-full"
            style={{
              top: '50%',
              left: '50%',
              transform: `translate(-50%, -50%) rotate(${i * 60 + pulsePhase * 2}deg) translateY(-${30 + i * 5}px)`,
              opacity: 0.6 + Math.sin((pulsePhase + i * 20) * 0.1) * 0.4
            }}
          />
        ))}
      </div>

      {/* Progress Bar */}
      <div className="w-48 h-2 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-blue-500 to-purple-600 rounded-full transition-all duration-300 ease-out"
          style={{ 
            width: `${Math.max(5, progress)}%`,
            boxShadow: progress > 5 ? '0 0 10px rgba(59, 130, 246, 0.5)' : 'none'
          }}
        >
          {/* Progress shine effect */}
          <div 
            className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent"
            style={{
              transform: `translateX(${Math.sin(pulsePhase * 0.05) * 100}%)`,
            }}
          />
        </div>
      </div>

      {/* Status Text */}
      <div className="text-center">
        <div className="text-lg font-medium text-slate-700 mb-1">
          {step}{dots}
        </div>
        <div className="text-sm text-slate-500">
          {progress < 25 && "Initializing request..."}
          {progress >= 25 && progress < 50 && "Processing with LLM..."}
          {progress >= 50 && progress < 80 && "Generating word associations..."}
          {progress >= 80 && progress < 95 && "Creating cluster structure..."}
          {progress >= 95 && "Almost ready!"}
        </div>
        <div className="text-xs text-slate-400 mt-1">
          {progress}% complete
        </div>
      </div>

      {/* Word generation preview */}
      {progress > 30 && (
        <div className="flex space-x-2 opacity-60">
          {[...Array(Math.min(12, Math.floor((progress - 30) / 5)))].map((_, i) => (
            <div
              key={i}
              className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-md animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              word{i + 1}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}