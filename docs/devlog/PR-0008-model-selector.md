# PR-0008 — Model Selector + Preferences

Status: proposed

## Summary
- Add a persistent Ollama model selector (dropdown) in the footer, populated from `/api/models`.
- Selected model is saved to `localStorage` and used by all refine/reinforce operations.
- Update welcome modal to include a generic Ollama install note and link.
- Debug panel button relabeled to “Reset Local Storage” and clears welcome, accent, and model.

## Changes
- UI
  - `components/ModelProvider.tsx`: central preference + models state, fetch on mount, persist selection.
  - `components/ModelDropdown.tsx`: custom dropdown (upward positioning) using ModelProvider.
  - `components/StatusBar.tsx`: replace static model label with dropdown.
  - `app/layout.tsx`: wrap app with `ModelProvider` (inside `ThemeProvider`).
  - `app/page.tsx`: pass selected model into `useRefine`; update welcome modal instructions and debug reset button.
- Tests
  - `__tests__/components/ModelDropdown.test.tsx`: basic selection and persistence.
- Docs
  - README: add “Model Selector” feature.
  - CHANGELOG: entries for model selector and welcome modal copy.

## Verification
- Typecheck + lint.
- Mock fetch in tests to validate dropdown + persistence.
- Manual: switch model via footer; run refine/reinforce; requests use the selected model.

## Risks
- If `/api/models` fails, dropdown shows an error tooltip and retains previous selection.
- Preference keys: `promptpad-model` introduced; reset button clears it along with `promptpad-accent` and `promptpad-welcome-dismissed`.

## DoD
- No API contract drift; selection only changes the `model` sent to existing endpoints.
- UI consistent with existing dropdown styling and behavior.
