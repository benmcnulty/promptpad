# Error Handling & Resilience Patterns

## Overview

Promptpad implements **comprehensive error handling** with graceful degradation, custom error types, development fallbacks, and user-friendly feedback. This document details our resilience strategies that ensure the application remains functional even when external dependencies fail.

## Error Handling Philosophy

### Principles
1. **Fail Gracefully**: Never crash the entire application
2. **User-First**: Prioritize user experience over technical accuracy  
3. **Transparent Feedback**: Clear indication of what went wrong
4. **Fallback Strategies**: Alternative paths when primary systems fail
5. **Development Continuity**: Work offline and without external services

## Custom Error Types

### 1. OllamaError Class
**Implementation**: `lib/ollama.ts:44-53`

```typescript
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
```

**Usage Throughout System**:
```typescript
// Service unavailable
throw new OllamaError(
  `Ollama service unavailable: ${error.message}`,
  0,
  'SERVICE_UNAVAILABLE'
)

// Generation failure
throw new OllamaError(
  `Generation failed: ${response.status} ${response.statusText}`,
  response.status
)

// Network issues
throw new OllamaError(
  `Generation request failed: ${error.message}`,
  0,
  'REQUEST_FAILED'
)
```

**Error Handling in API Routes** (`app/api/refine/route.ts:145-149`):
```typescript
catch (error) {
  console.error('Refine endpoint error:', error)
  const status = error instanceof OllamaError ? 503 : 500
  return NextResponse.json({ error: 'Refine service error' }, { status })
}
```

## Graceful Degradation Strategies

### 1. Development Fallbacks
**Pattern**: Deterministic responses when external services unavailable
**Implementation**: `app/api/refine/route.ts:114-142`

```typescript
// If Ollama is unavailable and we're in development, return deterministic fallback
const isDev = process.env.NODE_ENV !== 'production'
if (isDev) {
  console.log(`⚠️ Using development fallback (Ollama unavailable)`)
  
  if (body.mode === 'refine') {
    const output = `[DEV FALLBACK] Here's your refined prompt for "${input}":\n\n# Creative Story Prompt\n\nWrite an engaging short story about a cat named Pupper...`
    
    return NextResponse.json({
      output,
      usage: { input_tokens: input.length, output_tokens: output.length },
      systemPrompt: prompt,
      fallbackUsed: true // Clear indication
    })
  }
}
```

**Benefits**:
- **Development Continuity**: Work without Ollama running
- **Predictable Testing**: Consistent responses for automated tests
- **User Feedback**: Clear indication via `fallbackUsed: true`

### 2. Mock Mode for Testing
**Pattern**: Environment-controlled mocking
**Implementation**: `app/api/refine/route.ts:44-68`

```typescript
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
  }
}
```

### 3. Progressive Enhancement
**Pattern**: Core functionality works without JavaScript
**Implementation**: Base HTML forms with JavaScript enhancement

```typescript
// Base form functionality (works without JS)
<form method="post" action="/api/refine">
  <textarea name="input" required />
  <button type="submit">Refine</button>
</form>

// Enhanced with JavaScript
<button
  type="button"
  onClick={onRefine} // JavaScript enhancement
  disabled={!canRefine} // Enhanced validation
>
  Refine
