# LLM Processes: Refine, Reinforce, and Spec

## Overview

Promptpad implements a sophisticated **multi-modal LLM workflow** designed to transform terse instructions into professional, copy-ready prompts and comprehensive project specifications. This document provides comprehensive technical details on all three processes to enable team optimization and understanding.

## Architecture Summary

```
User Input → Process Selection → LLM Generation → Response Cleaning → UI Update
     ↓              ↓                    ↓               ↓              ↓
  Validation   System Prompt      Ollama API     Meta-commentary    Patch/Display
     ↓              ↓                    ↓          Removal             ↓
   Refine     "Expand terse to      Generation       Clean Text      Final Output
Reinforce    detailed prompts"         ↓               ↓
   Spec      or "Optimize clarity"  Raw Response  Structured Result
            or "Generate project
               specifications"
```

## Core Implementation Files

- **API Route**: `app/api/refine/route.ts:74-187` - Main processing logic
- **Ollama Client**: `lib/ollama.ts:55-191` - LLM communication layer  
- **Hook Integration**: `hooks/useRefine.ts:74-133` - State management
- **UI Components**: `app/page.tsx:71-122` - User interface integration

---

## Refine Process (Expand Terse → Structured)

### Purpose
Transform minimal user input into detailed, actionable prompts that eliminate ambiguity and provide clear execution guidelines for downstream AI systems.

### System Prompt Construction

**Location**: `app/api/refine/route.ts:152-168`

```typescript
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
```

### Key Characteristics

1. **Identity Preservation**: Maintains "Promptpad" assistant identity
2. **Constraint Addition**: Systematically adds missing parameters (length, tone, audience, style, format)
3. **Structure Enhancement**: Organizes content with bullets/sections for clarity
4. **Technical Parameter Exclusion**: Explicitly avoids AI-specific parameters
5. **Ambiguity Elimination**: Converts vague requests into specific requirements

### Processing Pipeline

```typescript
// 1. Input Validation (app/api/refine/route.ts:33-35)
if (body.mode === 'refine' && (!body.input || body.input.length === 0)) {
  return NextResponse.json({ error: 'Input is required for refine mode' }, { status: 400 })
}

// 2. Temperature Constraint (app/api/refine/route.ts:41)
const temperature = Math.min(body.temperature ?? 0.2, 0.3)

// 3. Ollama Generation (app/api/refine/route.ts:77)
const { text, usage } = await ollama.generate(model, prompt, { temperature })

// 4. Response Cleaning (app/api/refine/route.ts:82-88)
const cleanedText = text
  .replace(/^\*\*Prompt:\*\*\s*/i, '')
  .replace(/^Prompt:\s*/i, '')
  .replace(/^# Prompt\s*/i, '')
  .replace(/^Here's the (refined|reinforced) prompt:\s*/i, '')
  .replace(/^"([\s\S]*)"$/, '$1')
  .trim()
```

### Response Format

```typescript
{
  output: string,           // Cleaned, refined prompt
  usage: UsageStats,       // Token consumption metrics
  systemPrompt?: string,   // System prompt used (debug)
  fallbackUsed?: boolean   // Development fallback indicator
}
```

---

## Reinforce Process (Optimize → Professional)

### Purpose  
Transform existing prompts (potentially user-edited) into more precise, professional versions through targeted optimization while preserving original intent.

### System Prompt Construction

**Location**: `app/api/refine/route.ts:170-187`

```typescript
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
```

### Key Characteristics

1. **Minimal Edit Philosophy**: Preserves existing content, makes targeted improvements
2. **Precision Enhancement**: Converts vague terms to measurable criteria
3. **Variable Preservation**: Maintains existing placeholders like `{audience}`
4. **Flow Optimization**: Reorganizes content for logical progression
5. **Meta-Commentary Exclusion**: Returns only prompt content, no explanations

### Enhanced Response Cleaning

**Location**: `app/api/refine/route.ts:100-108`

```typescript
const cleanedText = text
  .replace(/^\*\*Prompt:\*\*\s*/i, '')
  .replace(/^Prompt:\s*/i, '')
  .replace(/^# Prompt\s*/i, '')
  .replace(/^Here's (an? )?(enhanced|improved|refined|reinforced) (version of the )?.*?prompt:\s*/i, '')
  .replace(/^"([\s\S]*)"$/, '$1')
  .replace(/\n\n(I made the following improvements|Let me know if|The improvements include)[\s\S]*$/i, '') // Remove trailing meta-commentary
  .trim()
```

### Patch Generation

**Location**: `app/api/refine/route.ts:109-110`

```typescript  
const patch = [{ op: 'replace', from: [0, draft.length], to: cleanedText }]
return NextResponse.json({ output: cleanedText, usage, patch, systemPrompt: prompt })
```

### Response Format

