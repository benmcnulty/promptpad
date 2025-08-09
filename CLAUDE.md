# Claude Code Execution Manual

This manual tells Claude Code exactly how to work here. Model defaults or context windows are irrelevant to process; follow the gates in AIDEVOPS.md.

## Invariants & Boundaries
- Local‑first via Ollama; default `gpt-oss:20b`; temperature ~0.2 (≤0.3 unless justified).
- Only two operations: Refine and Reinforce. Keep endpoints stable.
- Endpoints: `GET /api/models`, `POST /api/refine` with `mode: refine|reinforce` → `{ output, usage, patch? }`.
- Patch format: compact text‑range ops used by diff/undo/redo. Do not change without an ADR.

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

## Two‑Pass Workflow & Prompts
- Refine: expand terse `input` into a clear, copy‑ready prompt. Prompt: “Expand the input into a structured prompt; keep temp ≤0.3; return `{ output, usage }`.”
- Reinforce: tighten the edited `draft` (goals, constraints, tone, variables). Prompt: “Return full `output` plus minimal `patch` list for diff/undo.”

## Process & Merge Queue
- Use Conventional Commits; focused branches `feat/|fix/|docs/|chore/|refactor/|spike/` with optional `@claude`.
- Append a devlog file `docs/devlog/PR-<number>.md` with commands and outputs.
- If invariants or API would change, open an ADR and link it; do not merge without acceptance.
- Mark PR `queue:ready` only when typecheck, lint, build, tests are green and checklist is complete.

## Examples
- Commit: `feat(refine): show token counts beside editors`
- Commit: `fix(reinforce): correct patch ranges on CRLF files`
- PR includes: checklist, devlog link, screenshots (if UI), and confirmation of no API/patch drift.
