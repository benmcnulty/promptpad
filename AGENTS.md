# Repository Guidelines

## Project Structure & Module Organization
- app/: Next.js App Router pages and API routes (e.g., app/page.tsx, app/api/refine/route.ts).
- lib/: client/server utilities (ollama adapter, tokens, diff, history).
- styles/: Tailwind CSS setup and project styles.
- Public assets live in public/; colocate feature files near usage.

## Build, Test, and Development Commands
- pnpm install: install dependencies.
- pnpm dev: run the app locally at http://localhost:3000.
- pnpm build: create a production build.
- pnpm start: run the built app.
- ollama pull gpt-oss:20b: ensure the default local model is available.

## Coding Style & Naming Conventions
- Language: TypeScript (strict), React function components, Next.js App Router.
- Indentation: 2 spaces; keep lines focused and readable.
- Files: kebab-case for modules; Next routes use lowercase segment names (e.g., app/api/models/route.ts).
- Components: PascalCase; functions/variables: camelCase; constants: UPPER_SNAKE_CASE when global.
- Styling: Tailwind-first; extract small utilities when classes get long.

## Testing Guidelines
- Framework: add Vitest or Jest for unit tests; React Testing Library for components.
- Location: colocate tests next to sources or in __tests__/.
- Names: *.test.ts(x) and *.spec.ts(x).
- Coverage: prioritize lib/ (tokens, diff, history) and API route handlers.
- Run: pnpm test (add script when tests are introduced).

## Commit & Pull Request Guidelines
- Commits: concise, imperative subject; include scope when helpful (e.g., refine: handle reinforce diffs).
- Reference issues with #id; separate refactors from features.
- PRs: clear description, rationale, before/after notes; include UI screenshots or API examples.
- Keep PRs small and focused; link related README sections.

## Agent-Specific Instructions
- Default model: gpt-oss:20b via Ollama; prefer temperature ≈ 0.2 for deterministic refinement.
- Two passes: Refine (expand instruction) → Reinforce (diff-based tighten pass on edited draft).
- Prompts: be explicit about goals, constraints, tone, and variables; return minimal diffs for Reinforce.

## Security & Configuration
- Local-first: do not ship data to cloud services by default.
- Do not commit secrets; use env vars for local overrides.
- Validate model availability via GET /api/models before calling /api/refine.
