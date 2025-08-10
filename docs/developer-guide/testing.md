# Testing Strategy & Implementation

## Overview

Promptpad implements a **comprehensive testing strategy** with 108+ tests achieving 96%+ coverage across critical codepaths. This document details our testing philosophy, patterns, and implementation techniques that ensure code reliability and maintainability.

## Testing Philosophy

### Principles
1. **Behavior-Driven**: Test what users experience, not internal implementation
2. **Contract-First**: API contracts are sacred and thoroughly tested
3. **Real Integration**: Prefer real implementations over mocks when practical
4. **Coverage as Quality Gate**: High coverage requirements enforce discipline

### Testing Pyramid

```
                /\
               /  \
              / E2E \
             /______\
            /        \
           /Integration\
          /__________\
         /            \
        /   Unit Tests  \
       /________________\
```

**Our Distribution**:
- **Unit Tests (70%)**: Pure function logic, utilities, hooks
- **Integration Tests (25%)**: API contracts, component interactions  
- **E2E Tests (5%)**: Critical user flows (future enhancement)

## Testing Configuration

### Jest Setup (`jest.config.js`)

```javascript
const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  collectCoverageFrom: [
    'lib/**/*.{js,ts}',
    'app/**/*.{js,ts,tsx}', 
    'components/**/*.{js,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
  coverageThreshold: {
    global: { lines: 70, branches: 65, functions: 70, statements: 70 },
    './lib/diff.ts': { lines: 80, branches: 80, functions: 85, statements: 80 },
    './lib/history.ts': { lines: 80, branches: 80, functions: 85, statements: 80 },
    './lib/tokens/': { lines: 80, branches: 75, functions: 80, statements: 80 },
  },
}
```

**Key Features**:
- **Higher Thresholds**: Critical libraries require 80%+ coverage
- **Path Mapping**: `@/` alias works in tests
- **Granular Coverage**: File-specific requirements
- **JSDoc Environment**: Full React DOM simulation

### Test Environment Setup (`jest.setup.js`)

```javascript
import '@testing-library/jest-dom'

// Global test utilities
global.fetch = jest.fn()

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}
global.localStorage = localStorageMock
```

## Unit Testing Patterns

### 1. Pure Function Testing
**Pattern**: Test inputs/outputs without side effects
**Example**: Diff utilities (`__tests__/lib/diff.test.ts:1-60`)

```typescript
import { applyPatch, computePatch, invertPatch } from '@/lib/diff'

describe('diff utilities', () => {
  it('produces empty patch for identical strings', () => {
    expect(computePatch('abc', 'abc')).toEqual([])
  })

  it('computes single replace patch for change', () => {
    const patch = computePatch('hello world', 'hello brave world')
    expect(patch[0]).toEqual({ op: 'replace', from: [6, 6], to: 'brave ' })
    
    const applied = applyPatch('hello world', patch)
    expect(applied).toBe('hello brave world')
  })

  it('handles unicode + CRLF', () => {
    const a = 'Hello\r\n🌍 world'
    const b = 'Hello\r\n🌍 brave world'  
    const p = computePatch(a, b)
    expect(applyPatch(a, p)).toBe(b)
  })
})
```

**Testing Strategy**:
- **Edge Cases**: Empty strings, unicode, CRLF line endings
- **Round-Trip Testing**: Forward and inverse operations
- **Error Conditions**: Invalid inputs and boundary cases

### 2. Class-Based Testing
**Pattern**: Test class methods with state management
**Example**: History manager (`__tests__/lib/history.test.ts:1-50`)

```typescript  
import { HistoryManager } from '@/lib/history'

describe('HistoryManager', () => {
  it('manages undo/redo with linear history', () => {
    const history = new HistoryManager('initial')
    history.push('second')
    history.push('third')
    
    expect(history.undo()).toBe('second')
    expect(history.undo()).toBe('initial')
    expect(history.canUndo()).toBe(false)
    
    expect(history.redo()).toBe('second')
    expect(history.redo()).toBe('third')
    expect(history.canRedo()).toBe(false)
  })

  it('truncates future when pushing after undo', () => {
    const history = new HistoryManager('a')
    history.push('b')
    history.push('c')
    history.undo() // at 'b'
    history.push('d') // should truncate 'c'
    
    expect(history.current()).toBe('d')
    expect(history.canRedo()).toBe(false)
  })
})
```

