## PR #3: consistent, approved Ollama endpoint routing

- Branch: `fix/ollama-endpoint-routing`
- Agent: Codex
- Scope: endpoint routing/onboarding fixes and implementation-grounded README.
- Summary: documented server/CLI environment settings configure the primary adapter. Catalog, primary and cleanup requests use the selected approved destination without changing JSON/patch fields. Spec tracks actual request progress. CLI startup is portable on Windows.
- Touched areas: Ollama adapter/selector, model provider, generation routes/hooks, CLI entry point, configuration/README, regression tests, proposed ADR 001 and changelog.
- Test evidence: frozen pnpm lock installed; typecheck/lint passed; final Next production build passed; CLI `--help` passed. 56 Jest suites/213 tests passed, 2 skipped. The global coverage command exits 1: 56.14% statements, 47.01% branches, 57.58% lines, 45.64% functions. The unchanged baseline likewise fails (53.8/44.11/55.4/45.23%). Required diff/history/token-library thresholds pass. No thresholds were weakened.
- Review corrections: production build required a nonoptional Request parameter; model catalog now selects an installed model if the default is absent and preserves endpoint/model pairs even when names overlap.
- Risks: no real Ollama/LAN/DNS/CORS, full browser/accessibility or optional 3D verification. Generation remains a soft timeout; allowlisting is not authentication or DNS isolation. Build warned about a missing server tiktoken WASM file and used heuristic counts.
- Follow-ups: address the existing global coverage gap and token WASM packaging before claiming readiness. See [dated verification](../verification-2026-10-02.md) and [ADR 001](../adr/001-server-endpoint-selection.md).
- Delivery: draft PR only. `queue:ready`, merges and releases are excluded by user authorization and are not claimed.
