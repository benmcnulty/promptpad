# Repository Guidelines

This is the umbrella guide for all agents (Codex, Claude Code, Copilot). Follow AIDEVOPS.md for process and gates.

## Project Invariants (non‑negotiable)
- Local‑first via Ollama; default model `gpt-oss:20b`; temperature ~0.2 (≤0.3 unless justified; secondary cleanup pass ≤0.15).
- Three enhancement modes: Refine (expand), Reinforce (tighten edited draft), Spec (generate concise actionable project specification). All share the same endpoint.
- Endpoints: `GET /api/models`, `POST /api/refine` with `mode: refine|reinforce|spec` → `{ output, usage, patch? }` (patch present only for reinforce).
- Dual-layer normalization: heuristic regex cleanup ALWAYS + optional low‑temperature LLM cleanup pass when meta wrappers detected. Do not remove this without replacing with equivalent normalization + tests.
- `patch`: compact text‑range list for diff/undo/redo (single replace op today). Preserve shape.
- Single‑screen board; live token counts; output editable; Undo/Redo persisted in `localStorage`.
- Event‑driven merge via merge queue when gates pass; label `queue:ready`.

## Branching & Naming
- Branches: `feat/`, `fix/`, `docs/`, `chore/`, `refactor/`, `spike/` (+ optional `@codex|@claude|@copilot`).
- Use Conventional Commits; squash‑merge to `main`.

## Multi‑Mode + Cleanup Workflow & API Contract
- Refine: expand terse instruction into a copy‑ready prompt; may trigger semantic cleanup if raw output starts with meta framing ("Okay, here's", `**Prompt:**`, quotes, etc.).
- Reinforce: optimize current edited draft; returns refined `output` + minimal `patch` (full replace). Also eligible for cleanup pass.
- Spec: generate concise, implementation‑ready project specification (overview, stack, phased roadmap); also normalized.
- Contract is frozen: routes, payload properties, patch schema unchanged without ADR.
- Recommended internal agent instructions when editing `/api/refine` logic:
  - Refine: "Expand INPUT into a clear, actionable prompt (goals, constraints, tone, format, audience). No meta commentary. Temp ≤0.3 (cleanup ≤0.15). Return cleaned content only."
  - Reinforce: "Tighten DRAFT minimally while improving precision & structure. No meta commentary. Return only improved prompt. Provide minimal full-replace patch."
  - Spec: "Transform INPUT into focused project specification (overview, recommended stack, initial feature phases, key considerations). Avoid extraneous narration."

## Contracts (Frozen)
- Endpoints:
  - `GET /api/models`
  - `POST /api/refine` body `{ mode: "refine" | "reinforce" | "spec", input?, draft?, model, temperature }` → `{ output, usage, patch?, systemPrompt?, fallbackUsed? }`
- Canonical reinforce response example:
```
{
  "output": "<string>",
  "usage": { "input_tokens": <number>, "output_tokens": <number> },
  "patch": [ { "op": "replace", "from": [0, <prevLength>], "to": "<string>" } ]
}
```
- Schemas: `docs/agents/schemas/api-contract.schema.json`, `docs/agents/schemas/patch.schema.json`
- Do not add fields; any change requires ADR + schema + tests.

## PR Checklist (paste into description)
- [ ] Scope focused; branch rebased on `main`
- [ ] Devlog added: `docs/devlog/PR-<number>.md`
- [ ] `pnpm typecheck | lint | build | test` green (core libs ≥80% coverage)
- [ ] No API/patch drift (`/api/models`, `/api/refine`)
- [ ] Cleanup heuristics updated? → corresponding tests adjusted
- [ ] Default `gpt-oss:20b`, temp ≤0.3 (cleanup ≤0.15)
- [ ] Labeled `queue:ready`

## Handoff Protocol
- In PR description: summary, changed sections, how to verify (commands), screenshots (if UI), risks, ADR links (if invariants touched).

## Definition of Done
- Code/docs/tests updated; normalization heuristics covered; devlog appended; CI/local gates green; `CHANGELOG.md` updated; squash‑merged via queue; release tagged.

## Heuristic / Cleanup Pass Guardrails
- Add new regex patterns atomically with tests (see `__tests__/api/refine.enhanced.test.ts`).
- Never emit meta framing from cleanup pass prompt; return only substantive content.
- Keep cleanup temperature low (≤0.15) to minimize stylistic drift.
- Aggregate token usage across passes (primary + cleanup) before returning.