```typescript
{
  output: string,           // Optimized prompt content
  usage: UsageStats,       // Token consumption metrics  
  patch: PatchOp[],        // Diff operations for UI updates
  systemPrompt?: string,   // System prompt used (debug)
  fallbackUsed?: boolean   // Development fallback indicator
}
```

---

## Spec Process (Generate Project Specifications)

### Purpose
Transform brief project ideas into comprehensive, technical specifications with intelligent technology guidance, architecture recommendations, and detailed implementation roadmaps.

### System Prompt Construction

**Location**: `app/api/refine/route.ts` (spec mode handling)

```typescript
function buildSpecPrompt(input: string): string {
  return [
    'You are Promptpad, a technical specification expert. Transform the INPUT into a comprehensive coding project specification.',
    '',
    'Generate a detailed technical specification that includes:',
    '',
    '**Project Overview**',
    '- Clear problem statement and solution approach',
    '- Target audience and use cases',
    '- Core functionality and features',
    '',
    '**Technical Architecture**',
    '- System architecture and component design',
    '- Technology stack recommendations with justification',
    '- Database design and data flow',
    '- API design and integration points',
    '',
    '**Implementation Roadmap**',
    '- Development phases and milestones',
    '- Feature prioritization and dependencies',
    '- Estimated complexity and timeline guidance',
    '',
    '**Development Considerations**',
    '- Security requirements and best practices',
    '- Performance and scalability considerations',
    '- Testing strategy and quality assurance',
    '- Deployment and DevOps requirements',
    '',
    'Focus on practical, actionable guidance. Include specific technology choices with reasons.',
    'Avoid generic advice - provide concrete recommendations based on the project requirements.',
    '',
    'INPUT: ' + input,
    '',
    'Generate the comprehensive project specification:',
  ].join('\n')
}
```

### Key Characteristics

1. **Comprehensive Coverage**: Addresses all aspects of software development from architecture to deployment
2. **Technology Guidance**: Provides specific technology stack recommendations with justification
3. **Structured Output**: Organizes information in clear, actionable sections
4. **Practical Focus**: Emphasizes implementable solutions over theoretical concepts
5. **Timeline Awareness**: Includes development phases and complexity estimates

### Processing Pipeline

```typescript
// Extended step progression for spec generation
const specSteps: ProgressStep[] = [
  { id: 'validate', label: 'Validate input', status: 'pending' },
  { id: 'analyze', label: 'Analyze requirements', status: 'pending' },
  { id: 'architecture', label: 'Design architecture', status: 'pending' },
  { id: 'technology', label: 'Select tech stack', status: 'pending' },
  { id: 'features', label: 'Define features', status: 'pending' },
  { id: 'security', label: 'Security planning', status: 'pending' },
  { id: 'process', label: 'Generate specification', status: 'pending' },
  { id: 'update', label: 'Update document', status: 'pending' },
]
```

### Response Format

```typescript
{
  output: string,           // Complete project specification
  usage: UsageStats,       // Token consumption metrics
  systemPrompt?: string,   // System prompt used (debug)
  fallbackUsed?: boolean   // Development fallback indicator
}
```

### Enhanced Response Cleaning for Spec

**Location**: `app/api/refine/route.ts` (shared cleaning logic)

```typescript
// Spec responses often include formatting that needs preservation
const cleanedText = text
  .replace(/^\*\*Project Specification:\*\*\s*/i, '')
  .replace(/^Specification:\s*/i, '')
  .replace(/^# (Project )?Specification\s*/i, '')
  .replace(/^Here's (a )?comprehensive (project )?specification:\s*/i, '')
  .replace(/^"([\s\S]*)"$/, '$1')
  .trim()
```

### Quality Characteristics

1. **Comprehensive Scope**: Covers technical, business, and operational aspects
2. **Technology Alignment**: Matches technology choices to project requirements
3. **Actionable Content**: Provides specific, implementable guidance
4. **Structured Organization**: Uses consistent formatting for easy navigation
5. **Practical Timeline**: Includes realistic development phase estimates

---

## Technical Implementation Details

### Ollama Integration

**Client Configuration**: `lib/ollama.ts:59-62`
```typescript
constructor(baseUrl: string = 'http://localhost:11434', timeout: number = 120000) {
  this.baseUrl = baseUrl.replace(/\/$/, '')
  this.timeout = timeout
}
```

### Timeout Handling

**Soft Timeout Strategy**: `lib/ollama.ts:134-137`
```typescript
const softTimer = setTimeout(() => {
  const elapsed = Math.round((Date.now() - started) / 1000)
  console.warn(`⚠️ Ollama generation exceeding ${Math.round(this.timeout/1000)}s (elapsed ${elapsed}s) – still waiting...`)
}, this.timeout)
```

### Error Handling & Fallbacks

