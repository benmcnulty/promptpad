# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Promptpad is a **fully functional** multi-page local-first prompt drafting and visualization platform built with Next.js 15.4.6 + TypeScript. It expands terse instructions into copy-ready prompts via Ollama (default: `gpt-oss:20b`). The platform features persistent header navigation and shared infrastructure for multiple tools:

- **Prompt Enhancer**: Multi-mode workflow (Refine, Reinforce, Spec) with comprehensive UI/UX enhancements
- **Dimensional Visualizer**: Coming soon - Data visualization and analysis tool

The Prompt Enhancer implements a multi-mode workflow: Refine (expand prompts), Reinforce (optimize prompts), and Spec (generate coding project specifications) plus an internal heuristic + optional low‑temperature cleanup pass that normalizes meta-heavy raw outputs from smaller models.

**Status**: ✅ **PRODUCTION READY** - Multi-page architecture implemented with persistent navigation, shared state management, comprehensive testing, responsive design, loading animations, debugging tools, and optimized prompting.

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

**Current implementation** (fully functional multi-page platform):
```
app/
  layout.tsx              # ✅ Root layout with shared providers and persistent header/footer
  page.tsx                # ✅ Root redirect to /prompt-enhancer
  prompt-enhancer/
    page.tsx              # ✅ Single-column responsive UI with three enhancement modes
  dimensional-visualizer/
    page.tsx              # ✅ Coming soon page with development animations
  globals.css             # ✅ Green/blue gradient design system
  api/
    models/route.ts       # ✅ Lists Ollama models with health checking
    refine/route.ts       # ✅ Refine/reinforce/spec with 120s timeout
    git-info/route.ts     # ✅ Dynamic git commit info
components/
  AppHeader.tsx           # ✅ Persistent navigation header with dynamic routing
  AppFooter.tsx           # ✅ Status bar with debug terminal integration
  DebugProvider.tsx       # ✅ Shared debug state management across pages
  WelcomeProvider.tsx     # ✅ Shared welcome modal and localStorage management
  shared/
    DebugTerminal.tsx     # ✅ Reusable debug terminal component
  ProgressTracker.tsx     # ✅ Dynamic progress with variable step workflows
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
__tests__/               # ✅ Comprehensive test suite with high coverage
```

## ✨ Recent Enhancements & Features

### Multi-Page Architecture
- **🏗️ Multi-Page Platform**: Scalable architecture with persistent header navigation and footer
- **🔄 Shared State Management**: DebugProvider, WelcomeProvider, ModelProvider, ThemeProvider work across all pages
- **📱 Navigation System**: Tab-style navigation between tools with active state detection
- **🎨 Persistent UI**: Header, footer, debug terminal, model selection work on all pages
- **🚀 Future-Ready**: Infrastructure in place for new tools like Dimensional Visualizer

### UI/UX Improvements
- **🏗️ Single-Column Layout**: Streamlined input → output → controls flow for enhanced usability (Prompt Enhancer)
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
| **Multi-Page Architecture** | ✅ Production Ready | Persistent navigation, shared state management |
| **Prompt Enhancer Tool** | ✅ Production Ready | Complete functionality with all three modes |
| **Dimensional Visualizer** | 🚧 In Development | Prototype interface with 3D vector visualization mockup |
| **Shared Navigation** | ✅ Production Ready | Header with dynamic routing and contrast fixes |
| **Shared Debug Terminal** | ✅ Production Ready | Works across all pages with persistent state |
| **Shared Providers** | ✅ Production Ready | Debug, Welcome, Model, Theme providers global |
| Refine Operation | ✅ Production Ready | Expansion + conditional cleanup normalization |
| Reinforce Operation | ✅ Production Ready | Precision edits + patch + cleanup normalization |
| Spec Operation | ✅ Production Ready | Focused project spec + cleanup normalization |
| Dual-Layer Cleanup | ✅ Production Ready | Heuristic regex + semantic low-temp pass |
| Token Counting | ✅ Production Ready | Real-time via TikToken + LRU cache |
| Ollama Integration | ✅ Production Ready | 120s soft timeout, health checks |
| Error Handling | ✅ Production Ready | Deterministic fallbacks & structured errors |
| CLI Support | ✅ Production Ready | Complete command-line interface with all modes |
| Theming System | ✅ Production Ready | Accent + dark/light, persisted across pages |
| Testing Suite | ✅ Production Ready | High coverage with updated architectural tests |
| UI Contrast | ✅ Production Ready | Enhanced text emboss effects for better separation |
| Server Redirects | ✅ Production Ready | Proper 307 redirects from root to /prompt-enhancer |

## Process & Merge Queue
- Use Conventional Commits; focused branches `feat/|fix/|docs/|chore/|refactor/|spike/` with optional `@claude`.
- Append a devlog file `docs/devlog/PR-<number>.md` with commands and outputs.
- If invariants or API would change, open an ADR and link it; do not merge without acceptance.
- Mark PR `queue:ready` only when typecheck, lint, build, tests are green and checklist is complete.

## Examples
- Commit: `feat(refine): show token counts beside editors`
- Commit: `fix(reinforce): correct patch ranges on CRLF files`
- PR includes: checklist, devlog link, screenshots (if UI), and confirmation of no API/patch drift.
