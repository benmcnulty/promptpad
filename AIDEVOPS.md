# AIDEVOPS: Collaboration & Delivery Playbook (Promptpad)

> Purpose: Coordinate Codex, Claude Code, and GitHub Copilot to build Promptpad with **predictable branches, safe merges, exhaustive logging, and green builds**. This document is the single source of truth for how agents work together.

Aligned docs: see **AGENTS.md**, **CLAUDE.md**, and **.github/copilot-instructions.md** for agent‑specific behavior. This file defines **process** and **gates**.

---

## 1) Project Invariants
- **Local‑first** inference via Ollama; default model **`gpt-oss:20b`** at low temperature (~0.2).
- **Two operations only**: `Refine` (expand) and `Reinforce` (tighten over edited draft). API contract and patch shape **must not drift**.
- **Single‑screen drafting board**: left input, right output, live token counts; output always editable.
- **Event‑driven integration**: *no time‑boxed schedules*. PRs merge whenever they are green and ready.
- **No secrets committed**; no cloud persistence without explicit opt‑in.

---

## Contracts & Schemas (Frozen)
- Endpoints:
  - `GET /api/models`
  - `POST /api/refine` body `{ mode: "refine" | "reinforce", input?, draft?, model, temperature }` → `{ output, usage, patch? }`
- Patch: compact text‑range list used for diff/undo/redo.
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
- JSON Schemas (source of truth):
  - `docs/agents/schemas/api-contract.schema.json`
  - `docs/agents/schemas/patch.schema.json`

Any change requires an ADR before implementation.

---

## Live Dev UX Contract
- StatusBar (visible from PR #2 onward):
  - `git` short SHA (placeholder OK)
  - Default model (`gpt-oss:20b`) and selected model
  - Ollama state: `connected | offline` (simulated acceptable in scaffold)
  - Temperature (capped at ≤0.3)
- Single-screen board stays functional during dev:
  - Left: input; Right: editable output; live token counts
  - Non-blank dev shell with basic health logs (env, port, model default)
- Undo/Redo must persist via `localStorage` once implemented (PRs #6–#7).

Contributors should keep `pnpm dev` running on `localhost:3000` when working on UI/UX.

---

## 2) Branching Model & Names
- Default protected branch: **`main`** (always releasable).
- Short‑lived working branches:
  - `feat/<scope>` – new user‑facing capability
  - `fix/<scope>` – bug fix
  - `chore/<scope>` – tooling, deps, scripts
  - `docs/<scope>` – documentation only
  - `refactor/<scope>` – internal changes, no behavior change
  - `spike/<scope>` – exploratory, must be short‑lived and not merged without conversion
- Optional agent attribution suffix: `@codex`, `@claude`, `@copilot` (e.g., `feat/token-counter@copilot`).

**Rules**
- Keep branches focused; rebase on latest `main` before opening a PR.
- Prefer **squash merges** into `main` with a clean Conventional Commit subject.

---

## 3) Merge Queue (Gated Continuous Integration)
- **No fixed windows.** A PR enters the **merge queue** when all gates (Section 5) are green and it is labeled `queue:ready`.
- Queue processes **one PR at a time** to avoid conflicts:
  1) Rebase on latest `main`.
  2) Re‑run required checks.
  3) **Squash‑merge** if still green; otherwise auto‑remove `queue:ready` and post failures.
- If post‑merge checks fail, **revert immediately**, remove label, and log the incident in the devlog.

---

## 4) Logging & Traceability
- **Devlog** files: `docs/devlog/PR-<number>.md` (one per PR). This eliminates day‑based bottlenecks.
- **ADRs** (Architecture Decision Records): `docs/adr/NNN‑title.md` for any decision that changes an invariant or API.
- **Changelog**: `CHANGELOG.md` updated on each merged PR (keep‑a‑changelog format; unreleased → released).

### Devlog Entry Template
```
## <PR #123> <short title>
- Branch: <name>
- Author/Agent: <codex|claude|copilot|human>
- Scope: <feat|fix|chore|docs|refactor>
- Summary: <2‑3 lines>
- Touched Areas: [files/dirs]
- Test Evidence: <commands run + results / screenshots>
- Risks & Mitigations: <bullets>
- Follow‑ups: <issue links>
```

### ADR Template
```
# ADR NNN: <Title>
Date: YYYY‑MM‑DD
Status: Proposed | Accepted | Superseded by NNN
Context: <why a change is needed>
Decision: <what we will do>
Consequences: <trade‑offs, risks>
References: <links to PRs, docs>
```

---

## 5) Quality Gates (CI + Local)
Before a PR can join the merge queue, agents must pass **all** of:

**Local checks (run and paste outputs into the PR):**
- `pnpm typecheck` – TS must be clean
- `pnpm lint` – ESLint + Prettier
- `pnpm build` – Next.js build
- `pnpm test` – unit tests (min coverage 80% for `lib/diff.ts`, `lib/history.ts`, `lib/tokens/*`)

