import '@testing-library/jest-dom'

// Mock fetch for tests that depend on it. Individual tests may override.
global.fetch = jest.fn()

// Mock AbortSignal for fetch timeout used in Ollama client
global.AbortSignal = {
  timeout: jest.fn(() => ({ aborted: false })),
}

// Ensure Web Fetch API classes exist in test env (Node 20 provides these)
// Use native implementations if available; do not stub.
const g = globalThis
if (typeof Request !== 'undefined' && !g.Request) {
  g.Request = Request
}
if (typeof Response !== 'undefined' && !g.Response) {
  g.Response = Response
}

// Suppress React act() warnings in tests - we'll handle async state updates
const originalError = console.error
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('act(')) {
    return
  }
  originalError.call(console, ...args)
}
