## Summary
- What change does this PR introduce? Why?

## Changed Sections
- Files/areas touched:

## Verification
- Commands:
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm build`
  - `pnpm test`
- Screenshots (if UI):

## Risks
- Potential impact and mitigations:

## ADR Links (if any)
- If invariants changed, link ADRs here

## PR Checklist
- [ ] Scope focused; branch rebased on `main`
- [ ] Devlog added: `docs/devlog/PR-<number>.md`
- [ ] `pnpm typecheck | lint | build | test` green (≥80% for `lib/diff.ts`, `lib/history.ts`, `lib/tokens/*`)
- [ ] No API/patch drift (`/api/models`, `/api/refine`)
- [ ] Default `gpt-oss:20b`, temp ≤0.3
- [ ] Labeled `queue:ready`
