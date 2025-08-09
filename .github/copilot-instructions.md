## Copilot Behavior Contract (Promptpad)

Purpose: Contribute small, precise diffs that preserve core invariants and pass process gates in AIDEVOPS.md.

### 1) Non‑negotiable Rules
- Do not alter API routes/signatures or patch schema without an ADR. Endpoints: `GET /api/models`, `POST /api/refine` with `mode: refine|reinforce` → `{ output, usage, patch? }`.
- Keep local‑first defaults: Ollama, `gpt-oss:20b`, temperature ~0.2 (≤0.3 unless justified).
- Only two operations exist: Refine and Reinforce. The UI is single‑screen with live token counts and Undo/Redo via `localStorage`.

### 2) Change Patterns to Prefer
- Small, single‑responsibility diffs; avoid cross‑cutting refactors.
- Test‑first for `lib/diff.ts`, `lib/history.ts`, `lib/tokens/*`; update tests alongside changes.
- Maintain stable patch format: compact text‑range ops for diff/undo/redo.
- Keep API handlers thin; push logic into `lib/` pure functions.

### 3) Commits & PRs
- Conventional Commits examples:
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
