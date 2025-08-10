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
        const prompt = buildRefinePrompt(input)
        const output = `Refined Prompt for: ${input}`
        return NextResponse.json({
          output,
          usage: { input_tokens: input.length, output_tokens: output.length },
          systemPrompt: prompt,
        })
      } else {
        const draft = body.draft as string
        const prompt = buildReinforcePrompt(draft)
        const output = `Reinforced Draft: ${draft}`
        return NextResponse.json({
          output,
          usage: { input_tokens: draft.length, output_tokens: output.length },
          // Minimal viable patch: replace entire content
          patch: [
            { op: 'replace', from: [0, draft.length], to: output },
          ],
          systemPrompt: prompt,
        })
      }
    }

    // Real generation via Ollama with graceful fallback in development
    try {
      if (body.mode === 'refine') {
        const input = body.input as string
        const prompt = buildRefinePrompt(input)
        console.log(`🔄 Refine API: Sending prompt to Ollama (${model})`)
        console.log(`📝 System prompt:`, prompt)
        const { text, usage } = await ollama.generate(model, prompt, { temperature })
        console.log(`✅ Refine API: Got response from Ollama (${text.length} chars)`)
        console.log(`📊 Usage:`, usage)
        
        // Clean up any unwanted prefixes the model might add
        const cleanedText = text
          .replace(/^\*\*Prompt:\*\*\s*/i, '')
          .replace(/^Prompt:\s*/i, '')
          .replace(/^# Prompt\s*/i, '')
          .replace(/^Here's the (refined|reinforced) prompt:\s*/i, '')
          .replace(/^"([\s\S]*)"$/, '$1') // Remove surrounding quotes without dotAll flag
          .trim()
        
        return NextResponse.json({ output: cleanedText, usage, systemPrompt: prompt })
      } else {
        const draft = body.draft as string
        const prompt = buildReinforcePrompt(draft)
        console.log(`🔄 Reinforce API: Sending prompt to Ollama (${model})`)
        console.log(`📝 System prompt:`, prompt)
        const { text, usage } = await ollama.generate(model, prompt, { temperature })
        console.log(`✅ Reinforce API: Got response from Ollama (${text.length} chars)`)
        
        // Clean up any unwanted prefixes the model might add
        const cleanedText = text
          .replace(/^\*\*Prompt:\*\*\s*/i, '')
          .replace(/^Prompt:\s*/i, '')
          .replace(/^# Prompt\s*/i, '')
          .replace(/^Here's (an? )?(enhanced|improved|refined|reinforced) (version of the )?.*?prompt:\s*/i, '')
          .replace(/^"([\s\S]*)"$/, '$1') // Remove surrounding quotes without dotAll flag
          .replace(/\n\n(I made the following improvements|Let me know if|The improvements include)[\s\S]*$/i, '') // Remove trailing meta-commentary
          .trim()
        
        const patch = [{ op: 'replace', from: [0, draft.length], to: cleanedText }]
        return NextResponse.json({ output: cleanedText, usage, patch, systemPrompt: prompt })
      }
    } catch (err) {
      console.error(`💥 Ollama generation failed:`, err)
      // If Ollama is unavailable and we're in development, return deterministic fallback
      const isDev = process.env.NODE_ENV !== 'production'
      if (isDev) {
        console.log(`⚠️ Using development fallback (Ollama unavailable)`)
        if (body.mode === 'refine') {
          const input = body.input as string
          const prompt = buildRefinePrompt(input)
          const output = `[DEV FALLBACK] Here's your refined prompt for "${input}":\n\n# Creative Story Prompt\n\nWrite an engaging short story about a cat named Pupper. The story should:\n\n- Be 500-800 words in length\n- Include character development showing Pupper's unique personality\n- Feature an interesting conflict or adventure\n- Have a satisfying resolution\n- Use vivid descriptions to bring scenes to life\n- Appeal to readers who enjoy heartwarming pet stories\n\nConsider including elements like Pupper's daily routine, interactions with humans or other animals, and what makes this cat special or memorable.`
          
          return NextResponse.json({
            output,
            usage: { input_tokens: input.length, output_tokens: output.length },
            systemPrompt: prompt,
            fallbackUsed: true
          })
        } else {
          const draft = body.draft as string
          const prompt = buildReinforcePrompt(draft)
          const output = `[DEV FALLBACK] Here's your reinforced prompt:\n\n# Enhanced Creative Story Prompt\n\nWrite a compelling short story about a cat named Pupper with the following specifications:\n\n## Core Requirements\n- Length: 500-800 words\n- Genre: Heartwarming pet fiction\n- Protagonist: Pupper (cat with distinct personality)\n\n## Story Elements\n- **Character Arc**: Show Pupper's growth or reveal hidden traits\n- **Conflict**: Include meaningful challenge or adventure\n- **Resolution**: Satisfying conclusion that ties to the character development\n- **Setting**: Vivid descriptions of environments\n\n## Writing Style\n- Use sensory details to immerse readers\n- Balance dialogue and narrative\n- Target audience: General readers who enjoy uplifting animal stories\n\n## Optional Elements\n- Daily routine that reveals character\n- Relationships with humans/other pets\n- Unique quirks that make Pupper memorable`
          
          return NextResponse.json({
            output,
            usage: { input_tokens: draft.length, output_tokens: output.length },
            patch: [{ op: 'replace', from: [0, draft.length], to: output }],
            systemPrompt: prompt,
            fallbackUsed: true
          })
        }
      }
      throw err
    }
  } catch (error) {
    console.error('Refine endpoint error:', error)
    const status = error instanceof OllamaError ? 503 : 500
    return NextResponse.json({ error: 'Refine service error' }, { status })
  }
}

function buildRefinePrompt(input: string): string {
  return [
    'You are Promptpad, a prompt-drafting assistant. Expand terse instructions into copy-ready prompts.',
    '',
    'Transform the INPUT into a detailed, actionable prompt that another AI can execute without further clarification.',
    '',
    '- Clarify goals and success criteria',
    '- Add helpful constraints (length, tone, audience, style, format)',
    '- Structure with bullets or sections for clarity',
    '- Preserve user intent while eliminating ambiguity',
    '- Never include AI technical parameters (temperature, system role, model selection)',
    '',
    'INPUT: ' + input,
    '',
    'Write the refined prompt:',
  ].join('\n')
}

function buildReinforcePrompt(draft: string): string {
  return [
    'You are Promptpad, a prompt optimization specialist. Tighten the DRAFT into a more precise, professional prompt.',
    '',
    'Requirements:',
    '- Preserve original intent and useful details; prefer minimal edits',
    '- Replace vague terms with measurable, verifiable criteria',
    '- Add only essential constraints (length, tone, style, format, audience)',
    '- Ensure logical flow; organize with concise sections and bullets as needed',
    '- Keep variable placeholders (e.g., {audience}) if already present; introduce only when clearly beneficial',
    '- No AI parameters (temperature, model, system role)',
    '- No commentary or labels; return only the improved prompt content',
    '',
    'DRAFT: ' + draft,
    '',
    'Return only the reinforced prompt content—no headers, no explanations.',
  ].join('\n')
}
