import { NextResponse } from 'next/server'
import { ollama, OllamaError } from '@/lib/ollama'
import type { ClusterGenerationResponse } from '@/lib/vectorization/cluster-types'

export const dynamic = 'force-dynamic'

interface ExpandClusterRequest {
  word: string
  parentClusterId: string
  originalPrompt: string
  model: string
  temperature: number
}

/**
 * POST /api/expand-cluster
 * Body: { word: string, parentClusterId: string, originalPrompt: string, model: string, temperature: number }
 * Response: { words: string[], clusterId: string, usage, systemPrompt?, fallbackUsed? }
 */
export async function POST(req: Request) {
  let body: Partial<ExpandClusterRequest> | undefined
  try {
    body = (await req.json()) as Partial<ExpandClusterRequest>

    // Validate request
    if (!body || typeof body.word !== 'string' || body.word.trim().length === 0) {
      return NextResponse.json({ error: 'Word is required' }, { status: 400 })
    }
    if (typeof body.parentClusterId !== 'string' || body.parentClusterId.length === 0) {
      return NextResponse.json({ error: 'Parent cluster ID is required' }, { status: 400 })
    }
    if (typeof body.originalPrompt !== 'string' || body.originalPrompt.length === 0) {
      return NextResponse.json({ error: 'Original prompt is required' }, { status: 400 })
    }
    if (typeof body.model !== 'string' || body.model.length === 0) {
      return NextResponse.json({ error: 'Model is required' }, { status: 400 })
    }
    if (typeof body.temperature !== 'number' || body.temperature < 0) {
      return NextResponse.json({ error: 'Temperature must be a number ≥ 0' }, { status: 400 })
    }

    const model = body.model || 'gpt-oss:20b'
    const temperature = Math.min(body.temperature ?? 0.2, 0.3)
    const clusterId = generateClusterId()

    // Mock mode for CI and offline usage
    if (process.env.OLLAMA_MOCK === '1') {
      const mockWords = generateMockExpansionWords(body.word, body.originalPrompt)
      return NextResponse.json({
        words: mockWords,
        clusterId,
        usage: { input_tokens: body.word.length + body.originalPrompt.length, output_tokens: mockWords.join(',').length },
        systemPrompt: buildExpandClusterPrompt(body.word, body.originalPrompt),
      })
    }

    // Real generation via Ollama
    try {
      const prompt = buildExpandClusterPrompt(body.word, body.originalPrompt)
      const startTime = Date.now()
      
      console.group(`🔗 Expand Cluster API: ${model} (temp=${temperature})`)
      console.log(`📝 Expanding word: "${body.word}" from context: "${body.originalPrompt}"`)
      console.log(`🔗 Parent cluster: ${body.parentClusterId}`)
      
      const { text: rawText, usage: usagePrimary } = await ollama.generate(model, prompt, { temperature })
      
      const duration = Date.now() - startTime
      console.log(`✅ Response: ${rawText.length} chars in ${duration}ms`)
      console.log(`📊 Tokens: ${usagePrimary.input_tokens} → ${usagePrimary.output_tokens}`)
      console.groupEnd()

      // Parse the response to extract exactly 12 words
      const words = parseExpansionResponse(rawText)
      
      if (words.length !== 12) {
        console.warn(`⚠️ Expected 12 words, got ${words.length}. Adjusting...`)
        // Pad or trim to exactly 12 words
        while (words.length < 12) {
          words.push(`expansion_${words.length + 1}`)
        }
        words.splice(12) // Trim to exactly 12
      }

      const response: ClusterGenerationResponse = {
        words,
        clusterId,
        usage: usagePrimary,
        systemPrompt: prompt
      }

      return NextResponse.json(response)
    } catch (err) {
      console.groupCollapsed(`💥 Cluster expansion failed`)
      console.error(`Model: ${model}, Word: ${body.word}`)
      console.error(`Error:`, err)
      console.groupEnd()
      
      // Development fallback
      const isDev = process.env.NODE_ENV !== 'production'
      if (isDev) {
        console.warn(`⚠️ Using development fallback (Ollama unavailable)`)
        const mockWords = generateMockExpansionWords(body.word, body.originalPrompt)
        return NextResponse.json({
          words: mockWords,
          clusterId,
          usage: { input_tokens: body.word.length + body.originalPrompt.length, output_tokens: mockWords.join(',').length },
          systemPrompt: buildExpandClusterPrompt(body.word, body.originalPrompt),
          fallbackUsed: true
        })
      }
      throw err
    }
  } catch (error) {
    console.groupCollapsed(`🚨 Expand cluster endpoint error`)
    const word = body?.word ?? 'unknown'
    const model = body?.model ?? 'unknown'
    console.error(`Request: expand "${word}" with model ${model}`)
    console.error(`Error type: ${error instanceof OllamaError ? 'OllamaError' : 'UnknownError'}`)
    console.error(`Details:`, error)
    console.groupEnd()
    
    const status = error instanceof OllamaError ? 503 : 500
    return NextResponse.json({ error: 'Cluster expansion service error' }, { status })
  }
}

function buildExpandClusterPrompt(word: string, originalPrompt: string): string {
  return [
    'You are a semantic expansion specialist. Generate exactly 12 words that deeply explore the given WORD within the context of the ORIGINAL PROMPT.',
    '',
    'Requirements:',
    '- Return exactly 12 single words (no phrases or compound words)',
    '- Focus on words that relate to both the specific WORD and the broader context',
    '- Include synonyms, subcategories, related actions, properties, and applications',
    '- Prioritize words that would be meaningful for someone exploring this concept',
    '- Avoid the original word and generic terms',
    '- No repetition, numbers, or special characters',
    '- Return only the 12 words, separated by commas, nothing else',
    '',
    `ORIGINAL PROMPT: ${originalPrompt}`,
    `WORD TO EXPAND: ${word}`,
    '',
    'Return exactly 12 expansion words (comma-separated):',
  ].join('\n')
}

function parseExpansionResponse(rawText: string): string[] {
  // Clean up the response and extract words
  const cleaned = rawText
    .replace(/^[^a-zA-Z]*/, '') // Remove non-letter prefixes
    .replace(/[^a-zA-Z,\s]/g, '') // Keep only letters, commas, and spaces
    .toLowerCase()
    .trim()

  // Split by commas and clean each word
  const words = cleaned
    .split(',')
    .map(word => word.trim())
    .filter(word => word.length > 0 && word.length < 20) // Reasonable word length
    .slice(0, 12) // Take at most 12 words

  return words
}

function generateMockExpansionWords(word: string, originalPrompt: string): string[] {
  // Generate deterministic mock words for expansion
  const expansionPrefixes = [`detailed`, `specific`, `focused`, `deeper`, `advanced`, `specialized`]
  const conceptSuffixes = [`aspect`, `element`, `feature`, `property`, `characteristic`, `dimension`]
  
  // Create words that combine the original word with expansion concepts
  const expandedWords = [
    `${word}ing`,
    `${word}ed`,
    `${word}er`,
    `${word}ly`,
    ...expansionPrefixes.slice(0, 4),
    ...conceptSuffixes.slice(0, 4)
  ]
  
  return expandedWords.slice(0, 12)
}

function generateClusterId(): string {
  return `expand_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}