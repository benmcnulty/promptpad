# Component Architecture & Design Patterns

## Overview

Promptpad implements a **modern React architecture** using functional components, custom hooks, and strategic design patterns. This document details our architectural decisions and implementation patterns that enable maintainable, testable, and performant code.

## Core Architecture Principles

### 1. Component-Based Architecture
**Pattern**: Functional components with single responsibilities
**Location**: `app/`, `components/`

```typescript
// Focused component with clear responsibility
export default function TokenCounter({ text, className }: TokenCounterProps) {
  const { count } = useTokenCount(text)
  return (
    <div className={`token-counter ${className}`}>
      <span className="token-count">{count.toLocaleString()}</span>
      <span className="token-label">tokens</span>
    </div>
  )
}
```

**Benefits**:
- Clear separation of concerns
- Easier testing and debugging
- Reusable and composable
- Predictable data flow

### 2. Custom Hook Pattern
**Pattern**: Business logic extracted into reusable hooks
**Key Examples**: `useRefine.ts`, `useTokenCount.ts`

#### useRefine Hook (`hooks/useRefine.ts:62-146`)

```typescript
export function useRefine(model: string = 'gpt-oss:20b', temperature: number = 0.2) {
  const [state, setState] = useState<RefineState>({
    loading: false,
    error: null,
    usage: null,
    steps: baseSteps,
  })

  const run = useCallback(async (mode: RefineMode, text: string): Promise<RunResult | null> => {
    // Complex async logic with step-by-step progress tracking
    // Error handling and state management
    // API communication
  }, [model, temperature])

  return { state, statusSummary, run, reset }
}
```

**Key Features**:
- **State Encapsulation**: Internal state management with clean interface
- **Progress Tracking**: Step-by-step operation visibility  
- **Error Handling**: Comprehensive error states and recovery
- **Memoization**: useCallback for performance optimization

#### useTokenCount Hook (`hooks/useTokenCount.ts:1-47`)

```typescript
export function useTokenCount(text: string): TokenCountResult {
  const [result, setResult] = useState<TokenCountResult>({
    count: 0,
    counter: 'tiktoken',
    version: '1.0.0',
    timestamp: Date.now()
  })

  useEffect(() => {
    const service = getTokenCountingService()
    const newResult = service.count(text)
    setResult(newResult)
  }, [text])

  return result
}
```

**Benefits of Custom Hooks**:
- **Logic Reuse**: Share complex logic across components
- **Testing Isolation**: Unit test business logic separately
- **State Management**: Encapsulate related state and operations
- **Performance**: Optimized re-renders through dependency arrays

### 3. Provider Pattern for Global State
**Pattern**: Context-based global state management
**Implementation**: `components/ThemeProvider.tsx:23-66`

```typescript
const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light')
  const [accent, setAccentState] = useState<Accent>('emerald')

  // localStorage sync with useLayoutEffect
  useLayoutEffect(() => {
    const root = document.documentElement
    root.dataset.theme = theme
    try { localStorage.setItem(THEME_KEY, theme) } catch {}
  }, [theme])

  const value = useMemo<ThemeContextValue>(() => ({ 
    theme, accent, toggleTheme, setAccent, accents: ACCENTS 
  }), [theme, accent, toggleTheme, setAccent])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}
```

**Key Patterns**:
- **Context + Hook**: Custom `useTheme()` hook for consumption
- **Memoized Values**: Prevent unnecessary re-renders
- **Side Effect Management**: useLayoutEffect for DOM synchronization
- **Error Boundaries**: Graceful localStorage failures

### 4. Progressive Enhancement Pattern
**Pattern**: Core functionality works without JavaScript
**Implementation**: `app/page.tsx:125-476`

```typescript
// Base HTML structure provides functionality
<textarea
  className="w-full h-full resize-none bg-white/80 backdrop-blur-sm border-2 border-white/60 rounded-lg p-4"
  value={inputText}
  onChange={(e) => setInputText(e.target.value)}
  aria-label="Prompt input area"
/>

// Enhanced with JavaScript interactivity
<button
  type="button"
  className="gradient-primary text-white px-6 py-3 rounded-lg font-semibold shadow-elegant hover:shadow-lg transform hover:scale-105"
  disabled={!canRefine}
  onClick={onRefine}
>
  Refine
</button>
```

## State Management Strategies

### 1. Local Component State
**When to Use**: Component-specific UI state
**Pattern**: useState for simple values

```typescript
const [showWelcome, setShowWelcome] = useState(true)
const [copySuccess, setCopySuccess] = useState(false)
```

### 2. Custom Hook State
**When to Use**: Complex business logic with multiple related state values
**Pattern**: Encapsulated state with computed values

```typescript
const { state, statusSummary, run, reset } = useRefine("gpt-oss:20b", 0.2)
```

### 3. Context State  
**When to Use**: Truly global application state
**Pattern**: Provider + custom hook

```typescript
const { theme, accent, toggleTheme, setAccent } = useTheme()
```

### 4. URL State
**When to Use**: Deep linkable application state
**Pattern**: Next.js router integration (minimal usage in current app)

## Component Composition Patterns

### 1. Render Props Pattern
**Usage**: Flexible component composition
**Example**: Progress steps with different display modes

```typescript
<ProgressTracker 
  steps={state.steps} 
  compact 
  className="lg:hidden" 
/>
<ProgressTracker 
  steps={state.steps} 
  className="hidden lg:block" 
/>
```

