import { NextResponse } from 'next/server'
import { ollama, OllamaError } from '@/lib/ollama'

export const dynamic = 'force-dynamic'

interface RefineRequestBody {
  mode: 'refine' | 'reinforce' | 'spec'
  input?: string
  draft?: string
  model: string
  temperature: number
}

/**
 * POST /api/refine
 * Body: { mode: 'refine'|'reinforce'|'spec', input?, draft?, model, temperature }
 * Response: { output, usage, patch?, steps? }
 */
export async function POST(req: Request) {
  let body: Partial<RefineRequestBody> | undefined
  try {
    body = (await req.json()) as Partial<RefineRequestBody>

    // Basic contract validation (schema lives in docs/agents/schemas)
    if (!body || (body.mode !== 'refine' && body.mode !== 'reinforce' && body.mode !== 'spec')) {
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
    if (body.mode === 'spec' && (!body.input || body.input.length === 0)) {
      return NextResponse.json({ error: 'Input is required for spec mode' }, { status: 400 })
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
      } else if (body.mode === 'reinforce') {
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
      } else {
        const input = body.input as string
        const prompt = buildSpecPrompt(input)
        const output = `# ${input} - Development Plan\n\n## Project Overview\nA focused development specification for building: ${input}\n\n**Core Goals**: Create a functional, user-friendly application\n**Approach**: Start simple, use proven technologies\n\n## Recommended Technology Stack\n- **Frontend**: React + TypeScript\n- **Backend**: Node.js + Express  \n- **Database**: PostgreSQL\n- **Styling**: Tailwind CSS\n\n## Implementation Roadmap\n\n**Phase 1**: Foundation\n- Set up project structure\n- Implement basic functionality\n- Create user interface\n\n**Phase 2**: Enhancement\n- Add advanced features\n- Improve user experience\n- Deploy and test\n\n## Key Considerations\n- Keep code simple and maintainable\n- Focus on user needs first\n- Use established libraries and patterns`
        return NextResponse.json({
          output,
          usage: { input_tokens: input.length, output_tokens: output.length },
          systemPrompt: prompt,
        })
      }
    }

    // Real generation via Ollama with graceful fallback in development
    try {
      if (body.mode === 'refine') {
        const input = body.input as string
        const prompt = buildRefinePrompt(input)
        // Browser console logging for developers (separate from debug terminal)
        const startTime = Date.now()
        console.group(`🔄 Refine API: ${model} (temp=${temperature})`)
        console.log(`📝 Input tokens: ~${body.input?.length || 0} chars`)
        
        const { text, usage } = await ollama.generate(model, prompt, { temperature })
        
        const duration = Date.now() - startTime
        console.log(`✅ Response: ${text.length} chars in ${duration}ms`)
        console.log(`📊 Tokens: ${usage.input_tokens} → ${usage.output_tokens} (ratio: ${(usage.output_tokens / usage.input_tokens).toFixed(2)}x)`)
        console.groupEnd()
        
        // Clean up any unwanted prefixes the model might add
        const cleanedText = text
          .replace(/^\*\*Prompt:\*\*\s*/i, '')
          .replace(/^Prompt:\s*/i, '')
          .replace(/^# Prompt\s*/i, '')
          .replace(/^Here's the (refined|reinforced) prompt:\s*/i, '')
          .replace(/^"([\s\S]*)"$/, '$1') // Remove surrounding quotes without dotAll flag
          .trim()
        
        return NextResponse.json({ output: cleanedText, usage, systemPrompt: prompt })
      } else if (body.mode === 'reinforce') {
        const draft = body.draft as string
        const prompt = buildReinforcePrompt(draft)
        // Browser console logging for developers (separate from debug terminal)
        const startTime = Date.now()
        console.group(`🔄 Reinforce API: ${model} (temp=${temperature})`)
        console.log(`📝 Draft tokens: ~${body.draft?.length || 0} chars`)
        
        const { text, usage } = await ollama.generate(model, prompt, { temperature })
        
        const duration = Date.now() - startTime
        console.log(`✅ Response: ${text.length} chars in ${duration}ms`)
        console.log(`📊 Tokens: ${usage.input_tokens} → ${usage.output_tokens} (ratio: ${(usage.output_tokens / usage.input_tokens).toFixed(2)}x)`)
        console.groupEnd()
        
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
      } else {
        // Spec mode - multi-step processing
        const input = body.input as string
        const prompt = buildSpecPrompt(input)
        // Browser console logging for developers (separate from debug terminal)
        const startTime = Date.now()
        console.group(`🔄 Spec API: ${model} (temp=${temperature})`)
        console.log(`📝 Input tokens: ~${body.input?.length || 0} chars`)
        
        const { text, usage } = await ollama.generate(model, prompt, { temperature })
        
        const duration = Date.now() - startTime
        console.log(`✅ Response: ${text.length} chars in ${duration}ms`)
        console.log(`📊 Tokens: ${usage.input_tokens} → ${usage.output_tokens} (ratio: ${(usage.output_tokens / usage.input_tokens).toFixed(2)}x)`)
        console.groupEnd()
        
        // Clean up any unwanted prefixes the model might add
        const cleanedText = text
          .replace(/^\*\*Specification:\*\*\s*/i, '')
          .replace(/^Specification:\s*/i, '')
          .replace(/^# Specification\s*/i, '')
          .replace(/^Here's the (detailed|comprehensive) (project )?specification:\s*/i, '')
          .replace(/^"([\s\S]*)"$/, '$1') // Remove surrounding quotes without dotAll flag
          .trim()
        
        return NextResponse.json({ output: cleanedText, usage, systemPrompt: prompt })
      }
    } catch (err) {
      // Structured error logging for developers
      console.groupCollapsed(`💥 Ollama generation failed`)
      console.error(`Model: ${model}, Mode: ${body.mode}`)
      console.error(`Error:`, err)
      console.groupEnd()
      
      // If Ollama is unavailable and we're in development, return deterministic fallback
      const isDev = process.env.NODE_ENV !== 'production'
      if (isDev) {
        console.warn(`⚠️ Using development fallback (Ollama unavailable)`)
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
        } else if (body.mode === 'reinforce') {
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
        } else {
          const input = body.input as string
          const prompt = buildSpecPrompt(input)
          const output = `[DEV FALLBACK] Here's your project specification for "${input}":\n\n# ${input} - Development Plan\n\n## Project Overview\nA modern ${input} application focused on user experience and maintainable code.\n\n**Core Goals**: Build a functional, user-friendly ${input} that solves the main user needs\n**Target Users**: Primary users who need ${input} functionality\n**Key Constraints**: Keep it simple, use proven technologies\n\n## Recommended Approach\n\n**Technology Stack**:\n- Frontend: React + TypeScript for reliability\n- Backend: Node.js + Express (simple and proven)\n- Database: PostgreSQL for data persistence\n- Styling: Tailwind CSS for rapid development\n\n**Architecture Pattern**: Start with a simple monolithic structure\n- Single codebase for faster development\n- Clear separation between frontend and backend\n- RESTful API design\n\n**Core Features to Build First**:\n1. User authentication (login/signup)\n2. Main ${input} functionality\n3. Basic user interface\n4. Data persistence\n\n## Implementation Guidance\n\n**Phase 1: Foundation** (Week 1-2)\n- Set up project structure\n- Implement basic authentication\n- Create database schema\n- Build core API endpoints\n\n**Phase 2: Core Features** (Week 3-4)\n- Develop main ${input} functionality\n- Build user interface components\n- Connect frontend to API\n- Add basic error handling\n\n**Phase 3: Polish** (Week 5+)\n- Improve user experience\n- Add testing\n- Deploy to production\n- Gather user feedback\n\n**Key Technical Considerations**:\n- Use environment variables for configuration\n- Implement proper error handling\n- Add input validation\n- Consider mobile responsiveness\n\n**Recommended Libraries**:\n- React Query for data fetching\n- React Router for navigation\n- Zod for schema validation\n- Prisma for database ORM`
          
          return NextResponse.json({
            output,
            usage: { input_tokens: input.length, output_tokens: output.length },
            systemPrompt: prompt,
            fallbackUsed: true
          })
        }
      }
      throw err
    }
  } catch (error) {
    // High-level error logging for developers
    console.groupCollapsed(`🚨 Refine endpoint error`)
    const mode = body?.mode ?? 'unknown'
    const model = body?.model ?? 'unknown'
    console.error(`Request: ${mode} mode with model ${model}`)
    console.error(`Error type: ${error instanceof OllamaError ? 'OllamaError' : 'UnknownError'}`)
    console.error(`Details:`, error)
    console.groupEnd()
    
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

/**
 * Builds the system prompt for generating detailed coding project specifications
 * 
 * Creates comprehensive project specifications with intelligent technology 
 * recommendations based on the input requirements.
 * 
 * @param input - Brief project description or requirements
 * @returns System prompt for the spec operation
 */
function buildSpecPrompt(input: string): string {
  return [
    'You are Promptpad Spec, a project specification assistant. Transform the INPUT into a clear, actionable development prompt with practical technology guidance.',
    '',
    'Create a focused specification that includes:',
    '',
    '**Project Overview**',
    '- Clear description of what needs to be built',
    '- Primary user goals and key functionality',
    '- Project scope and main constraints',
    '',
    '**Recommended Approach**',
    '- Suggest appropriate technology stack (keep it simple and mainstream)',
    '- Recommend project structure or architecture pattern',
    '- Identify 3-4 core features to implement first',
    '',
    '**Implementation Guidance**',
    '- Break down development into logical phases',
    '- Highlight important technical considerations',
    '- Suggest key libraries or frameworks to use',
    '',
    '**Development Focus**',
    '- Prioritize user experience and core functionality',
    '- Keep technology choices modern but well-established',
    '- Structure as an actionable development plan',
    '',
    'Guidelines:',
    '- Focus on practical implementation, not exhaustive analysis',
    '- Avoid over-engineering - suggest the simplest approach that works',
    '- Keep recommendations concise and developer-friendly',
    '- No deep technical architecture details unless essential',
    '- Structure as a clear development roadmap',
    '',
    'INPUT: ' + input,
    '',
    'Generate the focused project specification:',
  ].join('\n')
}
