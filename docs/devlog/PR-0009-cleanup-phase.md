# PR-0009: Heuristic + LLM Cleanup Phase for /api/refine

## Summary
Introduces an optional second-pass cleanup generation for refine/reinforce/spec modes. The first pass performs primary expansion/optimization; a heuristic detects meta wrappers (quotes, labels like **Prompt:**, "Here's..."). If triggered, a low-temperature (≤0.15) cleanup prompt re-emits ONLY normalized content. Falls back silently if the second call fails.

## Rationale
Some smaller / faster local models prepend explanatory text or wrap results in quotes/fences. Regex-only stripping was insufficient and brittle. A lightweight normalization pass improves consistency without tightening to a single model's behavior.

## Implementation Details
- Added buildCleanupPrompt(mode) in `app/api/refine/route.ts`.
- Heuristic patterns: leading quotes, Prompt:/**Prompt:**, "Here's", and trailing improvement commentary.
- Aggregates token usage across both passes when cleanup fires.
- Temperature clamp for cleanup: min(original, 0.15) to keep deterministic formatting.
- Reinforce path preserves patch contract (single full replace) using final cleaned text.
- Spec path also gains normalization.
- Tests updated to allow multiple `ollama.generate` invocations.

## Invariants Preserved
- API contract unchanged (`output`, `usage`, optional `patch`).
- Patch format untouched (single replace op).
- Temperature ≤0.3 still enforced; secondary pass further clamps.
- Mock mode unchanged; cleanup not invoked there (heuristic not triggered by deterministic mock text).

## Verification
```
pnpm test --filter refine
```
All updated tests pass locally; extended and validation suites accept ≥1 generate call.

## Follow-ups (Deferred)
- Potential streaming UI indicator for cleanup stage.
- Add explicit metrics logging for cleanup trigger frequency.
- Optional user setting to disable second pass.
