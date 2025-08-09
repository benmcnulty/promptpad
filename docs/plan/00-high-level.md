# High-Level Architecture

## System Overview

Promptpad is a local-first prompt drafting tool that implements a two-pass workflow via Ollama inference. Users input terse instructions, refine them into structured prompts, edit freely, then reinforce for coordination and polish.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser (localhost:3000)                 │
├─────────────────────┬───────────────────────────────────────┤
│     Input Pane      │          Output Pane                  │
│  - Text editor      │    - Editable text area               │
│  - Token count      │    - Token count                      │  
│  - Model selector   │    - Diff preview                     │
├─────────────────────┴───────────────────────────────────────┤
│              Control Bar                                    │
│  [Refine] [Reinforce] [Undo] [Redo] [Copy] [Temp: 0.2]     │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTP Requests
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                   Next.js API Routes                        │
│                                                             │
│  GET /api/models              POST /api/refine              │
│  ┌─────────────────┐          ┌─────────────────────────┐   │
│  │ • List models   │          │ mode: refine|reinforce  │   │
│  │ • Default mark  │          │ input: string           │   │
│  │ • Return JSON   │          │ draft?: string          │   │
│  └─────────────────┘          │ model: string           │   │
│                               │ temperature: number     │   │
│                               └─────────────────────────┘   │
└─────────────────────┬───────────────────────────────────────┘
                      │ Ollama Client Calls
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    Ollama (Local)                           │
│  • gpt-oss:20b (default)                                   │
│  • llama3.2, gemma3, qwen3 (optional)                      │
│  • Temperature ≤ 0.3                                       │
└─────────────────────────────────────────────────────────────┘

         ┌─────────────────────────────────────────┐
         │              Core Libraries             │
         ├─────────────────────────────────────────┤
         │  lib/ollama.ts        │ API adapter     │
         │  lib/tokens/          │ Token counting  │
         │  lib/history.ts       │ Undo/redo       │
         │  lib/diff.ts          │ Patch ops       │
         └─────────────────────────────────────────┘
                          │
                          ▼
         ┌─────────────────────────────────────────┐
         │           localStorage                  │
         │  • Undo/redo history stack              │
         │  • Session persistence                  │
         │  • No cloud sync                       │
         └─────────────────────────────────────────┘
```

## Data Flow

### Refine Operation
1. User types terse instruction in input pane
2. Selects model (default: gpt-oss:20b) and temperature (≤0.3)
3. Clicks "Refine" → POST /api/refine {mode: "refine", input, model, temperature}
4. API calls Ollama with expansion prompt template
5. Response {output, usage} → display in output pane with token count
6. User can edit output freely
7. All changes pushed to undo/redo stack in localStorage

### Reinforce Operation  
1. User edits refined output in output pane
2. Clicks "Reinforce" → POST /api/refine {mode: "reinforce", draft: current_text, model, temperature}
3. API calls Ollama with reinforcement prompt template
4. Response {output, usage, patch} → show diff preview
5. User can apply patch (updates output + history) or discard
6. Applied changes create undo entry

### Token Counting
- Real-time counting via tiktoken (approximate, fast)
- Pluggable interface for model-specific tokenizers
- Non-blocking UI updates

### History Management
- Every text change (typing or LLM diff) creates history entry
- Undo/redo operations traverse stack
- Persisted to localStorage, hydrated on page load
- No server-side storage

## Invariants Checklist

### Core Behavior
- [ ] Exactly two operations: Refine and Reinforce
- [ ] Local-first via Ollama (no cloud by default)
- [ ] Default model: gpt-oss:20b
- [ ] Temperature ≤ 0.3 unless explicitly justified
- [ ] Single-screen UI (input left, output right)
- [ ] Output always editable
- [ ] Live token counts (approximate OK)

### API Contract (Frozen)
- [ ] GET /api/models → [{name, family, parameters}]
- [ ] POST /api/refine → {output, usage, patch?}
- [ ] Request: {mode: "refine"|"reinforce", input?, draft?, model, temperature}
- [ ] Patch format: compact text-range operations
- [ ] No API drift without ADR

### Persistence & History
- [ ] Undo/redo for all changes (user edits + LLM diffs)
- [ ] localStorage only (no server database)
- [ ] History survives page reload
- [ ] No secrets in localStorage

### Quality Gates
- [ ] TypeScript strict mode
- [ ] ESLint + Prettier passing
- [ ] ≥80% test coverage for lib/diff.ts, lib/history.ts, lib/tokens/*
- [ ] Build succeeds without warnings
- [ ] Performance: token counting non-blocking

### Process
- [ ] Event-driven merge queue (label: queue:ready)
- [ ] Conventional Commits
- [ ] Devlog per PR
- [ ] Single-responsibility PRs
- [ ] Green CI before merge

## Success Criteria

**MVP Complete when:**
1. User can input terse instruction → refine → edit → reinforce → copy
2. All text changes tracked in persistent undo/redo stack
3. Live token counts display during typing
4. Diff preview shows reinforcement changes before application
5. Works offline with local Ollama
6. No API contract violations
7. All invariants maintained
8. Quality gates pass consistently