"use client"

import { useState } from 'react'
import type { WordCluster } from '@/lib/vectorization/cluster-types'

interface ClusterDropdownProps {
  cluster: WordCluster
  onExpandWord: (word: string, clusterId: string) => Promise<void>
  isLoading: boolean
  loadingStep: string
}

export default function ClusterDropdown({ 
  cluster, 
  onExpandWord, 
  isLoading, 
  loadingStep 
}: ClusterDropdownProps) {
  const [selectedWord, setSelectedWord] = useState<string>('')
  const [expandingWord, setExpandingWord] = useState<string>('')

  const handleExpandWord = async (word: string) => {
    if (isLoading) return
    
    setExpandingWord(word)
    try {
      await onExpandWord(word, cluster.id)
    } finally {
      setExpandingWord('')
    }
  }

  const formatClusterTitle = () => {
    if (cluster.parentWord) {
      return `${cluster.parentWord} cluster`
    }
    return `Root cluster`
  }

  const getWordContainerClass = (word: string) => {
    const baseClass = "flex items-center justify-between w-full p-2 rounded-md border transition-all duration-200 group"
    
    if (expandingWord === word) {
      return `${baseClass} bg-blue-100 border-blue-300`
    }
    
    if (selectedWord === word) {
      return `${baseClass} bg-indigo-50 border-indigo-300 hover:bg-indigo-100`
    }
    
    return `${baseClass} bg-white border-gray-200 hover:bg-gray-50 hover:border-gray-300`
  }

  const getWordButtonClass = (word: string) => {
    const baseClass = "text-left"
    
    if (expandingWord === word) {
      return `${baseClass} text-blue-800`
    }
    
    if (selectedWord === word) {
      return `${baseClass} text-indigo-800`
    }
    
    return `${baseClass} text-gray-700`
  }

  const getAddButtonClass = (word: string) => {
    const baseClass = "ml-2 px-2 py-1 text-xs rounded-md font-medium transition-all duration-200"
    
    if (expandingWord === word) {
      return `${baseClass} bg-blue-600 text-white`
    }
    
    if (isLoading) {
      return `${baseClass} bg-gray-300 text-gray-500 cursor-not-allowed`
    }
    
    return `${baseClass} bg-blue-500 text-white hover:bg-blue-600 opacity-0 group-hover:opacity-100`
  }

  return (
    <div className="glass-enhanced rounded-lg border border-white/30 backdrop-blur-md p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-slate-800">
          {formatClusterTitle()}
        </h3>
        <div className="text-xs text-slate-500">
          Depth {cluster.depth} • {cluster.words.length} words
        </div>
      </div>

      {/* Cluster Source Info */}
      <div className="mb-4 p-2 bg-slate-50 rounded-md text-xs text-slate-600">
        {cluster.parentWord ? (
          <div>
            <strong>Expanded from:</strong> &ldquo;{cluster.parentWord}&rdquo;
            <br />
            <strong>Original prompt:</strong> &ldquo;{cluster.sourcePrompt}&rdquo;
          </div>
        ) : (
          <div>
            <strong>Root prompt:</strong> &ldquo;{cluster.sourcePrompt}&rdquo;
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <div className="flex items-center gap-2 text-sm text-blue-700">
            <div className="animate-spin w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
            <span>{loadingStep}</span>
          </div>
          {expandingWord && (
            <div className="mt-1 text-xs text-blue-600">
              Expanding: &ldquo;{expandingWord}&rdquo;
            </div>
          )}
        </div>
      )}

      {/* Word List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {cluster.words.map((word, index) => (
          <div key={`${cluster.id}-${word}-${index}`}>
            <div
              className={getWordContainerClass(word)}
            >
              <button
                className={`flex items-center gap-2 flex-1 ${getWordButtonClass(word)}`}
                onClick={() => setSelectedWord(selectedWord === word ? '' : word)}
                disabled={isLoading}
              >
                <span className="text-xs text-gray-400 font-mono w-6">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="font-medium">{word}</span>
                {expandingWord === word && (
                  <div className="animate-spin w-3 h-3 border border-blue-600 border-t-transparent rounded-full ml-2"></div>
                )}
              </button>
              
              <button
                className={getAddButtonClass(word)}
                onClick={(e) => {
                  e.stopPropagation()
                  handleExpandWord(word)
                }}
                disabled={isLoading}
                title={`Expand ${word} into a new cluster`}
              >
                {expandingWord === word ? 'Expanding...' : 'Add +'}
              </button>
            </div>

            {/* Word Details (when selected) */}
            {selectedWord === word && (
              <div className="mt-2 ml-8 p-2 bg-gray-50 rounded-md text-xs text-gray-600">
                <div className="mb-1">
                  <strong>Position in cluster:</strong> {index + 1} of {cluster.words.length}
                </div>
                <div className="mb-2">
                  <strong>Expansion preview:</strong> Click &ldquo;Add +&rdquo; to discover {word}-related concepts
                </div>
                <button
                  className="text-blue-600 hover:text-blue-800 font-medium"
                  onClick={() => handleExpandWord(word)}
                  disabled={isLoading}
                >
                  → Expand {word} into new cluster
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Cluster Stats */}
      <div className="mt-4 pt-3 border-t border-gray-200 text-xs text-gray-500">
        <div className="flex justify-between">
          <span>Created: {new Date(cluster.createdAt).toLocaleTimeString()}</span>
          <span>ID: {cluster.id.slice(-8)}</span>
        </div>
      </div>
    </div>
  )
}