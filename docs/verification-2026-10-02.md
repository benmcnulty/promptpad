# Verification receipt: 2026-10-02

> **Superseded historical receipt:** The observations below describe an earlier
> endpoint candidate, including its coverage failure, and are preserved as history.
> Independently reviewed source `897eb28560f6edce31476026fa5fc9d32bc0a839` passed
> 66 suites / 294 tests with zero skips and all unchanged core/global gates:
> statements 85.96%, branches 74.56%, lines 87.57%, functions 86.69%.
> [Exact-source full CI 37007105881](https://github.com/benmcnulty/promptpad/actions/runs/37007105881)
> is green; see the [current devlog](devlog/PR-3.md) for the reviewed regression
> evidence. The prior coverage blocker is resolved. Mocked-network/GPU and
> runtime/security limits remain; this does not certify live inference or WebGL.

Baseline: `16c5efd3074ea4d3c1df13e239e927a88204d66b`. The checks below include the independent-review provider corrections. Environment: Windows 11, Node 24.21.0, task-local pnpm 9.15.9, frozen committed lockfile. No live Ollama or paid provider calls were made.

The focused fix routes model catalogs, primary generation and cleanup to the approved selected endpoint, honors the documented environment settings, and preserves the JSON/patch contracts. Tests also cover identical model names on different endpoints, an absent default model, stale endpoint/model pairs and removed selections.

| Check | Result |
| --- | --- |
| `pnpm install --frozen-lockfile` | Passed with the existing lock; no dependency upgrades |
| `pnpm typecheck` | Passed; the subsequent production build also checked generated route types |
| `pnpm lint` | Passed; production build also linted the final source |
| `pnpm run test --runInBand` | 57 suites passed; 218 tests passed, 2 skipped |
| `pnpm run build` | Passed after using Next.js's required `Request` parameter type for the model route |
| `node bin/promptpad.cjs --help` | Passed; the installed CLI runtime launched and displayed all commands without inference |
| Global coverage gate | Unmet in the unchanged baseline and candidate; thresholds are preserved |

The first production build caught an optional `Request` parameter incompatible with Next.js's generated route contract. The final route accepts the required parameter, existing unit fixtures now provide it, and the corrected build passed. Compilation alone was not treated as a complete build.

The unchanged baseline coverage run passed 189 tests (2 skipped) but failed global thresholds: statements 53.8%, branches 44.11%, lines 55.4%, functions 45.23%. The reviewed follow-up passed 218 tests (2 skipped) with statements 58.71%, branches 48.48%, lines 59.9%, functions 49.17%; global thresholds still fail. The required diff/history/token-library thresholds pass. Global coverage remains a known pre-existing gap rather than a gate waived for this PR.

The build warned about an old Browserslist dataset and a missing server tiktoken WASM file. It used the existing heuristic token-count fallback. No broad dependency update or WASM packaging repair is included.

These checks do not verify real-model quality, real LAN/DNS/CORS behavior, mobile/screen-reader journeys, optional 3D rendering or production authentication/isolation. No website was deployed. The proposed endpoint-routing decision is documented in [ADR 001](adr/001-server-endpoint-selection.md).

## Independent-review corrections verified

The independent review found provider interactions that stable endpoint mocks
did not exercise: health updates could restart catalog/initial health effects,
catalog completion could replace a deleted selection, and status checked the
server default rather than the selected destination.

The real-provider integration suite now verifies bounded mount/periodic polling,
catalog requests that are not aborted by health metadata updates, persisted health
results, newly added endpoint checks, removed-selection blocking through catalog
completion, deliberate replacement, unapproved selected-route status and ignored
late status responses. These five integration tests passed within the 57-suite
run. Typecheck, lint (zero warnings), production build and CLI help also passed.
The first follow-up typecheck caught test use of `Array.at` beyond the configured
library target; the tests now use a compatible array lookup without changing the
project compiler target. Lint also caught an omitted persistence dependency,
which was restored and verified before publication.

The lean read-only GitHub Actions workflow runs frozen pnpm install,
type/lint/unit/build/CLI checks and the existing coverage gate with mock inference.
It requires no provider secret, deployment or new access. Coverage is not waived;
the measured global gap remains visible and keeps the draft unready for merge.
