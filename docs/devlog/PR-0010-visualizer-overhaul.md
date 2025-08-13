# PR-0010 — Dimensional Visualizer Overhaul + Cluster APIs

Date: 2025-08-13
Label: queue:ready

## Summary
- Introduces the Dimensional Visualizer demo with a Word Cluster Builder experience.
- Adds new clustering endpoints: `POST /api/word-cluster` and `POST /api/expand-cluster`.
- Implements vectorization utilities and a 2D canvas visualizer with optional 3D (R3F) toggle.
- Extends ModelProvider to support multi-endpoint aggregation while preserving legacy `/api/models` fallback.
- Ensures contract invariants for existing endpoints and cleanup guardrails remain unchanged.

## Changed Sections
- New API routes: `app/api/word-cluster/route.ts`, `app/api/expand-cluster/route.ts`.
- Visualizer components and hooks under `components/visualizer/`, `hooks/useClusterGeneration.ts`, `hooks/useClusterNetwork.ts`.
- Vector utilities under `lib/vectorization/`.
- Footer/Status UI: `components/AppFooter.tsx`, `components/StatusBar.tsx`, `components/ModelProvider.tsx`, `components/ModelDropdown.tsx`.
- Tests: Added coverage for new cluster endpoints; stabilized status bar polling tests.
- Docs: README API reference updated; CHANGELOG updated.

## How to Verify
```bash
# Quality gates
pnpm typecheck && pnpm lint && pnpm test

# Build (ensure environment is clean)
pnpm build && pnpm start

# Live checks (dev server)
curl -s http://localhost:3000/api/models
curl -s -X POST http://localhost:3000/api/refine \
  -H 'Content-Type: application/json' \
  -d '{"mode":"refine","input":"write a haiku","model":"gpt-oss:20b","temperature":0.2}'

# Cluster APIs
curl -s -X POST http://localhost:3000/api/word-cluster \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"customer sentiment","model":"gpt-oss:20b","temperature":0.2}'

curl -s -X POST http://localhost:3000/api/expand-cluster \
  -H 'Content-Type: application/json' \
  -d '{"word":"delivery","parentClusterId":"c1","originalPrompt":"customer sentiment","model":"gpt-oss:20b","temperature":0.2}'

# UI
# Visit /dimensional-visualizer and generate a cluster; expand a word; toggle visualization options.
```

## Risks
- Ollama runtime availability: endpoints gracefully fallback in development, but production expects a reachable Ollama service (configure `OLLAMA_BASE_URL`).
- Multi-endpoint label changes in `ModelDropdown` may surface longer labels; tests updated to be substring-tolerant.

## Notes
- No API/patch contract drift for `/api/models` and `/api/refine`.
- Cleanup heuristics and low-temperature cleanup pass remain unchanged; usage totals aggregate across passes.

