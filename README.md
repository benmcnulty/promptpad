# Promptpad

> TL;DR: A **minimal drafting board** for prompts. Paste a rough instruction → Promptpad expands it into a clear, copy‑ready prompt. You can then **send the edited draft back** through the local model for a *reinforcement pass* that tightens coordination among goals, constraints, style, and variables. Local‑first via **Ollama** (optimized for **`gpt-oss:20b`**), with **live token counts**, **diff review**, and **undo/redo** so you never lose work.

---

## What it does (straight line)
1. **Type** a short instruction on the left.
2. **Pick a model** from your local Ollama list (defaults to **`gpt-oss:20b`**).
3. **Refine** → Promptpad expands your instruction into a single, structured, **copy‑ready** prompt.
4. **Edit** the output freely.
5. **Reinforce** → sends your *current edited draft* back to the model to tighten coordination (nuanced goals, success criteria, constraints, tone, variables). The result comes back as a **diff** you can apply or undo.
6. **Copy** the final text into any LLM/chat client.

One screen. Minimal controls. No accounts. No cloud by default.

---

## MVP Features
- **Drafting board UI**: input (left) → refined output (right)
- **Model select** (Ollama) with default **`gpt-oss:20b`**
- **Live token counts** for input and output (approximate; pluggable tokenizers)
- **Refine** (first pass) and **Reinforce** (send your edited draft back)
- **Diff review + Apply/Undo** for LLM‑proposed changes
- **Undo/Redo history stack** for *all* changes (user edits + LLM diffs), persisted to local storage
- **One‑click Copy**

> Deeper agent guidance will live in **AGENTS.md**, **Claude.md**, and **.github/copilot-instructions.md** later. This README focuses on the end‑user workflow.

---

## Tech Stack
- **Next.js** (App Router) + **TypeScript**
- **Tailwind CSS** for fast, consistent styling
- **Ollama** for local inference (optimized for **`gpt-oss:20b`**)
- **Local storage only** for history; no server database in the MVP

---

## Architecture (minimal, clear)
```
app/
  page.tsx                # drafting board (input ↔ output)
  api/
    models/route.ts       # GET → list local Ollama models
    refine/route.ts       # POST → refine or reinforce via Ollama
lib/
  ollama.ts               # adapter (list, generate)
  tokens/
    index.ts              # pluggable token counters
    tiktoken.ts           # default approx. counter (@dqbd/tiktoken)
  history.ts              # undo/redo stack + localStorage persistence
  diff.ts                 # minimal text diff/patch helpers
styles/                   # Tailwind
```

**Token counting**
- Default: `@dqbd/tiktoken` (fast, browser/edge friendly). It’s an **approximation** for open‑models; that’s fine for UX.
- Design is **pluggable** so model‑specific tokenizers can be swapped in.

---

## Quickstart

### Prereqs
- Node.js ≥ 20
- **Ollama** installed and running (https://ollama.com)
- Pull the primary model:
  ```bash
  ollama pull gpt-oss:20b
  ```
  Optionally pull extras:
  ```bash
  ollama pull llama3.2
  ollama pull gemma3
  ollama pull qwen3
  ```

### Install & Run (after scaffold)
```bash
git clone https://github.com/benmcnulty/promptpad
cd promptpad
pnpm install    # or npm/yarn
pnpm dev        # http://localhost:3000
```

---

## API Sketch

### GET /api/models
Lists local models from Ollama (default highlighted is `gpt-oss:20b`).
```json
[
  { "name": "gpt-oss:20b", "family": "gpt-oss", "parameters": "20b" },
  { "name": "llama3.1",    "family": "llama",    "parameters": "8b" }
]
```

### POST /api/refine
Handles both **Refine** and **Reinforce** (controlled by `mode`).

**Body**
```json
{
  "mode": "refine", // or "reinforce"
  "input": "summarize this article for policy analysts",
  "draft": "<optional current edited draft when mode=reinforce>",
  "model": "gpt-oss:20b",
  "temperature": 0.2
}
```
**Response**
```json
{
  "output": "<expanded or reinforced copy‑ready prompt>",
  "usage": { "input_tokens": 123, "output_tokens": 256 },
  "patch": [
    { "op": "replace", "from": [100,120], "to": "new text" }
  ]
}
```
> The `patch` is a compact text‑range operation list so the UI can show a diff, apply it, and push an entry onto the undo/redo stack.

---

## UX Notes
- **Layout**: left (input + token count), right (output + token count)
- **Controls**: model dropdown (default `gpt-oss:20b`), **Refine**, **Reinforce**, **Undo**, **Redo**, **Copy**
- **Diffs**: reinforcement returns a diff; user can apply or discard
- **History**: every mutation (typing or applied diff) pushes to the local stack; survives reload via localStorage
- **Accessibility**: semantic controls, focus rings, readable defaults

---

## Roadmap (scope‑disciplined)
- [ ] Agent guidance docs (AGENTS.md, Claude.md, copilot‑instructions.md)
- [ ] Scaffold Next.js app (App Router, TS, Tailwind)
- [ ] Ollama adapter (list, generate) tuned for **`gpt-oss:20b`**
- [ ] Token counter (tiktoken approx.)
- [ ] Undo/redo history + localStorage persistence
- [ ] Diff UI for reinforcement pass

---

## License
MIT © Ben McNulty