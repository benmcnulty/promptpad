export function ollamaRequestHeaders(endpointUrl?: string | null): Record<string, string> {
  if (endpointUrl === null) throw new Error('Selected Ollama endpoint no longer exists. Select an available endpoint.')
  return {
    'Content-Type': 'application/json',
    ...(endpointUrl === undefined ? {} : { 'X-Ollama-Endpoint': endpointUrl }),
  }
}
