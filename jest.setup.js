import '@testing-library/jest-dom'

// Mock Web APIs for Node.js test environment
global.fetch = jest.fn()

// Mock Response for Node.js
global.Response = class Response {
  constructor(body, init = {}) {
    this.body = body
    this.status = init.status || 200
    this.ok = this.status >= 200 && this.status < 300
    this.statusText = init.statusText || 'OK'
    this.headers = new Map(Object.entries(init.headers || {}))
  }
  
  async json() {
    return typeof this.body === 'string' ? JSON.parse(this.body) : this.body
  }
  
  async text() {
    return typeof this.body === 'string' ? this.body : JSON.stringify(this.body)
  }
}

// Mock Request for Next.js API routes
global.Request = class Request {
  constructor(input, init = {}) {
    this.url = input
    this.method = init.method || 'GET'
    this.headers = new Map(Object.entries(init.headers || {}))
    this.body = init.body || null
  }
  
  async json() {
    return typeof this.body === 'string' ? JSON.parse(this.body) : this.body
  }
}

// Mock AbortSignal for fetch timeout
global.AbortSignal = {
  timeout: jest.fn(() => ({ aborted: false }))
}

// Suppress React act() warnings in tests - we'll handle async state updates
const originalError = console.error
console.error = (...args) => {
  if (typeof args[0] === 'string' && args[0].includes('act(')) {
    return
  }
  originalError.call(console, ...args)
}