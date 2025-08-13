"use client"

import { useEffect } from 'react'
import type { ClusterVisualizationOptions, ClusterLayoutMode, ColorScheme } from '@/lib/vectorization/cluster-types'

interface EffectsPanelProps {
  options: ClusterVisualizationOptions
  onChange: (options: ClusterVisualizationOptions) => void
}

const STORAGE_KEY = 'ppviz:cluster-effects:v1'

export default function EffectsPanel({ options, onChange }: EffectsPanelProps) {
  
  // Load persisted effects options
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        onChange({ ...options, ...parsed })
      }
    } catch (error) {
      console.warn('Failed to load effects options:', error)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Persist options changes
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(options))
    } catch (error) {
      console.warn('Failed to persist effects options:', error)
    }
  }, [options])

  const updateOption = <K extends keyof ClusterVisualizationOptions>(
    key: K,
    value: ClusterVisualizationOptions[K]
  ) => {
    onChange({ ...options, [key]: value })
  }

  const layoutOptions: { value: ClusterLayoutMode; label: string; description: string }[] = [
    { value: 'spherical', label: 'Spherical', description: 'Words arranged in spheres around cluster centers' },
    { value: 'grid', label: 'Grid', description: '3D grid formation for organized layout' },
    { value: 'organic', label: 'Organic', description: 'Natural, physics-based positioning' },
    { value: 'hierarchical', label: 'Hierarchical', description: 'Tree-like branching structure' },
    { value: 'radial', label: 'Radial', description: 'Clusters radiating from center' }
  ]

  const colorSchemes: { value: ColorScheme; label: string; description: string }[] = [
    { value: 'semantic', label: 'Semantic', description: 'Colors based on word meaning' },
    { value: 'depth', label: 'Depth', description: 'Colors based on navigation depth' },
    { value: 'rainbow', label: 'Rainbow', description: 'Full spectrum gradient' },
    { value: 'monochrome', label: 'Monochrome', description: 'Single hue variations' },
    { value: 'custom', label: 'Custom', description: 'User-defined palette' }
  ]

  return (
    <div className="glass-enhanced rounded-lg border border-white/30 backdrop-blur-md p-4">
      <h3 className="font-semibold text-slate-800 mb-3">Visualization Effects</h3>
      
      {/* Layout Mode */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Layout Mode
        </label>
        <select
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
          value={options.layout}
          onChange={(e) => updateOption('layout', e.target.value as ClusterLayoutMode)}
        >
          {layoutOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <div className="text-xs text-gray-500 mt-1">
          {layoutOptions.find(opt => opt.value === options.layout)?.description}
        </div>
      </div>

      {/* Color Scheme */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Color Scheme
        </label>
        <select
          className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
          value={options.colorScheme}
          onChange={(e) => updateOption('colorScheme', e.target.value as ColorScheme)}
        >
          {colorSchemes.map(scheme => (
            <option key={scheme.value} value={scheme.value}>
              {scheme.label}
            </option>
          ))}
        </select>
        <div className="text-xs text-gray-500 mt-1">
          {colorSchemes.find(scheme => scheme.value === options.colorScheme)?.description}
        </div>
      </div>

      {/* Spacing Controls */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Cluster Spacing: {options.clusterSpacing.toFixed(1)}
        </label>
        <input
          type="range"
          min={0.5}
          max={5.0}
          step={0.1}
          value={options.clusterSpacing}
          onChange={(e) => updateOption('clusterSpacing', Number(e.target.value))}
          className="w-full"
        />
      </div>

      <div className="mb-4">
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Word Spacing: {options.wordSpacing.toFixed(1)}
        </label>
        <input
          type="range"
          min={0.2}
          max={2.0}
          step={0.1}
          value={options.wordSpacing}
          onChange={(e) => updateOption('wordSpacing', Number(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Visual Effects Toggles */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-slate-700">Visual Effects</h4>
        
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={options.showConnections}
            onChange={(e) => updateOption('showConnections', e.target.checked)}
            className="rounded"
          />
          <span className="text-sm text-slate-600">Show Connections</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={options.animateExpansion}
            onChange={(e) => updateOption('animateExpansion', e.target.checked)}
            className="rounded"
          />
          <span className="text-sm text-slate-600">Animate Expansion</span>
        </label>

        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={options.particleEffects}
            onChange={(e) => updateOption('particleEffects', e.target.checked)}
            className="rounded"
          />
          <span className="text-sm text-slate-600">Particle Effects</span>
        </label>
      </div>

      {/* Quick Presets */}
      <div className="mt-4 pt-3 border-t border-gray-200">
        <h4 className="text-sm font-medium text-slate-700 mb-2">Quick Presets</h4>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onChange({
              layout: 'spherical',
              colorScheme: 'semantic',
              showConnections: true,
              animateExpansion: true,
              particleEffects: true,
              clusterSpacing: 2.0,
              wordSpacing: 0.8
            })}
            className="px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
          >
            Default
          </button>
          <button
            onClick={() => onChange({
              layout: 'hierarchical',
              colorScheme: 'depth',
              showConnections: true,
              animateExpansion: false,
              particleEffects: false,
              clusterSpacing: 3.0,
              wordSpacing: 1.2
            })}
            className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200"
          >
            Clean
          </button>
          <button
            onClick={() => onChange({
              layout: 'organic',
              colorScheme: 'rainbow',
              showConnections: true,
              animateExpansion: true,
              particleEffects: true,
              clusterSpacing: 1.5,
              wordSpacing: 0.6
            })}
            className="px-2 py-1 text-xs bg-purple-100 text-purple-700 rounded hover:bg-purple-200"
          >
            Vibrant
          </button>
          <button
            onClick={() => onChange({
              layout: 'grid',
              colorScheme: 'monochrome',
              showConnections: false,
              animateExpansion: false,
              particleEffects: false,
              clusterSpacing: 2.5,
              wordSpacing: 1.0
            })}
            className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
          >
            Minimal
          </button>
        </div>
      </div>
    </div>
  )
}