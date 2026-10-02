## Draft: consistent, approved Ollama endpoint routing

- Branch: `fix/ollama-endpoint-routing`
- Agent: Codex
- Scope: focused routing/onboarding fixes and implementation-grounded README.
- Summary: server/CLI environment overrides now configure the primary adapter. Model listing and primary/cleanup generation use the selected approved destination, without adding JSON payload fields. Spec progress no longer simulates separate analysis jobs.
- Touched areas: Ollama adapter/selector, model provider, generation hooks and routes, CLI entry point, README/configuration, routing regressions, ADR 001, changelog.
- Test evidence: source inspection completed. Execution gates are pending resource availability; no passing suite/build claim is made in this entry.
- Risks: real LAN/CORS behavior and inference quality remain unverified. Exact URL allowlisting is not DNS pinning or production authentication. Generation remains a soft timeout. See proposed ADR 001.
- Follow-ups: replace this pending filename with the actual draft PR number after publication and record each gate's actual result. User authorization allows draft PRs only; queue labels, merges and releases are excluded.