## Integration Testing Patterns

### 1. API Contract Testing  
**Pattern**: Test API routes with real request/response cycles
**Example**: Refine endpoint (`__tests__/api/refine.test.ts:12-60`)

```typescript
// Mock NextResponse.json for testing
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any, init?: any) => ({
      ok: !init?.status || (init.status >= 200 && init.status < 300),
      status: init?.status || 200,
      async json() { return data },
    }),
  },
}))

describe('POST /api/refine (contract)', () => {
  const prevMock = process.env.OLLAMA_MOCK
  beforeAll(() => { process.env.OLLAMA_MOCK = '1' })
  afterAll(() => { process.env.OLLAMA_MOCK = prevMock })

  it('refine mode returns output and usage', async () => {
    const { POST } = await import('@/app/api/refine/route')
    const req = {
      async json() {
        return {
          mode: 'refine',
          input: 'summarize this', 
          model: 'gpt-oss:20b',
          temperature: 0.2,
        }
      },
    }
    
    const res = await POST(req)
    expect(res.ok).toBe(true)
    
    const data = await res.json()
    expect(typeof data.output).toBe('string')
    expect(typeof data.usage?.input_tokens).toBe('number') 
    expect(typeof data.usage?.output_tokens).toBe('number')
  })
})
```

**Contract Testing Features**:
- **Mock Environment**: `OLLAMA_MOCK=1` for deterministic testing
- **Schema Validation**: Ensure response structure matches contract
- **Error Scenarios**: Test validation failures and edge cases

### 2. Component Integration Testing
**Pattern**: Test components with their hooks and context
**Example**: Main page component (`__tests__/app/page.test.tsx:1-90`)

```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Home from '@/app/page'

// Mock API calls
global.fetch = jest.fn()

describe('Home Page Integration', () => {
  beforeEach(() => {
    fetch.mockClear()
  })

  it('enables refine button when input provided', async () => {
    render(<Home />)
    
    const input = screen.getByLabelText('Prompt input area')
    const refineButton = screen.getByLabelText('Refine prompt')
    
    expect(refineButton).toBeDisabled()
    
    await userEvent.type(input, 'test prompt')
    expect(refineButton).toBeEnabled()
  })

  it('shows loading state during refine operation', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        output: 'refined output',
        usage: { input_tokens: 10, output_tokens: 20 }
      })
    })

    render(<Home />)
    const input = screen.getByLabelText('Prompt input area')
    const refineButton = screen.getByLabelText('Refine prompt')
    
    await userEvent.type(input, 'test')
    await userEvent.click(refineButton)
    
    expect(screen.getByText('Refining prompt')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.getByDisplayValue('refined output')).toBeInTheDocument()
    })
  })
})
```

## Mock Strategies

### 1. Environment-Based Mocking
**Pattern**: Use environment variables to control mocking
**Implementation**: Ollama client with mock mode

```typescript
// In production code
if (process.env.OLLAMA_MOCK === '1') {
  return NextResponse.json({
    output: `Refined Prompt for: ${input}`,
    usage: { input_tokens: input.length, output_tokens: output.length },
    systemPrompt: prompt,
  })
}
```

**Benefits**:
- **Deterministic**: Same inputs always produce same outputs
- **CI/CD Friendly**: Tests work without external dependencies
- **Development**: Mock mode for offline development

### 2. Module Mocking
**Pattern**: Mock external dependencies at module level

```typescript
// Mock Next.js server response
jest.mock('next/server', () => ({
  NextResponse: {
    json: jest.fn((data, init) => ({ data, init }))
  }
}))

// Mock fetch for API calls  
global.fetch = jest.fn()
```

### 3. Partial Mocking
**Pattern**: Mock only specific methods of complex objects

```typescript
// Mock only localStorage methods that are used
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  }
})
```

## Test Data Management

### 1. Factory Pattern
**Pattern**: Create test data with realistic but deterministic values

```typescript
const createMockUsage = (overrides = {}) => ({
  input_tokens: 42,
  output_tokens: 187,
  ...overrides
})

const createMockResponse = (overrides = {}) => ({
  output: 'Mock refined output',
  usage: createMockUsage(),
  systemPrompt: 'Mock system prompt',
  ...overrides
})
```

