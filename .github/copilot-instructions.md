## Copilot Project Instructions (Promptpad)

Purpose: Enable AI agents to immediately contribute productively while preserving core design choices of Promptpad (local-first, two-pass refinement, diff-based reinforcement).

### 1. Big Picture
- Single-screen Next.js (App Router) app: left raw instruction → right refined / reinforced prompt.
- Two-pass workflow: Refine (expand terse input) → user edits → Reinforce (tighten + return diff patch over edited draft).
- Local-first inference via Ollama (default model `gpt-oss:20b`, temperature ≈ 0.2 for deterministic structure).
- All mutations (typing + applied patches) feed an undo/redo history persisted in `localStorage`.

### 2. Key Directories & Roles
- `app/page.tsx`: Drafting board UI (inputs, model select, token counts, buttons: Refine / Reinforce / Undo / Redo / Copy / Diff apply).
- `app/api/models/route.ts`: GET list of local Ollama models.
- `app/api/refine/route.ts`: POST refine or reinforce (switch by `mode`).
- `lib/ollama.ts`: Adapter (list models, generate text) – never hardcode model list; query runtime.
- `lib/tokens/`: Pluggable token counters (default `tiktoken.ts`). Keep lightweight approximations; UX only.
- `lib/history.ts`: Unified undo/redo stack (user edits + applied diffs) + persistence.
- `lib/diff.ts`: Minimal diff + patch application used by Reinforce responses.

If any path above is missing, scaffold it following the described responsibility before adding features.

### 3. API Contracts (do not drift silently)
GET /api/models → array of model metadata `{ name, family, parameters }` (must include default `gpt-oss:20b` if installed).
POST /api/refine (both modes):
```json
{
	"mode": "refine" | "reinforce",
	"input": "short instruction",
	"draft": "<current edited draft when mode=reinforce>",
	"model": "gpt-oss:20b",
	"temperature": 0.2
}
```
Response (reinforce may include patch):
```json
{
	"output": "expanded or reinforced text",
	"usage": { "input_tokens": 123, "output_tokens": 256 },
	"patch": [ { "op": "replace", "from": [100,120], "to": "new text" } ]
}
```
Invariant: Reinforce should return both full `output` AND minimal `patch` so UI diff can be previewed before applying.

### 4. Design Principles / Invariants
- Deterministic structure: keep temperature low (≈0.2) unless explicitly adding creative mode.
- Diff granularity: prefer smaller, surgical patches (avoid sending entire document as a single replace unless unavoidable).
- Token counts are approximate; do not gate logic on them (display only).
- Local-first: never introduce remote calls or cloud persistence without explicit opt-in.

### 5. Coding & Naming Conventions
- TypeScript strict, React function components.
- File names: kebab-case modules; components PascalCase; API route segments lowercase.
- Tailwind-first styling; extract utility functions before creating new component wrappers.
- Keep API handlers slim; push model / diff / token logic into `lib/` utilities.

### 6. Typical Dev Workflow
```bash
pnpm install        # deps
ollama pull gpt-oss:20b   # ensure default model
pnpm dev            # run at http://localhost:3000
pnpm build && pnpm start  # production check
```
Add tests (Vitest/Jest) colocated once logic (diff, history, token counting) stabilizes; name `*.test.ts`.

### 7. When Extending
- Adding a new prompt operation? Reuse POST /api/refine with a new `mode` only if semantics still return `{ output, patch? }`; otherwise create a dedicated route.
- Modifying reinforce logic? Preserve patch format shape to avoid front-end breakage.
- Introducing new tokenizer: implement `tokens/<name>.ts` exporting a uniform `count(text): number` and wire via an index dispatcher.
- UI changes affecting history: ensure every state-changing action still pushes onto the unified history stack (for replay + persistence consistency).

### 8. Safety / Validation
- Before generation, verify requested `model` appears in GET /api/models; fallback gracefully to default.
- Reject empty `input` on refine and empty `draft` on reinforce early with 400 (lightweight checks).

### 9. Example Patch Logic (Reinforce)
Pseudo: compute diff(oldDraft, newDraft) → emit minimal replace ops `[ { op, from: [start,end], to } ]`; front-end applies sequentially and records one history entry.

### 10. Agent Focus
Prioritize: correctness of API contract, minimal diff patches, preserving local-first guarantees, and keeping operations deterministic. Ask for clarification only when a change would alter listed invariants.

---
Feedback welcome: Which sections need more specificity (e.g., diff algorithm, history schema)? Specify and this doc will be refined.
