"use client"

import { useState, useEffect, useCallback } from 'react'
import { AgentWorkflow } from '@/types/agent'

const WORKFLOWS_KEY = 'promptpad-agent-workflows'

export function useWorkflowPersistence() {
  const [savedWorkflows, setSavedWorkflows] = useState<AgentWorkflow[]>([])

  // Load workflows from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(WORKFLOWS_KEY)
      if (stored) {
        const workflows = JSON.parse(stored) as AgentWorkflow[]
        setSavedWorkflows(workflows)
      }
    } catch (error) {
      console.warn('Failed to load workflows from localStorage:', error)
    }
  }, [])

  // Save workflow to localStorage
  const saveWorkflow = useCallback((workflow: AgentWorkflow) => {
    try {
      const updatedWorkflows = savedWorkflows.filter(w => w.id !== workflow.id)
      updatedWorkflows.push({
        ...workflow,
        updatedAt: Date.now()
      })
      
      localStorage.setItem(WORKFLOWS_KEY, JSON.stringify(updatedWorkflows))
      setSavedWorkflows(updatedWorkflows)
      
      return true
    } catch (error) {
      console.error('Failed to save workflow:', error)
      return false
    }
  }, [savedWorkflows])

  // Delete workflow
  const deleteWorkflow = useCallback((workflowId: string) => {
    try {
      const updatedWorkflows = savedWorkflows.filter(w => w.id !== workflowId)
      localStorage.setItem(WORKFLOWS_KEY, JSON.stringify(updatedWorkflows))
      setSavedWorkflows(updatedWorkflows)
      return true
    } catch (error) {
      console.error('Failed to delete workflow:', error)
      return false
    }
  }, [savedWorkflows])

  // Get workflow by ID
  const getWorkflow = useCallback((workflowId: string) => {
    return savedWorkflows.find(w => w.id === workflowId)
  }, [savedWorkflows])

  // Export workflow as JSON
  const exportWorkflow = useCallback((workflow: AgentWorkflow) => {
    try {
      const dataStr = JSON.stringify(workflow, null, 2)
      const dataBlob = new Blob([dataStr], { type: 'application/json' })
      const url = URL.createObjectURL(dataBlob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `${workflow.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(url)
      return true
    } catch (error) {
      console.error('Failed to export workflow:', error)
      return false
    }
  }, [])

  // Import workflow from JSON
  const importWorkflow = useCallback((file: File): Promise<AgentWorkflow | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string
          const workflow = JSON.parse(content) as AgentWorkflow
          
          // Validate basic structure
          if (!workflow.id || !workflow.name || !Array.isArray(workflow.callpoints)) {
            throw new Error('Invalid workflow format')
          }
          
          // Generate new ID to avoid conflicts
          const importedWorkflow: AgentWorkflow = {
            ...workflow,
            id: Math.random().toString(36).substr(2, 9),
            name: `${workflow.name} (Imported)`,
            createdAt: Date.now(),
            updatedAt: Date.now()
          }
          
          resolve(importedWorkflow)
        } catch (error) {
          console.error('Failed to import workflow:', error)
          resolve(null)
        }
      }
      reader.readAsText(file)
    })
  }, [])

  return {
    savedWorkflows,
    saveWorkflow,
    deleteWorkflow,
    getWorkflow,
    exportWorkflow,
    importWorkflow
  }
}