### 2. Fixture Files
**Pattern**: Store complex test data in separate files

```typescript
// __tests__/fixtures/api-responses.ts
export const REFINE_RESPONSES = {
  success: {
    output: 'Detailed prompt with clear requirements...',
    usage: { input_tokens: 15, output_tokens: 156 }
  },
  error: {
    error: 'Model timeout',
    status: 503
  }
}
```

## Coverage Strategy

### 1. Granular Thresholds
**Pattern**: Higher requirements for critical code

```javascript
coverageThreshold: {
  // Global baseline
  global: { lines: 70, branches: 65, functions: 70, statements: 70 },
  
  // Critical utilities need higher coverage
  './lib/diff.ts': { lines: 80, branches: 80, functions: 85, statements: 80 },
  './lib/history.ts': { lines: 80, branches: 80, functions: 85, statements: 80 },
  
  // Token counting system
  './lib/tokens/': { lines: 80, branches: 75, functions: 80, statements: 80 },
}
```

### 2. Coverage Reporting
**Command**: `pnpm test -- --coverage`

```bash
# Example output
File                | % Stmts | % Branch | % Funcs | % Lines | Uncovered Line #s 
--------------------|---------|----------|---------|---------|-------------------
lib/diff.ts         |   95.83 |    88.89 |     100 |   95.65 | 84                
lib/history.ts      |     100 |      100 |     100 |     100 |                   
lib/ollama.ts       |   90.48 |    78.57 |     100 |   90.48 | 74,101,105        
lib/tokens/index.ts |   95.45 |    83.33 |     100 |   95.45 | 113               
```

## Advanced Testing Patterns

### 1. Custom Render Functions
**Pattern**: Wrap components with necessary providers

```typescript
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <ThemeProvider>
      {ui}
    </ThemeProvider>
  )
}

// Usage in tests
it('respects theme context', () => {
  renderWithProviders(<MyComponent />)
  // Test theme-dependent behavior
})
```

### 2. Test Utilities
**Pattern**: Extract common test logic

```typescript
const waitForLoadingToFinish = async () => {
  await waitFor(() => {
    expect(screen.queryByText('Refining prompt')).not.toBeInTheDocument()
  }, { timeout: 3000 })
}

const typeInPromptInput = async (text: string) => {
  const input = screen.getByLabelText('Prompt input area')
  await userEvent.clear(input)
  await userEvent.type(input, text)
}
```

### 3. Error Boundary Testing
**Pattern**: Test error handling and recovery

```typescript
it('handles API errors gracefully', async () => {
  fetch.mockRejectedValueOnce(new Error('Network error'))
  
  render(<Home />)
  await userEvent.type(screen.getByLabelText('Prompt input area'), 'test')
  await userEvent.click(screen.getByLabelText('Refine prompt'))
  
  await waitFor(() => {
    expect(screen.getByText(/error/i)).toBeInTheDocument()
  })
})
```

## Running Tests

### Development Workflow
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch  

# Run with coverage
pnpm test:coverage

# Run specific test file
pnpm test diff.test.ts

# Run tests matching pattern
pnpm test --testNamePattern="refine"
```

### CI/CD Integration
```bash
# Must pass for merge
pnpm typecheck && pnpm lint && pnpm test && pnpm build
```

## Test Maintenance

### 1. Test Hygiene
- **Descriptive Names**: Test names explain the behavior being tested
- **Single Assertion**: Each test focuses on one specific behavior
- **Independent Tests**: Tests don't depend on each other's state
- **Cleanup**: Proper cleanup prevents test pollution

### 2. Keeping Tests Green
- **Regular Updates**: Update tests when behavior changes
- **Flaky Test Resolution**: Address intermittent failures immediately
- **Performance**: Keep test suite fast for developer productivity

### 3. Documentation Value
**Tests as Documentation**: Tests serve as executable examples of how code should behave

```typescript
it('computes minimal diff between strings', () => {
  // This test documents the exact behavior of computePatch
  const result = computePatch('hello world', 'hello brave world')
  expect(result).toEqual([
    { op: 'replace', from: [6, 6], to: 'brave ' }
  ])
})
```

This comprehensive testing strategy ensures code reliability while maintaining development velocity and enabling confident refactoring.