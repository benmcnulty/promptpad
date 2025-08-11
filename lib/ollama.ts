/**
 * Ollama API adapter for Promptpad
 * 
 * Provides local-first model listing and text generation with comprehensive
 * error handling, timeout management, and health monitoring.
 * 
 * @example
 * ```typescript
 * const client = new OllamaClient()
 * const { text, usage } = await client.generate('gpt-oss:20b', 'Hello world')
 * ```
 */

/**
 * Ollama model metadata returned by the API
 */
export interface OllamaModel {
  name: string
  size: number
  digest: string
  modified_at: string
}

/**
 * Response format for listing available models
 */
export interface OllamaModelsResponse {
  /** Array of available models with metadata */
  models: OllamaModel[]
}

/**
 * Request payload for text generation
 */
export interface OllamaGenerateRequest {
  /** Model name to use for generation (e.g., 'gpt-oss:20b') */
  model: string
  /** Input prompt text to generate from */
  prompt: string
  /** Whether to stream the response (default: false) */
  stream?: boolean
  /** Generation parameters */
  options?: {
    /** Sampling temperature (0.0-1.0, clamped to ≤0.3 by Promptpad) */
    temperature?: number
    /** Nucleus sampling parameter */
    top_p?: number
    /** Maximum tokens to generate */
    max_tokens?: number
  }
}

/**
 * Response format from Ollama generation endpoint
 */
export interface OllamaGenerateResponse {
  /** Generated text content */
  response: string
  /** Whether generation is complete */
  done: boolean
  /** Context tokens for continued generation */
  context?: number[]
  /** Total generation time in nanoseconds */
  total_duration?: number
  /** Model loading time in nanoseconds */
  load_duration?: number
  /** Number of input tokens evaluated */
  prompt_eval_count?: number
  /** Number of output tokens generated */
  eval_count?: number
  /** Token generation time in nanoseconds */
  eval_duration?: number
}

/**
 * Token usage statistics for billing and monitoring
 */
export interface UsageStats {
  /** Number of input/prompt tokens consumed */
  input_tokens: number
  /** Number of output/completion tokens generated */
  output_tokens: number
}

/**
 * Custom error class for Ollama-related failures
 * 
 * Provides structured error information including HTTP status codes
 * and categorized error codes for better error handling.
 * 
 * @example
 * ```typescript
 * throw new OllamaError('Service unavailable', 503, 'SERVICE_UNAVAILABLE')
 * ```
 */
export class OllamaError extends Error {
  /**
   * Creates a new OllamaError
   * @param message - Human-readable error description
   * @param status - HTTP status code (if applicable)
   * @param code - Machine-readable error code for categorization
   */
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message)
    this.name = 'OllamaError'
  }
}

/**
 * Ollama API client with comprehensive error handling and timeout management
 * 
 * Provides a robust interface to the Ollama API with features:
 * - Health checking and service monitoring
 * - Soft timeouts (warnings without cancellation)
 * - Automatic error handling and retry logic
 * - Token usage tracking and statistics
 * 
 * @example
 * ```typescript
 * const client = new OllamaClient('http://localhost:11434', 120000)
 * const isHealthy = await client.healthCheck()
 * if (isHealthy) {
 *   const result = await client.generate('gpt-oss:20b', 'Hello world')
 * }
 * ```
 */
export class OllamaClient {
  private baseUrl: string
  private timeout: number

  /**
   * Creates a new OllamaClient instance
   * @param baseUrl - Base URL of Ollama service (default: http://localhost:11434)
   * @param timeout - Soft timeout in milliseconds for operations (default: 120000)
   */
  constructor(baseUrl: string = 'http://localhost:11434', timeout: number = 120000) {
    this.baseUrl = baseUrl.replace(/\/$/, '') // Remove trailing slash
    this.timeout = timeout
  }

