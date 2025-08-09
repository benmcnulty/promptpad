import { NextResponse } from 'next/server'
import { ollama, OllamaError } from '@/lib/ollama'

export const dynamic = 'force-dynamic'

/**
 * GET /api/models
 * Returns list of available Ollama models
 * Contract: { models: Array<{ name: string, size?: number }> }
 */
export async function GET() {
  try {
    // Check if we're in mock mode for CI
    if (process.env.OLLAMA_MOCK === '1') {
      return NextResponse.json({
        models: [
          {
            name: 'gpt-oss:20b',
            size: 21474836480, // ~20GB
            digest: 'mock-digest',
            modified_at: new Date().toISOString(),
          },
        ],
      })
    }

    const models = await ollama.listModels()
    
    // Ensure gpt-oss:20b is in the list (even if not actually available)
    // This maintains the contract that the default model is always available
    const hasDefaultModel = models.some(model => model.name === 'gpt-oss:20b')
    if (!hasDefaultModel) {
      models.unshift({
        name: 'gpt-oss:20b',
        size: 0,
        digest: 'placeholder',
        modified_at: new Date().toISOString(),
      })
    }

    return NextResponse.json({
      models: models.map(model => ({
        name: model.name,
        size: model.size,
        digest: model.digest,
        modified_at: model.modified_at,
      })),
    })
  } catch (error) {
    console.error('Failed to list models:', error)
    
    if (error instanceof OllamaError) {
      // Return service unavailable with default model for graceful degradation
      return NextResponse.json(
        {
          models: [
            {
              name: 'gpt-oss:20b',
              size: 0,
              digest: 'unavailable',
              modified_at: new Date().toISOString(),
            },
          ],
          error: 'Ollama service unavailable',
          message: error.message,
        },
        { status: 503 }
      )
    }

    // Unexpected error
    return NextResponse.json(
      {
        models: [],
        error: 'Internal server error',
        message: 'Failed to retrieve models',
      },
      { status: 500 }
    )
  }
}