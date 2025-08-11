## Copilot Behavior Contract (Promptpad)

Purpose: Contribute small, precise diffs that preserve core invariants and pass process gates in AIDEVOPS.md.

### 1) Non‑negotiable Rules
### 1) Non‑negotiable Rules
- Do not alter API routes/signatures or patch schema without an ADR. Endpoints: `GET /api/models`, `POST /api/refine` with `mode: refine|reinforce|spec` → `{ output, usage, patch? }`.
- Keep local‑first defaults: Ollama, `gpt-oss:20b`, temperature ~0.2 (≤0.3 unless justified). Cleanup secondary pass ≤0.15.
- Three operations exist: Refine, Reinforce, Spec. The UI is single‑screen with live token counts and Undo/Redo via `localStorage`.

### Contracts (Frozen)
  - `GET /api/models`
  - `POST /api/refine` body `{ mode: "refine" | "reinforce", input?, draft?, model, temperature }` → `{ output, usage, patch? }`
### Contracts (Frozen)
- Endpoints:
  - `GET /api/models`
  - `POST /api/refine` body `{ mode: "refine" | "reinforce" | "spec", input?, draft?, model, temperature }` → `{ output, usage, patch? }`
- Canonical response example (usage aggregated across primary + optional cleanup generation):
```
Operations: Refine expands, Reinforce improves (patch diff), Spec produces concise actionable project specification. Patches limited to text range replace ops.
  "output": "<string>",
  "usage": { "input_tokens": <number>, "output_tokens": <number> },
### 2) Change Patterns to Prefer
- Small, single‑responsibility diffs; avoid cross‑cutting refactors.
- Test‑first for `lib/diff.ts`, `lib/history.ts`, `lib/tokens/*`; update tests alongside changes.
- Maintain stable patch format: compact text‑range ops for diff/undo/redo.
- Preserve dual-layer normalization (heuristic regex + optional semantic cleanup). Adjust heuristics only with targeted tests.
- Keep API handlers thin; push logic into `lib/` pure functions.
```
- Schemas: `docs/agents/schemas/api-contract.schema.json`, `docs/agents/schemas/patch.schema.json`

### 2) Change Patterns to Prefer
- Small, single‑responsibility diffs; avoid cross‑cutting refactors.
### 3) Commits & PRs
- Conventional Commits examples:
  - `feat(refine): add token count beside editor`
  - `fix(reinforce): correct patch ranges for CRLF`
  - `feat(spec): tighten architecture section formatting`
  - `chore(ci): add pnpm cache`
- PR checklist (paste in body):
  - [ ] Rebased on `main`; scope focused
  - [ ] Devlog added: `docs/devlog/PR-<number>.md`
  - [ ] `pnpm typecheck | lint | build | test` green (≥80% for core libs)
  - [ ] No API/patch drift (`/api/models`, `/api/refine`)
  - [ ] Dual-layer cleanup intact (heuristic + optional semantic pass)
  - [ ] Default `gpt-oss:20b`, temp ≤0.3 (cleanup ≤0.15)
  - [ ] Labeled `queue:ready`
- Test‑first for `lib/diff.ts`, `lib/history.ts`, `lib/tokens/*`; update tests alongside changes.
- Maintain stable patch format: compact text‑range ops for diff/undo/redo.
### 5) Safety & Validation
- Validate `model` via `GET /api/models` before generation; fallback to default.
- Reject invalid inputs early: empty `input` for refine/spec; empty `draft` for reinforce.
- Aggregate usage across all generations (primary + cleanup) for accurate token accounting.
### 3) Commits & PRs
Focus on correctness of API contract, minimal diffs, dual-layer normalization fidelity, and local‑first behavior. Mark `queue:ready` only when all checks are demonstrated in the PR body.
  - `feat(refine): add token count beside editor`
  - `fix(reinforce): correct patch ranges for CRLF`
  - `chore(ci): add pnpm cache`
- PR checklist (paste in body):
  - [ ] Rebased on `main`; scope focused
  - [ ] Devlog added: `docs/devlog/PR-<number>.md`
  - [ ] `pnpm typecheck | lint | build | test` green (≥80% for core libs)
  - [ ] No API/patch drift (`/api/models`, `/api/refine`)
  - [ ] Default `gpt-oss:20b`, temp ≤0.3
  - [ ] Labeled `queue:ready`

### 4) Merge Queue & Logging
- Event‑driven merges only when gates pass; label `queue:ready` to enter queue.
- Append a devlog per PR with commands and outputs: `docs/devlog/PR-<number>.md`.
- If a change would touch invariants, open an ADR in `docs/adr/` and obtain acceptance before merging.

### 5) Safety & Validation
- Validate `model` via `GET /api/models` before generation; fallback to default.
- Reject invalid inputs early: empty `input` for refine; empty `draft` for reinforce.

### 6) How to Verify (paste in PR)
```bash
pnpm typecheck
pnpm lint
pnpm build
pnpm test -- --coverage
```

Focus on correctness of API contract, minimal diffs, and local‑first behavior. Mark `queue:ready` only when all checks are demonstrated in the PR body.