</button>
```

## Input Validation & Sanitization

### 1. API Request Validation
**Pattern**: Comprehensive input validation with specific error messages
**Implementation**: `app/api/refine/route.ts:24-38`

```typescript
// Basic contract validation
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
```

### 2. Response Sanitization  
**Pattern**: Clean potentially malicious or malformed model outputs
**Implementation**: `app/api/refine/route.ts:82-88, 100-108`

```typescript
// Comprehensive response cleaning
const cleanedText = text
  .replace(/^\*\*Prompt:\*\*\s*/i, '')                    // Remove bold headers
  .replace(/^Prompt:\s*/i, '')                            // Remove plain headers  
  .replace(/^# Prompt\s*/i, '')                           // Remove markdown headers
  .replace(/^Here's the (refined|reinforced) prompt:\s*/i, '') // Remove meta commentary
  .replace(/^"([\s\S]*)"$/, '$1')                         // Remove surrounding quotes
  .replace(/\n\n(I made the following improvements|Let me know if|The improvements include)[\s\S]*$/i, '') // Remove trailing explanations
  .trim()
```

## Client-Side Error Handling

### 1. Hook-Level Error Management
**Pattern**: Centralized error state in custom hooks
**Implementation**: `hooks/useRefine.ts:127-132`

```typescript
const run = useCallback(async (mode: RefineMode, text: string): Promise<RunResult | null> => {
  try {
    const res = await fetch('/api/refine', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      throw new Error(`Refine request failed (${res.status})`)
    }

    // Success path...
    return { output, patch }
  } catch (err) {
    steps = advance(steps, 'call', 'error')
    const msg = err instanceof Error ? err.message : 'Unexpected error'
    setState({ loading: false, error: msg, usage: null, steps })
    return null
  }
}, [model, temperature])
```

### 2. Component-Level Error Boundaries
**Pattern**: Try-catch in async operations with user feedback

```typescript
const copyToClipboard = useCallback(async () => {
  if (!outputText.trim()) return;
  
  try {
    await navigator.clipboard.writeText(outputText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  } catch (err) {
    console.error('Failed to copy text: ', err);
    // Could show toast notification here
    // setError('Failed to copy to clipboard')
  }
}, [outputText]);
```

### 3. localStorage Error Handling
**Pattern**: Graceful failure for storage operations
**Implementation**: `app/page.tsx:30-33, 35-38`

```typescript
useEffect(() => {
  try {
    const dismissed = localStorage.getItem("promptpad-welcome-dismissed");
    if (dismissed === "true") setShowWelcome(false);
  } catch {
    // Silently continue with default state
    // Private browsing or storage disabled
  }
}, []);

const dismissWelcome = useCallback(() => {
  try {
    if (dontShowAgain) localStorage.setItem("promptpad-welcome-dismissed", "true");
  } catch {
    // Fail silently - functionality still works
  }
  setShowWelcome(false);
}, [dontShowAgain]);
```

## Network Resilience

### 1. Timeout Handling
**Pattern**: Soft timeouts with user awareness
**Implementation**: `lib/ollama.ts:134-137`

```typescript
// Use a soft timeout (warning only) instead of aborting
const controller = new AbortController()
const started = Date.now()
const softTimer = setTimeout(() => {
  const elapsed = Math.round((Date.now() - started) / 1000)
  console.warn(`⚠️ Ollama generation exceeding ${Math.round(this.timeout/1000)}s (elapsed ${elapsed}s) – still waiting...`)
}, this.timeout)

const response = await fetch(`${this.baseUrl}/api/generate`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(requestBody),
  // No abort signal: allow long-running generations
}).finally(() => clearTimeout(softTimer))
```

### 2. Health Check Pattern
**Pattern**: Fast health checks with quick timeout
**Implementation**: `lib/ollama.ts:67-77`

```typescript
async healthCheck(): Promise<boolean> {
  try {
    const response = await fetch(`${this.baseUrl}/api/version`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000), // Quick health check
    })
    return response.ok
  } catch (error) {
    return false // Graceful failure
  }
}
```

### 3. Circuit Breaker Pattern (Implicit)
**Pattern**: Fast failure when service known to be down

```typescript
// Health check before expensive operations
const isHealthy = await ollama.healthCheck()
if (!isHealthy) {
  return NextResponse.json(
    { error: 'Ollama service unavailable' }, 
    { status: 503 }
  )
}
```

## User Experience During Errors

### 1. Progressive Error States
**Pattern**: Different UI states based on error severity

```typescript
// Hook provides error state
const { state, statusSummary, run, reset } = useRefine()

// UI adapts to error state
<span className="text-slate-600 font-medium bg-white/60 px-3 py-1 rounded-md">
  {statusSummary} {/* "Error", "Working...", or step name */}
</span>

{state.error && (
  <div className="text-red-600 bg-red-50 p-3 rounded-lg">
    {state.error}
  </div>
)}
```

### 2. Recovery Actions
**Pattern**: Provide users with recovery options

```typescript
<button
  type="button"
  className="text-slate-500 hover:text-slate-700 focus-visible font-medium"
  onClick={reset} // Clear error state and retry
  aria-label="Reset progress"
>
  Reset
</button>
```

### 3. Debug Information
**Pattern**: Detailed error information for debugging
**Implementation**: Debug terminal with error logging

```typescript
const addDebugLog = useCallback(
  (type: "request" | "response" | "system", content: any) => {
    const timestamp = new Date().toISOString()
    setDebugLogs((prev) => [...prev.slice(-49), { timestamp, type, content }])
  },
  []
)

