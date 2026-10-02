# ADR 001: Use approved Ollama endpoints consistently

Date: 2026-10-02
Status: Proposed for review

## Context

The model selector remembers an endpoint, but generation previously sent only the model name to a client fixed at localhost. The documented `OLLAMA_BASE_URL` and `OLLAMA_TIMEOUT` overrides configured an unused secondary client. A model listed on one endpoint could therefore be requested from another.

## Decision

The primary server/CLI client honors the existing environment variables. Browser requests may select an additional endpoint using the optional `X-Ollama-Endpoint` header. The server accepts only its configured default URL or exact URLs in the operator's comma-separated `OLLAMA_ALLOWED_ENDPOINTS`. URLs containing credentials, query strings, fragments, or non-HTTP protocols are rejected. Fetch redirects are rejected. Unauthorized selections return HTTP 400 before mock or fallback generation.

The model catalog uses the same server routing as refinement and clustering. It lists installed models rather than inserting an absent default. All generation and normalization passes use the resolved client. A deleted selection remains invalid until the user deliberately chooses a replacement; it fails before generation rather than switching destinations when a catalog request finishes. Status checks use that same selected route.

The existing route names, JSON request/response properties and patch representation remain unchanged. This is an optional transport header, documented here because endpoint choice changes request routing. No merge or release is authorized by this proposed ADR.

## Consequences

- Adding a URL in the browser does not authorize the server to access it. An operator must separately allow it and restart the server.
- Endpoint reachability is measured from the Next.js server. Agent-workflow tools that call Ollama directly from the browser retain their separate CORS/network requirements.
- Exact URL matching and redirect refusal reduce arbitrary destination selection. They do not provide DNS pinning, authentication, network isolation, or protection from a malicious allowed server. Run this experimental app on a trusted local network.
- `OLLAMA_TIMEOUT` remains a generation warning threshold; generation is not canceled by that timer. Model listing uses an abort timeout.
- Mock tests verify routing and cleanup reuse. They do not verify a real LAN Ollama installation or model output quality.
