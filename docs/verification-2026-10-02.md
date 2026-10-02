# Verification receipt: 2026-10-02

Baseline: `16c5efd3074ea4d3c1df13e239e927a88204d66b`. The completed checks below describe prior candidate `c216650fba8505440cba685c154a90db8d14d8af`. Environment: Windows 11, Node 24.21.0, task-local pnpm 9.15.9, frozen committed lockfile. No live Ollama or paid provider calls were made.

The focused fix routes model catalogs, primary generation and cleanup to the approved selected endpoint, honors the documented environment settings, and preserves the JSON/patch contracts. Tests also cover identical model names on different endpoints, an absent default model, stale endpoint/model pairs and removed selections.

| Check | Result |
| --- | --- |
| `pnpm install --frozen-lockfile` | Passed with the existing lock; no dependency upgrades |
| `pnpm typecheck` | Passed; the subsequent production build also checked generated route types |
| `pnpm lint` | Passed; production build also linted the final source |
| `pnpm run test --runInBand` | 56 suites passed; 213 tests passed, 2 skipped |
| `pnpm run build` | Passed after using Next.js's required `Request` parameter type for the model route |
| `node bin/promptpad.cjs --help` | Passed; the installed CLI runtime launched and displayed all commands without inference |
| Global coverage gate | Unmet in the unchanged baseline and candidate; thresholds are preserved |

The first production build caught an optional `Request` parameter incompatible with Next.js's generated route contract. The final route accepts the required parameter, existing unit fixtures now provide it, and the corrected build passed. Compilation alone was not treated as a complete build.

The unchanged baseline coverage run passed 189 tests (2 skipped) but failed global thresholds: statements 53.8%, branches 44.11%, lines 55.4%, functions 45.23%. The final candidate passed 213 tests (2 skipped) with statements 56.14%, branches 47.01%, lines 57.58%, functions 45.64%; global thresholds still fail. The required diff/history/token-library thresholds pass. Global coverage remains a known pre-existing gap rather than a gate waived for this PR.

The build warned about an old Browserslist dataset and a missing server tiktoken WASM file. It used the existing heuristic token-count fallback. No broad dependency update or WASM packaging repair is included.

These checks do not verify real-model quality, real LAN/DNS/CORS behavior, mobile/screen-reader journeys, optional 3D rendering or production authentication/isolation. No website was deployed. The proposed endpoint-routing decision is documented in [ADR 001](adr/001-server-endpoint-selection.md).

## Prepared independent-review corrections

The independent review found provider interactions that stable endpoint mocks
did not exercise: health updates could restart catalog/initial health effects,
catalog completion could replace a deleted selection, and status checked the
server default rather than the selected destination.

Stable health callbacks and configuration-only catalog dependencies, deliberate
replacement selection, selected-route status and real-provider fake-timer tests
are now prepared. Five modified/new TSX files pass syntax parsing, but semantic
type checks, test execution and the production build for these corrections remain
pending Zora's shared heavy-test slot. These prepared changes are not covered by
the prior passing counts above.

A lean read-only GitHub Actions workflow is prepared to run frozen pnpm install,
type/lint/unit/build/CLI checks and the existing coverage gate with mock inference.
It requires no provider secret, deployment or new access. Coverage is not waived;
the documented global baseline gap will remain visible until it is addressed.
