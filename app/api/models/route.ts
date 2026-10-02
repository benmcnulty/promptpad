import { NextResponse } from 'next/server'
import { OllamaError } from '@/lib/ollama'
import { getServerOllama } from '@/lib/ollama-server'

export const dynamic = 'force-dynamic'

/**
 * GET /api/models
 * Returns an array of available models per frozen contract.
 * Shape: Array<{ name: string, family: string, parameters: string, default?: boolean }>
 */
export async function GET(req: Request) {
  try {
    const client = getServerOllama(req)
    // Mock mode for CI and local development without Ollama
    if (process.env.OLLAMA_MOCK === '1') {
      return NextResponse.json([
        { name: 'gpt-oss:20b', family: 'gpt-oss', parameters: '20b', default: true },
        { name: 'llama3.2:8b', family: 'llama', parameters: '8b' },
      ])
    }

    const models = await client.listModels()

    const normalized = normalizeModels(models)
    normalized.forEach(model => {
      if (model.name === 'gpt-oss:20b') model.default = true
    })

    return NextResponse.json(normalized)
  } catch (error) {
    if (error instanceof OllamaError && error.code === 'ENDPOINT_NOT_ALLOWED') {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    // Structured error logging for developers
    console.groupCollapsed(`🚨 Models API error`)
    console.error(`Ollama base URL: ${process.env.OLLAMA_BASE_URL || 'http://localhost:11434'}`)
    console.error(`Error type: ${error instanceof OllamaError ? 'OllamaError' : error instanceof Error ? error.constructor.name : typeof error}`)
    console.error(`Details:`, error)
    console.groupEnd()

    // On failure, still return a valid array with default entry, set status for consumers
    const status = error instanceof OllamaError ? 503 : 500
    return NextResponse.json([
      { name: 'gpt-oss:20b', family: 'gpt-oss', parameters: '20b', default: true },
    ], { status })
  }
}

function normalizeModels(models: { name: string }[]): Array<{ name: string; family: string; parameters: string; default?: boolean }> {
  return models.map(({ name }) => {
    // Heuristic parsing of family and parameters
    // Examples: "gpt-oss:20b" → family=gpt-oss, parameters=20b
    //           "llama3.2:8b" → family=llama, parameters=8b
    //           "qwen2.5"     → family=qwen, parameters=unknown
    let family = 'unknown'
    let parameters = 'unknown'

    const colonMatch = name.match(/^([^:]+):([0-9]+[a-zA-Z]+)$/)
    if (colonMatch) {
      family = colonMatch[1].replace(/\d+.*$/, '') || colonMatch[1]
      parameters = colonMatch[2]
    } else {
      const paramMatch = name.match(/(\d+)[bBkKmMgG]?/)
      if (paramMatch) parameters = `${paramMatch[1]}b`
      family = name.split(/[:\-]/)[0].replace(/\d+.*$/, '') || name
    }

    return { name, family, parameters }
  })
}
