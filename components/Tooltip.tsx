"use client"

import { useState, ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'

interface TooltipProps {
  content: string
  children: ReactNode
  className?: string
  position?: 'top' | 'bottom' | 'left' | 'right'
  delay?: number
}

export default function Tooltip({ 
  content, 
  children, 
  className = '', 
  position = 'top',
  delay = 500 
}: TooltipProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const [isPositioned, setIsPositioned] = useState(false)
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleMouseMove = (e: React.MouseEvent) => {
    const newPos = { x: e.clientX, y: e.clientY }
    setMousePos(newPos)
    // Update positioning state if we're showing the tooltip and have valid coordinates
    if (showTooltip && newPos.x > 0 && newPos.y > 0 && !isPositioned) {
      setIsPositioned(true)
    }
  }

  const handleMouseEnter = (e: React.MouseEvent) => {
    const pos = { x: e.clientX, y: e.clientY }
    setMousePos(pos)
    setIsPositioned(false)
    
    const id = setTimeout(() => {
      if (pos.x > 0 && pos.y > 0) {
        setShowTooltip(true)
        // Small delay to ensure smooth positioning
        setTimeout(() => setIsPositioned(true), 50)
      }
    }, delay)
    setTimeoutId(id)
  }

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [timeoutId])

  const hideTooltip = () => {
    if (timeoutId) {
      clearTimeout(timeoutId)
      setTimeoutId(null)
    }
    setShowTooltip(false)
    setIsPositioned(false)
  }

  const getTooltipStyle = () => {
    const offset = 12
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800
    
    let left = mousePos.x
    let top = mousePos.y
    let transform = 'translate(-50%, -100%)'
    
    switch (position) {
      case 'top':
        top = mousePos.y - offset
        transform = 'translate(-50%, -100%)'
        // Ensure tooltip doesn't go off left/right edges
        if (left < 100) left = 100
        if (left > viewportWidth - 100) left = viewportWidth - 100
        break
      case 'bottom':
        top = mousePos.y + offset
        transform = 'translate(-50%, 0%)'
        if (left < 100) left = 100
        if (left > viewportWidth - 100) left = viewportWidth - 100
        break
      case 'left':
        left = mousePos.x - offset
        top = mousePos.y
        transform = 'translate(-100%, -50%)'
        break
      case 'right':
        left = mousePos.x + offset
        top = mousePos.y
        transform = 'translate(0%, -50%)'
        break
      default:
        top = mousePos.y - offset
        transform = 'translate(-50%, -100%)'
        if (left < 100) left = 100
        if (left > viewportWidth - 100) left = viewportWidth - 100
    }
    
    return { 
      left: isNaN(left) ? 0 : left, 
      top: isNaN(top) ? 0 : top, 
      transform 
    }
  }

  const getArrowClasses = () => {
    switch (position) {
      case 'top':
        return 'top-full left-1/2 transform -translate-x-1/2 border-t-slate-800 border-t-[6px] border-x-transparent border-x-[6px] border-b-0'
      case 'bottom':
        return 'bottom-full left-1/2 transform -translate-x-1/2 border-b-slate-800 border-b-[6px] border-x-transparent border-x-[6px] border-t-0'
      case 'left':
        return 'left-full top-1/2 transform -translate-y-1/2 border-l-slate-800 border-l-[6px] border-y-transparent border-y-[6px] border-r-0'
      case 'right':
        return 'right-full top-1/2 transform -translate-y-1/2 border-r-slate-800 border-r-[6px] border-y-transparent border-y-[6px] border-l-0'
      default:
        return 'top-full left-1/2 transform -translate-x-1/2 border-t-slate-800 border-t-[6px] border-x-transparent border-x-[6px] border-b-0'
    }
  }

  const baseStyle = getTooltipStyle()
  const isVisible = showTooltip && isPositioned && mousePos.x > 0 && mousePos.y > 0
  
  const tooltipStyle = {
    ...baseStyle,
    opacity: isVisible ? 1 : 0,
    visibility: (showTooltip ? 'visible' : 'hidden') as 'visible' | 'hidden',
    transition: 'opacity 0.15s cubic-bezier(0.16, 1, 0.3, 1), transform 0.15s cubic-bezier(0.16, 1, 0.3, 1)',
    transform: `${baseStyle.transform} ${isVisible ? 'scale(1)' : 'scale(0.95)'}`
  }

  return (
    <div 
      className={`relative inline-block ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseMove={handleMouseMove}
      onMouseLeave={hideTooltip}
    >
      {children}
      {mounted && createPortal(
        <div 
          className="fixed z-[99999] pointer-events-none"
          style={tooltipStyle}
          role="tooltip"
        >
          {/* Tooltip content */}
          <div className="bg-slate-800 text-white text-sm px-3 py-2 rounded-lg shadow-xl backdrop-blur-sm border border-slate-700 max-w-xs whitespace-normal leading-relaxed">
            {content}
          </div>
          
          {/* Arrow */}
          <div 
            className={`absolute ${getArrowClasses()}`}
            style={{ width: 0, height: 0 }}
          />
        </div>,
        document.body
      )}
    </div>
  )
}