// Usage during error
catch (error) {
  addDebugLog("system", `💥 Error: ${error}`)
}
```

## Diff/Patch Error Handling

### 1. Safe Patch Application
**Pattern**: Fallback when patch operations fail
**Implementation**: `lib/diff.ts:78-88`

```typescript
/** Apply an inverted (undo) patch safely even if source length changed elsewhere. */
export function safeApply(source: string, patch: PatchOp[]): string {
  try {
    return applyPatch(source, patch)
  } catch {
    // Fallback: if ranges invalid due to drift, recompute naive full replace.
    // This preserves correctness over minimality.
    const full = patch.reduce((s, op) => applyPatch(s, [op]), source)
    return full
  }
}
```

### 2. Patch Validation
**Pattern**: Validate patch operations before application

```typescript
export function applyPatch(source: string, patch: PatchOp[]): string {
  if (!patch.length) return source
  
  // Validate non-overlapping, sorted
  let lastEnd = 0
  for (const op of patch) {
    const [start, end] = op.from
    if (start < lastEnd) throw new Error('Overlapping patch ops')
    if (start > end) throw new Error('Invalid range')
    lastEnd = end
  }
  
  // Apply validated patches...
}
```

## Error Monitoring & Logging

### 1. Structured Logging
**Pattern**: Consistent error logging format

```typescript
// API operations
console.error('Refine endpoint error:', error)
console.log(`🔄 Refine API: Sending prompt to Ollama (${model})`)
console.log(`💥 Ollama generation failed:`, err)

// Client operations  
console.error('Failed to copy text: ', err)
addDebugLog("system", `💥 Error: ${error}`)
```

### 2. Error Context
**Pattern**: Include relevant context with errors

```typescript
// Include operation context
throw new OllamaError(
  `Generation failed: ${response.status} ${response.statusText} - ${errorText}`,
  response.status
)

// Include user context
addDebugLog("system", `Starting refine operation for: "${inputText.slice(0, 50)}${inputText.length > 50 ? "..." : ""}"`)
```

## Testing Error Scenarios

### 1. Error Path Testing
**Pattern**: Explicit testing of failure modes

```typescript
it('handles API errors gracefully', async () => {
  fetch.mockRejectedValueOnce(new Error('Network error'))
  
  render(<Home />)
  await userEvent.type(screen.getByLabelText('Prompt input area'), 'test')
  await userEvent.click(screen.getByLabelText('Refine prompt'))
  
  await waitFor(() => {
    expect(screen.getByText(/error/i)).toBeInTheDocument()
  })
})
```

### 2. Edge Case Testing
**Pattern**: Test boundary conditions and malformed inputs

```typescript
it('throws on overlapping patch ops', () => {
  expect(() => applyPatch('abcdef', [
    { op: 'replace', from: [1, 3], to: 'X' },
    { op: 'replace', from: [2, 4], to: 'Y' }, // Overlapping!
  ])).toThrow('Overlapping')
})

it('safeApply falls back on overlapping ops without throwing', () => {
  const result = safeApply('abcdef', [
    { op: 'replace', from: [1, 3], to: 'X' },
    { op: 'replace', from: [2, 4], to: 'Y' },
  ])
  expect(typeof result).toBe('string') // Graceful fallback
})
```

## Error Recovery Strategies

### Current Recovery Mechanisms
1. **Development Fallbacks**: Deterministic responses when Ollama unavailable
2. **Soft Timeouts**: Continue operations despite slow responses
3. **State Reset**: User-triggered recovery from error states  
4. **Safe Patch Application**: Fallback algorithms for diff failures
5. **Graceful Storage Failures**: Continue without localStorage

### Future Enhancements
1. **Retry Logic**: Automatic retry with exponential backoff
2. **Circuit Breaker**: Prevent cascading failures
3. **Error Boundaries**: React error boundaries for component isolation
4. **Toast Notifications**: User-friendly error messages
5. **Offline Support**: Service worker for offline functionality
6. **Error Reporting**: Automated error tracking and analytics

This comprehensive error handling strategy ensures Promptpad remains functional and user-friendly even when facing network issues, service outages, or unexpected failures.