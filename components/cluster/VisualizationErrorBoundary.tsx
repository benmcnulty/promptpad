"use client"

import React from 'react'

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default class VisualizationErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('3D Visualization Error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      // If we have a fallback component as children, use it
      if (this.props.fallback) {
        return this.props.fallback
      }
      
      // Otherwise show error UI with retry
      return (
        <div className="w-full h-full rounded-md overflow-hidden border border-white/20 flex items-center justify-center">
          <div className="text-white/70 text-center">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-sm mb-2">3D Visualization Error</p>
            <p className="text-xs text-white/50 mb-3">
              {this.state.error?.message || 'Unknown error occurred'}
            </p>
            <div className="space-y-2">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="block mx-auto px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded"
              >
                Retry 3D Mode
              </button>
              <button
                onClick={() => {
                  // Force a fallback mode by reloading
                  window.location.reload()
                }}
                className="block mx-auto px-3 py-1 text-xs bg-gray-600 hover:bg-gray-700 text-white rounded"
              >
                Use 2D Mode
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}