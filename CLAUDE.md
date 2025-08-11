# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Promptpad is a **fully functional** local-first prompt drafting tool built with Next.js 15.4.6 + TypeScript. It expands terse instructions into copy-ready prompts via Ollama (default: `gpt-oss:20b`). The app implements a multi-mode workflow: Refine (expand prompts), Reinforce (optimize prompts), and Spec (generate coding project specifications) plus an internal heuristic + optional low‑temperature cleanup pass that normalizes meta-heavy raw outputs from smaller models.

**Status**: ✅ **PRODUCTION READY** - Fully implemented with comprehensive testing, responsive design, loading animations, debugging tools, and optimized prompting.

## 📚 Developer Documentation

**→ For comprehensive technical details, see [Developer Guide](docs/developer-guide/README.md)**

Key documentation for understanding the codebase:
- **[LLM Processes](docs/developer-guide/llm-processes.md)** - Complete technical breakdown of Refine/Reinforce workflows
- **[Architecture](docs/developer-guide/architecture.md)** - React patterns, custom hooks, and design patterns
- **[Testing Strategy](docs/developer-guide/testing.md)** - 150+ tests with high coverage patterns
- **[Performance](docs/developer-guide/performance.md)** - Caching, optimization, and monitoring strategies
- **[Error Handling](docs/developer-guide/error-handling.md)** - Resilience patterns and graceful degradation

## Invariants & Boundaries
- Local‑first via Ollama; default `gpt-oss:20b`; temperature ~0.2 (≤0.3 unless justified).
- Ollama timeout: 120 seconds (increased from 30s to support large models like gpt-oss:20b).
- Three operations: Refine, Reinforce, and Spec. Keep endpoints stable.
- Endpoints: `GET /api/models`, `GET /api/git-info`, `POST /api/refine` with `mode: refine|reinforce|spec` → `{ output, usage, patch?, systemPrompt?, fallbackUsed? }`.
- Patch format: compact text‑range ops used by diff/undo/redo. Do not change without an ADR.
- All model responses undergo layered normalization: regex heuristic stripping + conditional semantic cleanup if meta framing detected.

## Contracts (Frozen)
- Endpoints:
  - `GET /api/models` → `{ models: Array<OllamaModel> }`  
  - `GET /api/git-info` → `{ sha: string, branch: string, timestamp: string }`
  - `POST /api/refine` body `{ mode: "refine" | "reinforce" | "spec", input?, draft?, model, temperature }` → `{ output, usage, patch?, systemPrompt?, fallbackUsed? }`

- Canonical API response example:
```json
{
  "output": "Write a 500-word blog post about sustainable gardening practices...",
  "usage": { "input_tokens": 42, "output_tokens": 187 },
  "patch": [
    { "op": "replace", "from": [0, 58], "to": "improved text here" }
  ],
  "systemPrompt": "You are Promptpad, a prompt-drafting assistant...",
  "fallbackUsed": false
}
```
- Schemas: `docs/agents/schemas/api-contract.schema.json`, `docs/agents/schemas/patch.schema.json`
- Any change requires an ADR before implementation.

## Coding Rules
- Keep API handlers thin; move logic into small, pure functions in `lib/`.
- Favor single‑responsibility diffs; avoid drive‑by refactors.
- Add/maintain tests before changing `lib/diff.ts`, `lib/history.ts`, or `lib/tokens/*`.
- Provide CLI‑style commands in PRs for verification (typecheck, lint, build, test).

## Test Scaffold (add or update first)
- `lib/diff.ts`: patch generation and application round‑trips; edge cases (CRLF, unicode, empty ranges).
- `lib/history.ts`: push/undo/redo, snapshot persistence, hydration from `localStorage`.
- `lib/tokens/*`: counting is stable for common inputs; performance won’t block UI.
- API: `/api/refine` returns `{ output, usage, patch? }` respecting `mode`; validates `model` via `/api/models`.

Suggested commands (paste outputs in PR):
- `pnpm typecheck`
- `pnpm lint`
- `pnpm build`
- `pnpm test -- --coverage`

## Development Commands

