# Optimization Plan & Applied Changes

Scope: Docs-only pre-flight optimization to freeze contracts, align invariants, strengthen prompts, and clarify live dev UX. All changes retain current runtime contracts; no code modified.

## Accepted Improvements

- Contracts & Schemas in AIDEVOPS
  - Added section linking `docs/agents/schemas/api-contract.schema.json` and `docs/agents/schemas/patch.schema.json` with canonical example.
  - Rationale: Single source of truth for contracts avoids drift.
  - Updated: AIDEVOPS.md (new sections: Contracts & Schemas; Live Dev UX Contract)

- Contracts Sections in Agent Docs
  - Inserted identical "Contracts" block in AGENTS.md, CLAUDE.md, and `.github/copilot-instructions.md` including exact response snippet and request shape.
  - Rationale: Ensure identical guidance to all agents; prevent inconsistent interpretations.
  - Updated: AGENTS.md; CLAUDE.md; .github/copilot-instructions.md

- Test Strategy Harmonization
  - Coverage thresholds normalized to ≥80% for `lib/diff.ts`, `lib/history.ts`, `lib/tokens/*` to match invariants.
  - Rationale: Eliminate contradiction; stretch targets can be proposed in PRs.
  - Updated: docs/plan/30-test-strategy.md (coverage targets + enforcement examples)

- Mock Ollama & Patch Fixtures
  - Added Mock Ollama CI toggle and fixture list (CRLF, astral Unicode, empty/no-op patch, overlapping ranges rejection).
  - Rationale: Improves testability and risk mitigation.
  - Updated: docs/plan/30-test-strategy.md (new sections)

- Live Dev UX in PR #2
  - Expanded PR #2 DoD to include StatusBar (git short SHA placeholder OK, default model, Ollama state) and non-blank dev shell.
  - Rationale: Keeps localhost:3000 useful during active development and demos.
  - Updated: docs/plan/20-pr-sequence.md (PR #2 DoD)

- Schema Hardening Examples
  - Added `invalidExamples` and edge-case examples (CRLF/Unicode/overlaps) to both API and Patch schemas.
  - Rationale: Contract clarity with valid/invalid samples; aids reviewers and agents.
  - Updated: docs/agents/schemas/api-contract.schema.json; docs/agents/schemas/patch.schema.json

## How to Verify

- Contract review
  - Open AIDEVOPS.md → Contracts & Schemas section and confirm example matches schemas.
  - Check AGENTS.md, CLAUDE.md, and Copilot docs → Contracts blocks identical.

- Test strategy & fixtures
  - Open docs/plan/30-test-strategy.md → confirm coverage ≥80% targets and new Mock Ollama + fixtures sections are present.

- Live Dev UX
  - Open docs/plan/20-pr-sequence.md → PR #2 DoD lists StatusBar and non-blank shell requirement.

## Notes

- No runtime code altered. If future changes would adjust endpoints or patch schema, open an ADR in `docs/adr/` first.