### 2. Compound Components Pattern
**Usage**: Related components working together
**Example**: Status bar with integrated debug toggle

```typescript
<StatusBar onDebugToggle={setShowDebug} debugOpen={showDebug} />
```

### 3. Higher-Order Component Pattern
**Usage**: Cross-cutting concerns (minimal usage - prefer hooks)

## Performance Optimization Patterns

### 1. Memoization Strategy
**Pattern**: useMemo and useCallback for expensive operations

```typescript
// Expensive computation memoization
const canRefine = useMemo(
  () => inputText.trim().length > 0 && !state.loading,
  [inputText, state.loading]
)

// Function memoization for child components
const addDebugLog = useCallback(
  (type: "request" | "response" | "system", content: any) => {
    const timestamp = new Date().toISOString()
    setDebugLogs((prev) => [...prev.slice(-49), { timestamp, type, content }])
  },
  []
)
```

### 2. Conditional Rendering
**Pattern**: Avoid rendering expensive components when not needed

```typescript
{state.loading && (
  <div className="loading-enhanced-container">
    <LoadingAnimation />
  </div>
)}
```

### 3. Component Splitting
**Pattern**: Split large components for better bundle splitting

```typescript
// Separate component files for logical groupings
import StatusBar from "@/components/StatusBar"
import TokenCounter from "@/components/TokenCounter" 
import ProgressTracker from "@/components/ProgressTracker"
```

## Error Boundary Implementation

### 1. Component-Level Error Handling
**Pattern**: Try-catch in effects and event handlers

```typescript
const copyToClipboard = useCallback(async () => {
  try {
    await navigator.clipboard.writeText(outputText)
    setCopySuccess(true)
  } catch (err) {
    console.error('Failed to copy text: ', err)
    // Could show toast notification here
  }
}, [outputText])
```

### 2. Graceful Degradation
**Pattern**: Fallback UI states for failures

```typescript
// localStorage access with graceful failure
useLayoutEffect(() => {
  try {
    const dismissed = localStorage.getItem("promptpad-welcome-dismissed")
    if (dismissed === "true") setShowWelcome(false)
  } catch {
    // Silently continue with default state
  }
}, [])
```

## Testing Architecture Patterns

### 1. Component Testing Strategy
**Pattern**: React Testing Library with user-centric tests

```typescript
// Test behavior, not implementation
it('shows copy success feedback', async () => {
  render(<Home />)
  const copyButton = screen.getByLabelText('Copy refined prompt to clipboard')
  await userEvent.click(copyButton)
  expect(screen.getByText('Copied!')).toBeInTheDocument()
})
```

### 2. Hook Testing Pattern
**Pattern**: Test hooks in isolation

```typescript
// Custom hook testing with renderHook
it('tracks refine progress through steps', async () => {
  const { result } = renderHook(() => useRefine())
  await act(async () => {
    await result.current.run('refine', 'test input')
  })
  expect(result.current.state.steps.every(step => step.status === 'done')).toBe(true)
})
```

## File Organization Strategy

```
app/
├── api/                  # API route handlers
│   ├── models/          # Ollama model listing
│   ├── refine/          # Core LLM endpoints
│   └── git-info/        # Development utilities
├── globals.css          # Global styles and CSS custom properties
├── layout.tsx           # Root layout with providers
└── page.tsx             # Main application component

components/
├── ProgressTracker.tsx  # Multi-step process visualization
├── StatusBar.tsx        # Application status and debug controls
├── ThemeProvider.tsx    # Global theme state management
└── TokenCounter.tsx     # Real-time token counting display

hooks/
├── useRefine.ts         # LLM operation state management
└── useTokenCount.ts     # Token counting with caching

lib/
├── diff.ts              # Text diffing and patching utilities
├── history.ts           # Undo/redo state management
├── ollama.ts            # Ollama API client
└── tokens/              # Token counting abstractions
    ├── index.ts         # Interface definitions
    └── tiktoken.ts      # TikToken implementation
```

## Architecture Decision Records (Implicit)

### Why Custom Hooks Over Redux?
- **Simpler State**: Application state is primarily UI-driven
- **Co-location**: Related state and logic stay together  
- **Performance**: No unnecessary re-renders from global state
- **Testing**: Easier to test isolated hook logic

### Why Context Over Props Drilling?
- **Theme System**: Truly global state accessed throughout component tree
- **Performance**: Memoized context value prevents cascade re-renders
- **Maintenance**: Central theme logic vs scattered prop passing

### Why Functional Components Over Classes?
- **Hooks Ecosystem**: Better state logic reuse
- **Bundle Size**: Smaller compiled output
- **Developer Experience**: Simpler mental model
- **Future-Proof**: React team's recommended approach

## Future Architecture Considerations

### Potential Enhancements
1. **State Management**: Consider Zustand for more complex state needs
2. **Component Library**: Extract design system components
3. **Micro-Frontends**: Split into domain-specific applications
4. **Server Components**: Leverage Next.js server components for SEO

### Scalability Patterns
- **Feature Flags**: Toggle functionality for gradual rollouts
- **Module Federation**: Share components across applications
- **Monorepo Structure**: Organize multiple related applications
- **Design Tokens**: Centralize design decisions

This architecture provides a solid foundation for maintainable, performant React applications while maintaining flexibility for future enhancements.