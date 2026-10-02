import { ollama, OllamaClient, OllamaError, configuredOllamaTimeout } from './ollama'

export const OLLAMA_ENDPOINT_HEADER = 'X-Ollama-Endpoint'

function normalizeEndpoint(value: string): string {
  const url = new URL(value)
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.search || url.hash) {
    throw new Error('Invalid Ollama endpoint URL')
  }
  return url.toString().replace(/\/$/, '')
}

/** Resolve a browser selection only against operator-configured server destinations. */
export function getServerOllama(request?: Pick<Request, 'headers'>): OllamaClient {
  const selection = request?.headers?.get(OLLAMA_ENDPOINT_HEADER)
  if (selection === null || selection === undefined) return ollama
  try {
    const selected = normalizeEndpoint(selection)
    const defaultEndpoint = normalizeEndpoint(process.env.OLLAMA_BASE_URL || 'http://localhost:11434')
    const allowed = [defaultEndpoint, ...(process.env.OLLAMA_ALLOWED_ENDPOINTS || '')
      .split(',').filter(value => value.trim()).map(value => normalizeEndpoint(value.trim()))]
    if (!allowed.includes(selected)) throw new Error('Endpoint is not allowed')
    if (selected === defaultEndpoint) return ollama
    return new OllamaClient(selected, configuredOllamaTimeout())
  } catch {
    throw new OllamaError('Selected Ollama endpoint is not approved by this server', 400, 'ENDPOINT_NOT_ALLOWED')
  }
}
