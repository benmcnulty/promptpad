Title: Polish – progress tracker alignment, label contrast, prompt tightening

Summary
- Improve progress tracker label alignment and readability across themes.
- Add subtle text-shadow/outline for labels to ensure sufficient contrast.
- Tighten refine/reinforce system prompts to produce more professional, copy‑ready outputs while respecting frozen API contracts and temp ≤0.3.

Changed
- components/ProgressTracker.tsx: align label row padding with icon row; apply contrast utility in error state.
- app/globals.css: add contrast to `.progress-step-label-*`; introduce `.label-contrast` utility.
- app/api/refine/route.ts: strengthen `buildRefinePrompt` and `buildReinforcePrompt`; maintain Promptpad identity; keep outputs meta‑free; ES2017‑safe regex fix.

Verification
- pnpm typecheck | lint | test | test:coverage → all green locally.
- Visual: labels render with subtle depth in light/dark and all accents; progress labels center more consistently under step dots.
- API: `POST /api/refine` returns `{ output, usage, patch? }`; no contract drift; temperature clamped ≤0.3.

Risks
- Very low; UI changes are cosmetic and scoped. Prompt tweaks remain within documented guardrails (no meta text, no AI params).

How to test
- Run `pnpm dev`, open the app, trigger Refine/Reinforce cycles; observe progress tracker labels and output quality.

