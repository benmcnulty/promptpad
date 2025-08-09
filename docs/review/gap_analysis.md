# Pre-Flight Gap Analysis (Codex)

Purpose: Identify contradictions, omissions, and alignment issues across docs before feature implementation. References use file:line for precision.

## Invariants & Contracts

- Missing consolidated contracts section in AIDEVOPS.md with schema links.
  - Evidence: AIDEVOPS.md:9-15 lists invariants but no "Contracts & Schemas" references.
  - Fix: Add a dedicated section linking `docs/agents/schemas/api-contract.schema.json` and `docs/agents/schemas/patch.schema.json` and include example response.

- Explicit response example not present in AGENTS.md/CLAUDE.md/Copilot docs.
  - Evidence: AGENTS.md:17-23, CLAUDE.md:11-15, .github/copilot-instructions.md:5-9 mention endpoints but lack canonical example body.
  - Fix: Insert identical "Contracts" block with exact shapes and example snippet.

- Coverage targets inconsistent between high-level invariant (≥80%) and Test Strategy (85% lines for some libs).
  - Evidence: AIDEVOPS.md:83 (min coverage 80% core libs) vs docs/plan/30-test-strategy.md:29-31 (lib/diff.ts 85%; lib/history.ts 85%).
  - Fix: Harmonize to ≥80% across docs to match invariant; keep stretch targets as optional notes.

## UX & Live Dev

- Live Dev UX Contract (StatusBar, non-blank shell) not documented.
  - Evidence: AIDEVOPS.md lacks runtime UX contract; docs/plan/20-pr-sequence.md:57-67 (PR#2 DoD) does not mention StatusBar or dev health.
  - Fix: Add "Live Dev UX Contract" to AIDEVOPS.md; update PR#2 DoD to include StatusBar (git short SHA placeholder OK, model, Ollama state) and non-blank dev shell expectation.

## Testing & Mocks

- No explicit "Mock Ollama" section describing CI toggle and fixtures.
  - Evidence: docs/plan/30-test-strategy.md covers integration but lacks mock toggle/fixtures.
  - Fix: Add Mock Ollama strategy: environment toggle, sample fixtures, and CI expectations.

- Patch edge-case fixtures list not centralized.
  - Evidence: Edge cases mentioned across docs but not listed as fixtures.
  - Fix: Add explicit fixture list (CRLF, astral-plane Unicode, empty/no-op patch, overlapping ranges rejection) under Test Data & Fixtures.

## Schemas

- Schemas include valid examples but lack invalid examples to harden understanding.
  - Evidence: docs/agents/schemas/api-contract.schema.json (examples only valid); docs/agents/schemas/patch.schema.json (no invalid examples; lacks CRLF/Unicode samples).
  - Fix: Add invalidExamples arrays and edge-case examples (CRLF, Unicode, overlapping ranges).

## Process & Queue

- Event-driven queue is emphasized and consistent; no time-boxed language detected.
  - Evidence: AIDEVOPS.md:35-41; no references to fixed schedules across repo.

## Summary of Proposed Fixes

1) Add Contracts & Schemas and Live Dev UX sections to AIDEVOPS.md
2) Insert Contracts sections with exact shapes into AGENTS.md, CLAUDE.md, Copilot instructions
3) Harmonize coverage targets to ≥80% in Test Strategy
4) Add Mock Ollama and Patch Edge-Case Fixtures to Test Strategy
5) Harden schemas with invalid and edge-case examples
6) Update PR#2 DoD to include StatusBar and non-blank shell

