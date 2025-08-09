# Repository Guidelines

This is the umbrella guide for all agents (Codex, Claude Code, Copilot). Follow AIDEVOPS.md for process and gates.

## Project Invariants (non‑negotiable)
- Local‑first via Ollama; default model `gpt-oss:20b`; temperature ~0.2 (≤0.3 unless justified).
- Exactly two operations: Refine (expand) and Reinforce (tighten over edited draft).
- Endpoints: `GET /api/models`, `POST /api/refine` with `mode: refine|reinforce` → `{ output, usage, patch? }`.
- `patch`: compact text‑range list for diff/undo/redo.
- Single‑screen board; live token counts; output editable; Undo/Redo persisted in `localStorage`.
- Event‑driven merge via merge queue when gates pass; label `queue:ready`.

## Branching & Naming
- Branches: `feat/`, `fix/`, `docs/`, `chore/`, `refactor/`, `spike/` (+ optional `@codex|@claude|@copilot`).
- Use Conventional Commits; squash‑merge to `main`.

## Two‑Pass Workflow & API Contract
- Refine: expand terse instruction into a copy‑ready draft.
- Reinforce: take the current edited draft, return refined `output` + minimal `patch`.
- Do not change routes, payloads, or patch schema without an ADR.
- Agent prompts when touching `/api/refine`:
  - Refine: “Generate a structured prompt from `input`. Keep temp ≤0.3. Return `{ output, usage }`.”
  - Reinforce: “Tighten coordination of `draft` (goals, constraints, tone, variables). Return full `output` and minimal `patch` list.”

## Contracts (Frozen)
- Endpoints:
  - `GET /api/models`
  - `POST /api/refine` body `{ mode: "refine" | "reinforce", input?, draft?, model, temperature }` → `{ output, usage, patch? }`
- Canonical response example:
```
{
  "output": "<string>",
  "usage": { "input_tokens": <number>, "output_tokens": <number> },
  "patch": [
    { "op": "replace", "from": [<start>, <end>], "to": "<text>" }
  ]
}
```
- Schemas: `docs/agents/schemas/api-contract.schema.json`, `docs/agents/schemas/patch.schema.json`
- Patch ops are compact text‑range entries; no contract drift without ADR.

## PR Checklist (paste into description)
- [ ] Scope focused; branch rebased on `main`
- [ ] Devlog added: `docs/devlog/PR-<number>.md`
- [ ] `pnpm typecheck | lint | build | test` green (≥80% for `lib/diff.ts`, `lib/history.ts`, `lib/tokens/*`)
- [ ] No API/patch drift (`/api/models`, `/api/refine`)
- [ ] Default `gpt-oss:20b`, temp ≤0.3
- [ ] Labeled `queue:ready`

## Handoff Protocol
- In PR description: summary, changed sections, how to verify (commands), screenshots (if UI), risks, ADR links (if invariants touched).

## Definition of Done
- Code/docs/tests updated; devlog appended; CI/local gates green; squash‑merged via queue; `CHANGELOG.md` updated and release tagged.
