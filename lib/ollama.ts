/**
 * Ollama API adapter for Promptpad
 * Provides local-first model listing and text generation
 */

export interface OllamaModel {
  name: string
  size: number
  digest: string
  modified_at: string
}

export interface OllamaModelsResponse {
  models: OllamaModel[]
}

export interface OllamaGenerateRequest {
  model: string
  prompt: string
  stream?: boolean
  options?: {
    temperature?: number
    top_p?: number
    max_tokens?: number
  }
}

export interface OllamaGenerateResponse {
  response: string
  done: boolean
  context?: number[]
  total_duration?: number
  load_duration?: number
  prompt_eval_count?: number
  eval_count?: number
  eval_duration?: number
}

export interface UsageStats {
  input_tokens: number
  output_tokens: number
}

export class OllamaError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message)
    this.name = 'OllamaError'
  }
}

export class OllamaClient {
  private baseUrl: string
  private timeout: number

  constructor(baseUrl: string = 'http://localhost:11434', timeout: number = 30000) {
    this.baseUrl = baseUrl.replace(/\/$/, '') // Remove trailing slash
    this.timeout = timeout
  }

  /**
   * Check if Ollama service is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/version`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000), // Quick health check
      })
      return response.ok
    } catch (error) {
      return false
    }
  }

  /**
   * List available models
   */
  async listModels(): Promise<OllamaModel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(this.timeout),
      })

      if (!response.ok) {
        throw new OllamaError(
          `Failed to list models: ${response.status} ${response.statusText}`,
          response.status
        )
      }

      const data: OllamaModelsResponse = await response.json()
      return data.models || []
    } catch (error) {
      if (error instanceof OllamaError) {
        throw error
      }
      throw new OllamaError(
        `Ollama service unavailable: ${error instanceof Error ? error.message : 'Unknown error'}`,
        0,
        'SERVICE_UNAVAILABLE'
      )
    }
  }

  /**
   * Generate text using a model
   */
  async generate(
    model: string,
    prompt: string,
    options: { temperature?: number } = {}
  ): Promise<{ text: string; usage: UsageStats }> {
    // Enforce temperature constraint
    const temperature = Math.min(options.temperature || 0.2, 0.3)
    
    try {
      const requestBody: OllamaGenerateRequest = {
        model,
        prompt,
        stream: false,
        options: {
          temperature,
        },
      }

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(this.timeout),
      })

      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error')
        throw new OllamaError(
          `Generation failed: ${response.status} ${response.statusText} - ${errorText}`,
          response.status
        )
      }

      const data: OllamaGenerateResponse = await response.json()
      
      // Convert to standard usage format
      const usage: UsageStats = {
        input_tokens: data.prompt_eval_count || 0,
        output_tokens: data.eval_count || 0,
      }

      return {
        text: data.response || '',
        usage,
      }
    } catch (error) {
      if (error instanceof OllamaError) {
        throw error
      }
      throw new OllamaError(
        `Generation request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        0,
        'REQUEST_FAILED'
      )
    }
  }

  /**
   * Check if a specific model is available
   */
  async hasModel(modelName: string): Promise<boolean> {
    try {
      const models = await this.listModels()
      return models.some(model => model.name === modelName)
    } catch (error) {
      return false
    }
  }
}

// Default instance for the application
export const ollama = new OllamaClient()

// Environment variable overrides
export const ollamaCustom = 
  typeof process !== 'undefined' && process.env.OLLAMA_BASE_URL
    ? new OllamaClient(
        process.env.OLLAMA_BASE_URL,
        parseInt(process.env.OLLAMA_TIMEOUT || '30000', 10)
      )
    : ollama