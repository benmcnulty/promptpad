# Promptpad

An experimental local-first prompt drafting app built with Next.js, React and TypeScript. Refine expands an instruction, Reinforce tightens an edited draft, and Spec generates a project outline through Ollama. Review generated text before using it.

This repository contains a working implementation, automated tests and development documentation. It is pre-1.0 software; production readiness, broad browser accessibility compliance and model-output quality have not been certified. There is no verified hosted demo linked here. Run it locally using the instructions below.

## What is implemented

- An editable drafting board with token-count estimates, copy actions, theme preferences and local history utilities.
- A shared refinement API with heuristic normalization and an optional low-temperature LLM cleanup pass when output contains meta framing. Token usage includes both passes.
- Endpoint and model selection, with additional server destinations explicitly approved by the operator.
- A dimensional visualizer demo: generated word clusters and deterministic token layouts, a canvas renderer and an optional React Three Fiber renderer. Token positions are hashes/layout rules, not trained semantic embeddings.
- A separate CLI with Refine, Reinforce and Spec commands. Its cleanup implementation is simpler than the web API; interactive mode is a placeholder.

## Install and run

Use Node.js 22 or 24 and pnpm 9 with the committed lockfile. Install [Ollama](https://ollama.com/) separately. Choose a model that fits your machine's available memory and disk space; this app's default is `gpt-oss:20b`. No model weights are bundled.

```sh
git clone https://github.com/benmcnulty/promptpad.git
cd promptpad
pnpm install --frozen-lockfile
ollama pull gpt-oss:20b
# Start Ollama if it is not already running:
ollama serve
```

In another terminal, optionally copy `.env.example` to `.env.local`, then run:

```sh
pnpm dev
```

Open <http://localhost:3000>, which redirects to the prompt enhancer. Confirm your chosen model appears in the catalog. An absent default model is not advertised as installed.

For deterministic development without Ollama, set `OLLAMA_MOCK=1` in `.env.local`. Mock responses demonstrate the UI/API flow; they are not inference results or evidence of model quality. Restart Next.js after changing environment settings.

## Configuration and network boundaries

| Variable | Default | Meaning |
| --- | --- | --- |
| `OLLAMA_BASE_URL` | `http://localhost:11434` | Server/CLI default endpoint; localhost refers to the machine running that process. |
| `OLLAMA_TIMEOUT` | `120000` | Milliseconds. Model listing aborts after this interval; generation warns after it and continues waiting. Invalid/nonpositive values use the default. |
| `OLLAMA_ALLOWED_ENDPOINTS` | empty | Comma-separated additional exact HTTP(S) URLs allowed for browser-selected server requests. |
| `OLLAMA_MOCK` | unset | `1` returns deterministic development responses. |
| `NEXT_PUBLIC_ENABLE_R3F` | unset | `1` enables the experimental 3D renderer at build time. |

The default model catalog and generation use the server's configured endpoint. Additional endpoints must be added in the UI **and** approved in `OLLAMA_ALLOWED_ENDPOINTS`; entering a URL in the browser alone does not grant server access. An unapproved selection returns HTTP 400 before generation. URLs with credentials, query strings or fragments are rejected, and Ollama fetches refuse redirects. See [ADR 001](docs/adr/001-server-endpoint-selection.md).

Endpoint-management health checks and agent-workflow tools also make direct browser requests. Those paths need browser reachability and appropriate Ollama CORS settings. A browser health result is not proof that the Next.js server can reach the same endpoint.

Run the app on a trusted local machine/network. It has no production authentication, rate limiting or isolation boundary. Allowlisted URLs still depend on DNS and the operator's trust in the destination. Prompts go to the configured endpoint; remote endpoints may have different retention policies. Browser preferences, history and cluster networks use local storage. Debug paths may display/log prompt content. Avoid entering secrets or sensitive data.

## Architecture and source map

| Area | Entry points |
| --- | --- |
| Drafting UI | [`app/prompt-enhancer`](app/prompt-enhancer), [`hooks/useRefine.ts`](hooks/useRefine.ts) |
| Model selection | [`components/ModelProvider.tsx`](components/ModelProvider.tsx), [`lib/ollama-server.ts`](lib/ollama-server.ts) |
| Refinement/normalization | [`app/api/refine/route.ts`](app/api/refine/route.ts) |
| Ollama adapter | [`lib/ollama.ts`](lib/ollama.ts) |
| Visualizer demo | [`app/dimensional-visualizer`](app/dimensional-visualizer), [`lib/vectorization`](lib/vectorization) |
| CLI | [`bin/promptpad.cjs`](bin/promptpad.cjs), [`lib/cli`](lib/cli) |
| Tests and contracts | [`__tests__`](__tests__), [`docs/agents/schemas`](docs/agents/schemas) |

`GET /api/models` returns an array. `POST /api/refine` keeps its existing `{ mode, input?, draft?, model, temperature }` payload and `{ output, usage, patch?, systemPrompt?, fallbackUsed? }` response. Reinforce preserves the full-replacement patch representation. Selected endpoints travel in the optional `X-Ollama-Endpoint` header rather than a new JSON field. The server caps primary temperature at 0.3 and optional cleanup at 0.15.

## Checks and CLI

```sh
pnpm typecheck
pnpm lint
pnpm run test --runInBand
pnpm run test:coverage --runInBand
pnpm build
pnpm start
node bin/promptpad.cjs --help
```

Tests use mocks and fixture outputs. They do not establish real-model quality, real LAN compatibility, full accessibility compliance or production security. Coverage thresholds live in `jest.config.js`; do not infer passing coverage from a passing unit run. Dated verification evidence belongs in the PR/devlog, not a static passing-test badge.

The CLI can also be run directly with `pnpm exec tsx lib/cli/index.ts --help`. To set its endpoint/timeout, use shell environment variables; `.env.local` is loaded by Next.js, not automatically by this CLI. [CLI reference](docs/CLI.md) describes its commands. The `--timeout` command-line option is currently declared but is not wired to the adapter; use `OLLAMA_TIMEOUT` for the adapter threshold.

## Known limitations

- Generated prompt/spec content needs human review. Cleanup is heuristic and can remove or retain unexpected text.
- Generation has a soft timeout, so an unreachable/hung request may remain pending longer than the configured interval.
- Development fallback text and cluster placeholder words are not successful inference. Inspect `fallbackUsed` where provided.
- Spec progress tracks the request/response lifecycle; it does not report separate architecture or security analysis jobs.
- The visualizer and browser endpoint tooling are experiments. Mobile, keyboard, screen-reader and optional 3D behavior need further verification.
- CLI and web cleanup pipelines are not identical; global CLI options and inference behavior need further integration coverage.
- The 2026-10-02 Windows build warned that the server-side tiktoken WASM file was missing and used heuristic counting. Treat displayed token counts as estimates.
- The configured global coverage gate remains unmet in the baseline and this candidate. Core diff/history/token thresholds pass; see the dated verification receipt for the exact runs and remaining work.

## Contributing and license

Read [AGENTS.md](AGENTS.md), [AIDEVOPS.md](AIDEVOPS.md) and the schemas before changing normalization or API behavior. Keep patches focused, add regressions for behavioral changes and record actual results in a devlog. Draft PRs can be reviewed before every gate is green; do not merge or label them ready for the queue until the repository's required gates are satisfied.

Licensed under [MIT](LICENSE). Next.js, Ollama, Tailwind CSS, tiktoken and the testing/visualization libraries retain their own licenses and attribution.