When source code is implemented, use these commands:
- `pnpm install` - Install dependencies  
- `pnpm dev` - Start development server (http://localhost:3000)
- `pnpm typecheck` - Run TypeScript checks
- `pnpm lint` - Run ESLint + Prettier
- `pnpm build` - Build for production
- `pnpm test -- --coverage` - Run tests with coverage

## Multi‑Mode Workflow & Prompts

### Refine Operation
**Purpose**: Expand terse input into detailed, actionable prompts
**System Prompt**: Adds goals, constraints (length, tone, audience, style, format) while preserving intent.
**Normalization**: If output starts with meta framing ("Okay, here's", `**Prompt:**`, quotes) or includes improvement commentary, a secondary cleanup generation (temp ≤0.15) rewrites it without narration.

### Reinforce Operation
**Purpose**: Optimize existing prompts for precision and effectiveness
**System Prompt**: Tightens wording, adds only essential constraints, preserves placeholders.
**Normalization**: Same heuristic + optional cleanup pass (removes improvement summaries, meta commentary).

### Spec Operation
**Purpose**: Generate concise, actionable project specification with practical stack & phased roadmap.
**Normalization**: Removes "Here’s the (comprehensive) specification" headers, markdown spec headers, and extraneous quotes; optional cleanup pass ensures consistent formatting.

## Architecture & File Structure

**Current implementation** (fully functional):
```
app/
  page.tsx                # ✅ Single-column responsive UI with three enhancement modes
  globals.css             # ✅ Green/blue gradient design system
  api/
    models/route.ts       # ✅ Lists Ollama models with health checking
    refine/route.ts       # ✅ Refine/reinforce/spec with 120s timeout
    git-info/route.ts     # ✅ Dynamic git commit info
components/
  ProgressTracker.tsx     # ✅ Dynamic progress with variable step workflows
  StatusBar.tsx           # ✅ Git SHA, model, Ollama status, debug toggle
  TokenCounter.tsx        # ✅ Real-time token counting with TikToken
lib/
  ollama.ts              # ✅ Ollama client with error handling & timeouts
  tokens/
    index.ts             # ✅ Token counting interface
    tiktoken.ts          # ✅ TikToken implementation with fallbacks
  history.ts             # ✅ Undo/redo + localStorage persistence  
  diff.ts                # ✅ Text diff/patch utilities
hooks/
  useRefine.ts           # ✅ Dynamic state management for all three modes
  useTokenCount.ts       # ✅ Real-time token counting hook
lib/cli/                 # ✅ Complete CLI implementation with spec support
  commands/              # ✅ Individual command implementations
  utils/                 # ✅ CLI utilities and cross-platform support
__tests__/               # ✅ Comprehensive test suite with 96%+ coverage
```

## ✨ Recent Enhancements & Features

### UI/UX Improvements
- **🏗️ Single-Column Layout**: Streamlined input → output → controls flow for enhanced usability
- **🔄 Three Enhancement Modes**: Refine, Reinforce, and Spec buttons with distinct visual styling
- **📊 Dynamic Progress Tracking**: Variable step counts with "Step X of Y: [Name]" status display
- **🎨 Green/Blue Gradient Design System**: Custom CSS properties, glass morphism effects, consistent theming
- **📱 Fully Responsive Layout**: Fills screen at all widths, mobile-first approach, independent component scrolling  
- **🔄 Loading Animations**: Thematic gradient spinners with counter-rotation, bounce delays, blocks interaction during processing
- **📋 Copy-to-Clipboard**: One-click copying of refined prompts with visual feedback (checkmark + "Copied!" for 2s)
- **🖥️ Debug Terminal**: Collapsible terminal with request/response logging, system prompts, fallback indicators
- **👋 Welcome Modal**: Dismissible with multiple options (ESC, backdrop click, X button), localStorage persistence

### Technical Enhancements  
- **🆕 Spec Mode**: Comprehensive coding project specification generation with intelligent technology guidance
- **📈 Multi-Step Processing**: Dynamic step workflows (5 for refine, 4 for reinforce, 8 for spec)
- **⏱️ Ollama Timeout Fix**: Increased from 30s to 120s to support large models (gpt-oss:20b takes 20-40s)
- **🧹 Response Cleanup**: Automatic removal of unwanted prefixes ("**Prompt:**", "Here's the refined prompt:", etc.)
- **🔍 Improved Prompting**: Eliminated AI technical parameters in output, better system prompts for all operations
- **💪 Better Reinforce**: Now makes significant content improvements vs minimal/no changes previously
- **📊 Real-time Git Info**: Dynamic commit SHA and branch display via `/api/git-info`

### Developer Experience
- **🖥️ Full CLI Support**: Complete command-line interface with spec, refine, and reinforce commands
- **🧪 Comprehensive Testing**: 108+ tests with high coverage, real functionality testing (not mocks)
- **📝 Enhanced Logging**: Detailed console logs for API operations, timing, and fallback usage  
- **🔧 Type Safety**: Full TypeScript coverage with proper error handling
- **⚡ Performance**: Optimized rendering, efficient state management, background operations

## Current Functionality Status

| Feature | Status | Notes |
|---------|--------|-------|
| Refine | ✅ | Expansion + conditional cleanup normalization |
| Reinforce | ✅ | Precision edits + patch + cleanup normalization |
| Spec | ✅ | Focused project spec + cleanup normalization |
| Dual-Layer Cleanup | ✅ | Heuristic regex + semantic low-temp pass |
| Token Counting | ✅ | Real-time via TikToken + LRU cache |
| Debug Terminal | ✅ | System prompt & usage visibility |
| Ollama Integration | ✅ | 120s soft timeout, health checks |
| Error Handling | ✅ | Deterministic fallbacks & structured errors |
| CLI | ✅ | Parity with UI modes |
| Theming | ✅ | Accent + dark/light, persisted |
| Tests | ✅ | 150+ passing suites |
| CLI Support | ✅ Production Ready | Complete command-line interface with all modes |
| Testing Suite | ✅ Production Ready | 108+ tests, high coverage |

## Process & Merge Queue
- Use Conventional Commits; focused branches `feat/|fix/|docs/|chore/|refactor/|spike/` with optional `@claude`.
- Append a devlog file `docs/devlog/PR-<number>.md` with commands and outputs.
- If invariants or API would change, open an ADR and link it; do not merge without acceptance.
- Mark PR `queue:ready` only when typecheck, lint, build, tests are green and checklist is complete.

## Examples
- Commit: `feat(refine): show token counts beside editors`
- Commit: `fix(reinforce): correct patch ranges on CRLF files`
- PR includes: checklist, devlog link, screenshots (if UI), and confirmation of no API/patch drift.