**CI checks (GitHub Actions suggested)**
- Node 20, pnpm cache, same commands as local
- Disallow merging unless CI green and at least one approval

> Add workflow later at `.github/workflows/ci.yml` using the snippet in Section 10.

---

## 6) Commit & PR Conventions
**Conventional Commits** (examples):
- `feat(refine): show token counts beside editors`
- `fix(reinforce): correct patch ranges when CRLF lines`
- `chore(ci): cache pnpm store`

**PR Checklist** (must be in the description):
- [ ] Scope is single‑purpose; branch rebased on `main`
- [ ] Devlog entry appended (`docs/devlog/PR-<number>.md`)
- [ ] Tests added/updated and passing
- [ ] Screenshots/GIF for UI changes
- [ ] No API contract drift (`/api/refine`, `/api/models`, patch shape)
- [ ] Default model remains **`gpt-oss:20b`**; temperature ≤ 0.3 unless justified
- [ ] Labeled `queue:ready` when gates pass

---

## 7) Test Scope (MVP Priority)
- `lib/diff.ts`: minimal patch format → apply/undo correctness
- `lib/history.ts`: push/undo/redo, persistence to `localStorage`, hydration on reload
- `lib/tokens/*`: count is stable (approximate OK), does not block UI
- `app/api/refine/route.ts`: returns `{ output, usage, patch? }` per mode; validates `model` via `/api/models`

> Add React component tests for the drafting board after core libs stabilize.

---

## 8) Release Cadence & Versioning (Continuous)
- Pre‑1.0: **SemVer 0.x**. Each merged PR updates version **immediately**:
  - `feat:` → minor bump
  - `fix:` → patch bump
  - `chore/docs/refactor:` → patch bump (unless `!`)
- Release steps (automated or scripted):
  1) Update `CHANGELOG.md`
  2) Tag `v0.<minor>.<patch>` and push
  3) Create GitHub Release with highlights

Rollback: `git revert` the offending squash commit; update devlog with reason and follow‑up issue.

---

## 9) Security & Compliance
- Never commit secrets.
- Local‑first by default; any cloud integration must be opt‑in and documented.
- Validate model availability before generation; default to **`gpt-oss:20b`**.

---

## 10) Snippets You Can Drop In

### 10.1 CI (Node 20 + pnpm) – `.github/workflows/ci.yml`
```yaml
name: ci
on:
  pull_request:
    branches: [ main ]
  push:
    branches: [ main ]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with:
          version: 9
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm build
      - run: pnpm test -- --coverage
```

### 10.2 PR Template – `.github/PULL_REQUEST_TEMPLATE.md`
```md
## Summary

## Changes
- 

## Checklist
- [ ] Rebased on `main`
- [ ] Devlog entry appended (docs/devlog/PR-<number>.md)
- [ ] Tests passing (ci + local)
- [ ] UI screenshot/GIF attached (if applicable)
- [ ] No API contract drift (`/api/refine`, `/api/models`, patch shape)
- [ ] Labeled queue:ready

## Notes for Reviewers
```

### 10.3 CODEOWNERS – `.github/CODEOWNERS`
```txt
* @benmcnulty
app/** @benmcnulty
lib/** @benmcnulty
```

### 10.4 Devlog Seed – `docs/devlog/README.md`
```md
Create one file per PR named PR-<number>.md. Use the template in AIDEVOPS.md.
```

### 10.5 ADR Seed – `docs/adr/000-template.md`
```md
# ADR 000: Template
Date: 2025-08-09
Status: Proposed
Context:
Decision:
Consequences:
References:
```

---

## 11) Agent Handoff Protocol
When an agent finishes a task, it must leave a **handoff note** inside the PR description:
- Summary of changes
- Known limitations / TODOs
- How to reproduce and verify locally (commands)
- Impacted invariants (if any) and links to ADRs

If a change would break invariants, the agent **must** open an ADR and wait for acceptance before merging.

---

## 12) Alignment with Existing Guidance
- Mirrors **AGENTS.md** two‑pass workflow and `gpt-oss:20b` default.
- Enforces **CLAUDE.md** architecture (API endpoints, lib responsibilities).
- Implements **copilot‑instructions.md** API contract and patch shape as non‑negotiable gates.

---

## 13) Definition of Done (DoD)
A change is **Done** when:
- [ ] Code + tests + docs updated
- [ ] Devlog entry appended
- [ ] CI green; PR approved
- [ ] **Merged via the queue**; changelog updated and release tagged

---

## 14) Open Questions (track via issues)
- Do we adopt GitHub's native Merge Queue or a lightweight bot?
- What minimal diff algorithm provides best UX/complexity trade‑off?
- Do we need a read‑only “share link” mode before 0.2.0?

---

**End of Playbook**
