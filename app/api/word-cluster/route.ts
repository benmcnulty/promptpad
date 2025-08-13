import { NextResponse } from 'next/server'
import { ollama, OllamaError } from '@/lib/ollama'
import type { ClusterGenerationRequest, ClusterGenerationResponse } from '@/lib/vectorization/cluster-types'

export const dynamic = 'force-dynamic'

/**
 * POST /api/word-cluster
 * Body: { prompt: string, parentWord?: string, parentClusterId?: string, model: string, temperature: number }
 * Response: { words: string[], clusterId: string, usage, systemPrompt?, fallbackUsed? }
 */
export async function POST(req: Request) {
  let body: Partial<ClusterGenerationRequest> | undefined
  try {
    body = (await req.json()) as Partial<ClusterGenerationRequest>

    // Validate request
    if (!body || typeof body.prompt !== 'string' || body.prompt.trim().length === 0) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 })
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
      const mockWords = generateMockWords(body.prompt, body.parentWord)
      return NextResponse.json({
        words: mockWords,
        clusterId,
        usage: { input_tokens: body.prompt.length, output_tokens: mockWords.join(',').length },
        systemPrompt: buildWordClusterPrompt(body.prompt, body.parentWord),
      })
    }

    // Real generation via Ollama
    try {
      const prompt = buildWordClusterPrompt(body.prompt, body.parentWord)
      const startTime = Date.now()
      
      console.group(`🔗 Word Cluster API: ${model} (temp=${temperature})`)
      console.log(`📝 Input: "${body.prompt}"${body.parentWord ? ` (expanding: ${body.parentWord})` : ''}`)
      
      const { text: rawText, usage: usagePrimary } = await ollama.generate(model, prompt, { temperature })
      
      const duration = Date.now() - startTime
      console.log(`✅ Response: ${rawText.length} chars in ${duration}ms`)
      console.log(`📊 Tokens: ${usagePrimary.input_tokens} → ${usagePrimary.output_tokens}`)
      console.groupEnd()

      // Parse the response to extract exactly 12 words
      const words = parseWordClusterResponse(rawText)
      
      if (words.length !== 12) {
        console.warn(`⚠️ Expected 12 words, got ${words.length}. Adjusting...`)
        // Pad or trim to exactly 12 words
        while (words.length < 12) {
          words.push(`related_${words.length + 1}`)
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
      console.groupCollapsed(`💥 Word cluster generation failed`)
      console.error(`Model: ${model}, Prompt: ${body.prompt}`)
      console.error(`Error:`, err)
      console.groupEnd()
      
      // Development fallback
      const isDev = process.env.NODE_ENV !== 'production'
      if (isDev) {
        console.warn(`⚠️ Using development fallback (Ollama unavailable)`)
        const mockWords = generateMockWords(body.prompt, body.parentWord)
        return NextResponse.json({
          words: mockWords,
          clusterId,
          usage: { input_tokens: body.prompt.length, output_tokens: mockWords.join(',').length },
          systemPrompt: buildWordClusterPrompt(body.prompt, body.parentWord),
          fallbackUsed: true
        })
      }
      throw err
    }
  } catch (error) {
    console.groupCollapsed(`🚨 Word cluster endpoint error`)
    const prompt = body?.prompt ?? 'unknown'
    const model = body?.model ?? 'unknown'
    console.error(`Request: prompt "${prompt}" with model ${model}`)
    console.error(`Error type: ${error instanceof OllamaError ? 'OllamaError' : 'UnknownError'}`)
    console.error(`Details:`, error)
    console.groupEnd()
    
    const status = error instanceof OllamaError ? 503 : 500
    return NextResponse.json({ error: 'Word cluster service error' }, { status })
  }
}

function buildWordClusterPrompt(prompt: string, parentWord?: string): string {
  if (parentWord) {
    return [
      'You are a word association specialist. Generate exactly 12 words that are most closely related to the given WORD.',
      '',
      'Requirements:',
      '- Return exactly 12 single words (no phrases or compound words)',
      '- Words should be semantically related, conceptually connected, or contextually relevant',
      '- Include synonyms, related concepts, and associated terms',
      '- Avoid generic words like "the", "and", "very"',
      '- No repetition of the input word',
      '- No numbers or special characters',
      '- Return only the 12 words, separated by commas, nothing else',
      '',
      `WORD: ${parentWord}`,
      '',
      'Return exactly 12 related words (comma-separated):',
    ].join('\n')
  } else {
    return [
      'You are a semantic analysis specialist. Extract exactly 12 key words that best represent the core concepts in the given PROMPT.',
      '',
      'Requirements:',
      '- Return exactly 12 single words (no phrases or compound words)',
      '- Focus on the most important nouns, verbs, and descriptive terms',
      '- Include related concepts and thematic words',
      '- Avoid articles, prepositions, and generic terms',
      '- Extract meaningful semantic content',
      '- No repetition',
      '- No numbers or special characters',
      '- Return only the 12 words, separated by commas, nothing else',
      '',
      `PROMPT: ${prompt}`,
      '',
      'Return exactly 12 key words (comma-separated):',
    ].join('\n')
  }
}

function parseWordClusterResponse(rawText: string): string[] {
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

function generateMockWords(prompt: string, parentWord?: string): string[] {
  // Generate deterministic mock words based on the input
  const baseWords = parentWord 
    ? [`similar`, `related`, `connected`, `associated`, `linked`, `parallel`, `analogous`, `corresponding`, `equivalent`, `comparable`, `alike`, `matching`]
    : [`concept`, `idea`, `theme`, `topic`, `subject`, `element`, `aspect`, `feature`, `component`, `factor`, `dimension`, `attribute`]
  
  // Mix in some words derived from the input
  const inputWords = (parentWord || prompt)
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 2)
    .slice(0, 4)

  // Start from a full set of 12 and overlay input-derived words for variability
  const result = [...baseWords.slice(0, 12)]
  for (let i = 0; i < inputWords.length && i < 12; i++) {
    result[i] = inputWords[i]
  }
  return result.slice(0, 12)
}

function generateClusterId(): string {
  return `cluster_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}