**Development Fallbacks**: `app/api/refine/route.ts:117-141`
- Provides deterministic responses when Ollama unavailable
- Maintains API contract during development
- Clear indication via `fallbackUsed: true`

**Production Error Handling**: `app/api/refine/route.ts:145-149`
```typescript
catch (error) {
  console.error('Refine endpoint error:', error)
  const status = error instanceof OllamaError ? 503 : 500
  return NextResponse.json({ error: 'Refine service error' }, { status })
}
```

### State Management Integration

**Progress Tracking**: `hooks/useRefine.ts:48-54`
```typescript
const baseSteps: ProgressStep[] = [
  { id: 'validate', label: 'Validate input', status: 'pending' },
  { id: 'prepare', label: 'Prepare request', status: 'pending' },
  { id: 'call', label: 'Call model', status: 'pending' },
  { id: 'process', label: 'Process response', status: 'pending' },
  { id: 'update', label: 'Update document', status: 'pending' },
]
```

---

## Performance Characteristics

### Token Consumption
- **Typical Refine**: 50-200 input tokens → 200-800 output tokens
- **Typical Reinforce**: 200-800 input tokens → 300-900 output tokens  

### Response Times
- **Local Ollama**: 10-40 seconds (depends on model size)
- **Timeout Threshold**: 120 seconds (increased for large models like gpt-oss:20b)
- **Health Check**: 5 seconds max

### Memory Usage
- **Client-side**: Minimal, state managed via React hooks
- **Server-side**: Stateless, processed per-request
- **Token Counting Cache**: LRU with 100-item limit

---

## Quality Assurance

### Response Cleaning Patterns
Both processes implement comprehensive cleaning to remove:
- Model-generated headers (`**Prompt:**`, `# Prompt`)
- Meta-commentary (`Here's the refined prompt:`)
- Trailing explanations (`I made the following improvements...`)
- Surrounding quotes from over-eager models

### Contract Compliance
**API Response Schema**: `docs/agents/schemas/api-contract.schema.json`
```json
{
  "output": "string (required)",
  "usage": {
    "input_tokens": "number (required)", 
    "output_tokens": "number (required)"
  },
  "patch": "PatchOp[] (reinforce only)",
  "systemPrompt": "string (optional debug)",
  "fallbackUsed": "boolean (optional)"
}
```

### Testing Strategy
- **Mock Integration**: Environment-based (`OLLAMA_MOCK=1`)
- **Contract Testing**: Response format validation
- **End-to-End**: Real Ollama integration tests
- **Coverage Requirements**: 80%+ for core LLM logic

---

## Optimization Opportunities

### Current Optimizations
1. **Temperature Constraint**: Hard limit ≤0.3 for consistency
2. **Response Cleaning**: Comprehensive regex patterns
3. **Soft Timeouts**: Warning-only to allow slow generations
4. **Development Fallbacks**: Maintains productivity when Ollama down

### Future Enhancements
1. **Streaming Responses**: Progressive UI updates during generation
2. **Context Preservation**: Multi-turn conversations
3. **Template System**: Reusable prompt patterns
4. **Quality Metrics**: Automated prompt quality assessment

---

## Debugging & Monitoring

### Debug Terminal Integration

**UI Component**: `app/page.tsx:333-396`
- Real-time request/response logging
- System prompt visibility  
- Fallback usage indicators
- Timestamped operation tracking

### Console Logging

**API Operations**: `app/api/refine/route.ts:75-79`
```typescript
console.log(`🔄 Refine API: Sending prompt to Ollama (${model})`)
console.log(`📝 System prompt:`, prompt)
// ... generation ...
console.log(`✅ Refine API: Got response from Ollama (${text.length} chars)`)
console.log(`📊 Usage:`, usage)
```

### Health Monitoring

**Ollama Health Check**: `lib/ollama.ts:67-77`
```typescript
async healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${this.baseUrl}/api/version`, {
      signal: AbortSignal.timeout(5000),
    })
    return response.ok
  } catch {
    return false
  }
}
```

---

## Team Collaboration Guidelines

### Making Changes to LLM Logic
1. **System Prompt Updates**: Update both `buildRefinePrompt` and `buildReinforcePrompt` in tandem
2. **Response Cleaning**: Add new cleaning patterns to both processes 
3. **Contract Changes**: Require ADR (Architecture Decision Record)
4. **Testing**: Update corresponding tests in `__tests__/api/refine.*.test.ts`

### Performance Monitoring
- Monitor token consumption via usage metrics
- Track response times and timeout occurrences  
- Watch for fallback usage in production
- Measure user satisfaction with prompt quality

### Quality Control
- All prompts should be meta-commentary free
- Temperature must remain ≤0.3 for consistency
- Preserve user intent while adding structure
- Maintain API contract stability

This comprehensive documentation ensures all team members understand the intricate details of our LLM intelligence implementation and can collaborate effectively to optimize these critical processes.