# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog and this project adheres to SemVer 0.x.

## [Unreleased]
### Added
- Ollama API adapter with health checks, model listing, and text generation
- GET /api/models endpoint with graceful degradation and mock mode support
- POST /api/refine endpoint supporting refine/reinforce per frozen contract
  - Refine: expands terse input into a structured prompt
  - Reinforce: tightens a draft and returns minimal patch list
- Real-time Ollama connection status in StatusBar with 10-second polling
- Temperature constraint enforcement (≤0.3) in Ollama client
- Live token counting via TokenCounter with pluggable TokenCountingService
  - Default counter uses server-side tiktoken; client uses fast heuristic fallback
  - React hook `useTokenCount` with debounce and cache
- Comprehensive error handling with structured OllamaError class
- OLLAMA_MOCK=1 environment flag for CI/testing without local Ollama
- Devlog entry for Ollama adapter PR: `docs/devlog/PR-0005.md`
- Next.js app scaffold with live development shell and split-pane layout
- StatusBar component with git SHA, model name, and Ollama connection status
- Comprehensive test suite with React Testing Library and accessibility testing
- Complete development toolchain: TypeScript, ESLint, Tailwind CSS, Jest
- Empty state guidance for Ollama model setup
- Hot module replacement for live development at http://localhost:3000
- Devlog entry for app scaffold PR: `docs/devlog/PR-0004.md`
- Pre-flight review docs: `docs/review/gap_analysis.md`, `docs/review/optimizations.md`
- Contracts sections in `AGENTS.md`, `CLAUDE.md`, and `.github/copilot-instructions.md` with canonical example
- AIDEVOPS: new sections for Contracts & Schemas and Live Dev UX Contract (StatusBar + dev shell expectations)
- Test Strategy: Mock Ollama CI toggle and Patch Edge-Case Fixtures list
- Schemas: invalidExamples and edge-case examples (CRLF/Unicode/overlaps) in API and Patch schemas
- Devlog entry for this PR: `docs/devlog/PR-0003.md`
- Initial build plan artifacts in `docs/plan/` with comprehensive development strategy
- Complete PR sequence (9 PRs) with DoR/DoD definitions and verification commands  
- Architecture documentation with system diagram and invariants checklist
- Test strategy with ≥80% coverage targets for core libraries
- Risk assessment with 11 prioritized risks and detailed mitigations
- Production-ready prompt templates for Refine/Reinforce operations
- Claude Code Agent Pack in `docs/agents/` with 9 specialized roles and reusable prompts
- JSON schemas for API contract validation and patch format enforcement
- Coverage thresholds configuration with per-file requirements
- Comprehensive development coordination system for maintaining system invariants

### Changed
- Align agent guidance with AIDEVOPS: updated `AGENTS.md`, `CLAUDE.md`, `.github/copilot-instructions.md`; added devlog scaffold.
- Harmonized core library coverage targets to ≥80% across Test Strategy to match invariants
- Align GET /api/models response to array shape per `api-contract.schema.json`
- Next.js config updated to support WebAssembly experiments for tokenizer compatibility
