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

### Independent-review follow-up, verified

Health metadata no longer changes the catalog destination list or re-arms mount
checks. Newly added endpoints are checked from their actual snapshot. Saved,
custom and removed selections require a deliberate replacement; status checks
use that selection and ignore superseded responses. A real-provider integration
suite exercises timer cadence, adding/deleting endpoints, generation blocking
and selected/unapproved status. The final follow-up passed typecheck, lint with zero warnings, 57 suites/218
tests (2 skipped), production build and CLI help. Global coverage remains red at
58.71/48.48/59.9/49.17%; prior counts above describe the earlier candidate.

The added CI uses read-only contents permission, mock inference and no deployment
steps. It preserves the current coverage threshold and reports its failure.

### Focused regression assurance follow-up

- Ownership: isolated `fix/regression-assurance-2026-10-02` checkout, based exactly
  on frozen `349865dbd10491ee6852e3c5905c4777b1619173`; parent integrates the reviewed
  candidate. No remote writes, merge, release, deployment or live provider calls.
- Replaced the skipped builder suite with actual editor/callpoint/executor and
  browser-storage flows. Added coverage of save quota errors, import validation,
  repeated execution after failure, tagged model selection and zero temperature.
- Added route/adapter tests with mocked fetch for cluster parsing, padding,
  capped temperature, development fallback, production service errors,
  malformed requests and rejection of forbidden endpoint destinations.
- Added navigation/effects/theme/endpoint-control tests and word-network flows
  that exercise the real generation and persistence hooks, failed expansion,
  retry, remount and clearing during a pending request.
- Added GPU-boundary tests using real Three objects and mounted React components
  for scene grouping, missing-edge filtering, event identity, instance matrices,
  animation transforms, loading and fallback recovery. Canvas tests assert draw
  commands, reduced motion and animation cleanup. These do not prove WebGL pixels,
  GPU compatibility, real inference quality or physical browser accessibility.
- Small fixes motivated by those regressions: collapse synchronization feedback,
  model-tag truncation, zero-temperature fallback, empty depth, breadcrumb
  off-by-one, visual word callbacks and instance setup before ref mount.
- API response and patch schemas, endpoint allowlist, dependencies, licenses,
  workflows and coverage configuration remain unchanged.
- Coordinator-approved sequential checks passed: 66 suites / 293 tests, zero
  skips; coverage, typecheck, lint with no warnings, and production build.
  Global coverage (excluding separately gated core paths, as Jest does):
  85.98% statements, 74.53% branches, 87.58% lines, 86.71% functions, up from
  58.71/48.48/59.90/49.17. All existing core and global gates pass unchanged.
- Build retains baseline warnings for missing server tiktoken WASM (heuristic
  counting fallback) and stale Browserslist data. CLI entry remains at 0% in
  Jest's coverage report; its separate help check is not counted as that coverage.
- Initial route tests exposed zero temperature being defaulted in the shared
  adapter as well; nullish defaulting now preserves zero. Harness fixture/selector
  and test typing errors were corrected, then checks rerun without weakening the
  assertions. No real inference, browser rendering or GPU compatibility claim.