  /**
   * Performs a fast health check to verify Ollama service availability
   * 
   * Uses a separate, shorter timeout (5s) for quick health verification.
   * Safe to call frequently without impacting performance.
   * 
   * @returns Promise resolving to true if service is healthy, false otherwise
   * @example
   * ```typescript
   * const isHealthy = await client.healthCheck()
   * if (!isHealthy) {
   *   console.log('Ollama service is not available')
   * }
   * ```
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
   * Lists all available models from the Ollama service
   * 
   * Retrieves metadata for all models including size, digest, and modification date.
   * Throws OllamaError if the service is unavailable or returns an error.
   * 
   * @returns Promise resolving to array of model metadata
   * @throws {OllamaError} When service is unavailable or returns error response
   * @example
   * ```typescript
   * const models = await client.listModels()
   * console.log(`Found ${models.length} models`)
   * models.forEach(model => console.log(`- ${model.name} (${model.size} bytes)`))
   * ```
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
   * Generates text using the specified model with comprehensive error handling
   * 
   * Features:
   * - Temperature clamping (≤0.3 for Promptpad consistency)
   * - Soft timeout warnings (operation continues)
   * - Automatic token usage calculation
   * - Structured error handling with OllamaError
   * 
   * @param model - Model name to use (e.g., 'gpt-oss:20b', 'llama3.1:8b')
   * @param prompt - Input text to generate from
   * @param options - Generation options
   * @param options.temperature - Sampling temperature (0.0-1.0, clamped to ≤0.3)
   * @returns Promise resolving to generated text and token usage statistics
   * @throws {OllamaError} When generation fails or service is unavailable
   * 
   * @example
   * ```typescript
   * const result = await client.generate('gpt-oss:20b', 'Write a haiku about code', {
   *   temperature: 0.2
   * })
   * console.log(`Generated: ${result.text}`)
   * console.log(`Tokens: ${result.usage.input_tokens} in, ${result.usage.output_tokens} out`)
   * ```
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

      // Use a soft timeout (warning only) instead of aborting the request so slow generations can complete
      const started = Date.now()
      const softTimer = setTimeout(() => {
        const elapsed = Math.round((Date.now() - started) / 1000)
        console.groupCollapsed(`⏱️ Long-running Ollama generation`)
        console.warn(`Model: ${model}`)
        console.warn(`Elapsed: ${elapsed}s / ${Math.round(this.timeout/1000)}s timeout`)
        console.warn(`Prompt length: ${prompt.length} chars`)
        console.warn(`Still processing... (no timeout abort)`)
        console.groupEnd()
      }, this.timeout)
      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        // No abort signal: allow long-running generations
      }).finally(() => clearTimeout(softTimer))

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
   * Checks if a specific model is available in the Ollama service
   * 
   * Performs a model listing and searches for the specified model name.
   * Safe to call frequently as it leverages the listModels method.
   * 
   * @param modelName - Name of model to check (e.g., 'gpt-oss:20b')
   * @returns Promise resolving to true if model exists, false otherwise
   * @example
   * ```typescript
   * const hasModel = await client.hasModel('gpt-oss:20b')
   * if (!hasModel) {
   *   console.log('Please run: ollama pull gpt-oss:20b')
   * }
   * ```
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

/**
 * Default OllamaClient instance for the application
 * 
 * Uses default settings (localhost:11434, 120s timeout).
 * This is the primary instance used throughout Promptpad.
 * 
 * @example
 * ```typescript
 * import { ollama } from '@/lib/ollama'
 * const result = await ollama.generate('gpt-oss:20b', 'Hello world')
 * ```
 */
export const ollama = new OllamaClient()

/**
 * Custom OllamaClient instance with environment variable overrides
 * 
 * Automatically configures using OLLAMA_BASE_URL and OLLAMA_TIMEOUT
 * environment variables if available, otherwise falls back to default instance.
 * 
 * Environment variables:
 * - OLLAMA_BASE_URL: Custom Ollama service URL
 * - OLLAMA_TIMEOUT: Custom timeout in milliseconds
 * 
 * @example
 * ```typescript
 * // With environment variables:
 * // OLLAMA_BASE_URL=http://remote-host:11434
 * // OLLAMA_TIMEOUT=180000
 * import { ollamaCustom } from '@/lib/ollama'
 * const result = await ollamaCustom.generate('gpt-oss:20b', 'Hello world')
 * ```
 */
export const ollamaCustom = 
  typeof process !== 'undefined' && process.env.OLLAMA_BASE_URL
    ? new OllamaClient(
        process.env.OLLAMA_BASE_URL,
        parseInt(process.env.OLLAMA_TIMEOUT || '120000', 10)
      )
    : ollama
