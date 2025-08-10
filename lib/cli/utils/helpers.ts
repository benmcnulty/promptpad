/**
 * Helper utilities for Promptpad CLI
 * 
 * Provides validation, error handling, and utility functions
 * for consistent CLI behavior and user experience.
 */

import { ollama, OllamaError } from '../../ollama'

/**
 * Validates that a model is available in Ollama
 * 
 * Checks model availability and provides helpful error messages
 * if the model is not found or Ollama is not running.
 * 
 * @param modelName - Name of model to validate
 * @param verbose - Whether to show detailed progress
 * @throws Error if model validation fails
 */
export async function validateModel(modelName: string, verbose: boolean = false): Promise<void> {
  try {
    // First check if Ollama is running
    const isHealthy = await ollama.healthCheck()
    if (!isHealthy) {
      throw new Error('Ollama service is not running. Please start Ollama and try again.')
    }

    if (verbose) {
      console.log('✅ Ollama service is running')
    }

    // Check if specific model is available
    const hasModel = await ollama.hasModel(modelName)
    if (!hasModel) {
      if (verbose) {
        // List available models to help user
        try {
          const models = await ollama.listModels()
          console.log('Available models:')
          models.forEach(model => console.log(`  - ${model.name}`))
        } catch {
          // If we can't list models, just show the pull command
        }
      }
      throw new Error(`Model "${modelName}" not found. Run: ollama pull ${modelName}`)
    }

    if (verbose) {
      console.log(`✅ Model "${modelName}" is available`)
    }
  } catch (error) {
    if (error instanceof OllamaError) {
      throw new Error(`Ollama error: ${error.message}`)
    }
    throw error
  }
}

/**
 * Parses and validates temperature parameter
 * 
 * Ensures temperature is a valid number within Promptpad's constraints.
 * 
 * @param tempStr - Temperature string from CLI
 * @returns Validated temperature number (clamped to ≤0.3)
 * @throws Error if temperature is invalid
 */
export function parseTemperature(tempStr: string): number {
  const temp = parseFloat(tempStr)
  
  if (isNaN(temp)) {
    throw new Error(`Invalid temperature: "${tempStr}". Must be a number.`)
  }
  
  if (temp < 0) {
    throw new Error(`Invalid temperature: ${temp}. Must be ≥ 0.`)
  }
  
  // Apply Promptpad's temperature constraint
  const clampedTemp = Math.min(temp, 0.3)
  
  if (clampedTemp !== temp) {
    console.warn(`⚠️ Temperature clamped from ${temp} to ${clampedTemp} (Promptpad constraint)`)
  }
  
  return clampedTemp
}

/**
 * Parses and validates timeout parameter
 * 
 * @param timeoutStr - Timeout string from CLI
 * @returns Validated timeout in milliseconds
 * @throws Error if timeout is invalid
 */
export function parseTimeout(timeoutStr: string): number {
  const timeout = parseInt(timeoutStr, 10)
  
  if (isNaN(timeout)) {
    throw new Error(`Invalid timeout: "${timeoutStr}". Must be a number in milliseconds.`)
  }
  
  if (timeout < 1000) {
    throw new Error(`Invalid timeout: ${timeout}ms. Must be at least 1000ms (1 second).`)
  }
  
  if (timeout > 600000) {
    console.warn(`⚠️ Very long timeout: ${timeout}ms (10+ minutes). This may cause issues.`)
  }
  
  return timeout
}

/**
 * Handles CLI errors with consistent formatting and appropriate exit codes
 * 
 * @param command - Command name that failed
 * @param error - Error that occurred
 * @param verbose - Whether to show detailed error information
 */
export function handleCliError(command: string, error: unknown, verbose: boolean = false): never {
  if (verbose) {
    console.error(`💥 ${command} command failed:`)
    console.error('Details:', error)
  } else {
    if (error instanceof Error) {
      console.error(`❌ ${error.message}`)
    } else {
      console.error(`❌ ${command} failed:`, error)
    }
  }

  // Suggest common solutions
  if (error instanceof Error && error.message.includes('Ollama service')) {
    console.error('')
    console.error('💡 Troubleshooting:')
    console.error('  1. Install Ollama: https://ollama.ai')
    console.error('  2. Start service: ollama serve')
    console.error('  3. Pull a model: ollama pull gpt-oss:20b')
  } else if (error instanceof Error && error.message.includes('not found')) {
    console.error('')
    console.error('💡 Try: ollama list  (to see available models)')
    console.error('💡 Or: ollama pull <model-name>  (to download a model)')
  }

  process.exit(1)
}

/**
 * Formats duration in human-readable format
 * 
 * @param ms - Duration in milliseconds
 * @returns Formatted duration string
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) {
    return `${ms}ms`
  } else if (ms < 60000) {
    return `${(ms / 1000).toFixed(1)}s`
  } else {
    const minutes = Math.floor(ms / 60000)
    const seconds = ((ms % 60000) / 1000).toFixed(1)
    return `${minutes}m ${seconds}s`
  }
}