# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Promptpad is a minimal drafting board for prompts that expands rough instructions into clear, copy-ready prompts. It's a Next.js application that uses Ollama for local inference, optimized for the `gpt-oss:20b` model.

**Core workflow:**
1. User types short instruction → Refine expands it into structured prompt
2. User edits the output freely → Reinforce sends edited draft back for tightening
3. Results shown as diffs that can be applied/undone

## Development Commands

```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev          # http://localhost:3000

# Build for production
pnpm build

# Start production build
pnpm start

# Ensure default model is available
ollama pull gpt-oss:20b
```

## Architecture & Code Organization

**Directory structure:**
- `app/` - Next.js App Router pages and API routes
  - `page.tsx` - Main drafting board UI (input ↔ output)
  - `api/models/route.ts` - GET endpoint to list local Ollama models
  - `api/refine/route.ts` - POST endpoint for refine/reinforce operations
- `lib/` - Core utilities
  - `ollama.ts` - Ollama adapter for listing models and generating text
  - `tokens/` - Pluggable token counting system (defaults to tiktoken approximation)
  - `history.ts` - Undo/redo stack with localStorage persistence
  - `diff.ts` - Text diff/patch helpers for reinforcement diffs

**Key patterns:**
- Two-pass system: "Refine" (expand) then "Reinforce" (diff-based tighten)
- All mutations (user edits + LLM diffs) push to undo/redo history stack
- Local-first: uses Ollama, localStorage persistence, no cloud by default
- Default model: `gpt-oss:20b` with temperature ≈ 0.2 for deterministic refinement

## API Design

**POST /api/refine** handles both modes:
- `mode: "refine"` - expand initial instruction into full prompt
- `mode: "reinforce"` - tighten coordination in edited draft, returns diff patches

**GET /api/models** - lists available Ollama models with `gpt-oss:20b` highlighted as default

## Code Style & Conventions

- TypeScript strict mode, React function components
- 2-space indentation, kebab-case for modules, PascalCase for components
- Tailwind-first styling
- Next.js App Router conventions (lowercase route segments)

## Prerequisites

- Node.js ≥ 20
- Ollama installed and running locally
- Primary model: `gpt-oss:20b` (pull with `ollama pull gpt-oss:20b`)