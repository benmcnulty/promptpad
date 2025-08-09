import { NextResponse } from 'next/server'
import { ollama, OllamaError } from '@/lib/ollama'

export const dynamic = 'force-dynamic'

interface RefineRequestBody {
  mode: 'refine' | 'reinforce'
  input?: string
  draft?: string
  model: string
  temperature: number
}

/**
 * POST /api/refine
 * Body: { mode: 'refine'|'reinforce', input?, draft?, model, temperature }
 * Response: { output, usage, patch? }
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<RefineRequestBody>

    // Basic contract validation (schema lives in docs/agents/schemas)
    if (!body || (body.mode !== 'refine' && body.mode !== 'reinforce')) {
      return NextResponse.json({ error: 'Invalid mode' }, { status: 400 })
    }
    if (typeof body.model !== 'string' || body.model.length === 0) {
      return NextResponse.json({ error: 'Model is required' }, { status: 400 })
    }
    if (typeof body.temperature !== 'number' || body.temperature < 0) {
      return NextResponse.json({ error: 'Temperature must be a number ≥ 0' }, { status: 400 })
    }
    if (body.mode === 'refine' && (!body.input || body.input.length === 0)) {
      return NextResponse.json({ error: 'Input is required for refine mode' }, { status: 400 })
    }
    if (body.mode === 'reinforce' && (!body.draft || body.draft.length === 0)) {
      return NextResponse.json({ error: 'Draft is required for reinforce mode' }, { status: 400 })
    }

    const model = body.model || 'gpt-oss:20b'
    const temperature = Math.min(body.temperature ?? 0.2, 0.3)

    // Mock mode for CI and offline usage
    if (process.env.OLLAMA_MOCK === '1') {
      if (body.mode === 'refine') {
        const input = body.input as string
        const output = `Refined Prompt for: ${input}`
        return NextResponse.json({
          output,
          usage: { input_tokens: input.length, output_tokens: output.length },
        })
      } else {
        const draft = body.draft as string
        const output = `Reinforced Draft: ${draft}`
        return NextResponse.json({
          output,
          usage: { input_tokens: draft.length, output_tokens: output.length },
          // Minimal viable patch: replace entire content
          patch: [
            { op: 'replace', from: [0, draft.length], to: output },
          ],
        })
      }
    }

    // Real generation via Ollama
    if (body.mode === 'refine') {
      const input = body.input as string
      const prompt = buildRefinePrompt(input)
      const { text, usage } = await ollama.generate(model, prompt, { temperature })
      return NextResponse.json({ output: text, usage })
    } else {
      const draft = body.draft as string
      const prompt = buildReinforcePrompt(draft)
      const { text, usage } = await ollama.generate(model, prompt, { temperature })
      // MVP patch: full replacement
      const patch = [{ op: 'replace', from: [0, draft.length], to: text }]
      return NextResponse.json({ output: text, usage, patch })
    }
  } catch (error) {
    console.error('Refine endpoint error:', error)
    const status = error instanceof OllamaError ? 503 : 500
    return NextResponse.json({ error: 'Refine service error' }, { status })
  }
}

function buildRefinePrompt(input: string): string {
  return [
    'You are Promptpad, a prompt-drafting assistant.',
    'Task: Generate a structured, copy-ready prompt from the given INPUT.',
    'Constraints:',
    '- Keep temperature ≤ 0.3.',
    '- Be clear, actionable, and concise.',
    '- Include goals, constraints, tone, variables as appropriate.',
    '',
    'INPUT:',
    input,
    '',
    'OUTPUT: Provide only the final prompt, no explanation.',
  ].join('\n')
}

function buildReinforcePrompt(draft: string): string {
  return [
    'You are Promptpad, a prompt-drafting assistant.',
    'Task: Tighten coordination of the DRAFT prompt by improving goals, constraints, tone, and variables while preserving intent.',
    'Constraints:',
    '- Keep temperature ≤ 0.3.',
    '- Maintain clarity and professionalism.',
    '- Avoid adding extraneous commentary.',
    '',
    'DRAFT:',
    draft,
    '',
    'OUTPUT: Provide only the improved full prompt, no explanation.',
  ].join('\n')
}

