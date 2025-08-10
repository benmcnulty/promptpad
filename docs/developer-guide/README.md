# Developer Guide - Table of Contents

Welcome to the Promptpad Developer Guide. This comprehensive documentation covers all software engineering techniques and patterns implemented in our local-first prompt drafting application.

## 📋 Quick Navigation

### 🧠 Core LLM Intelligence
- **[LLM Processes](./llm-processes.md)** - *Detailed technical breakdown of Refine and Reinforce workflows, system prompts, response processing, and optimization strategies*

### 🏗️ Architecture & Design Patterns
- **[Component Architecture](./architecture.md)** - *React component patterns, custom hooks, provider patterns, and state management strategies*
- **[API Design](./api-design.md)** - *Next.js API routes, contract design, validation patterns, and error handling*
- **[Data Flow](./data-flow.md)** - *State management, diff/patch system, history management, and local storage patterns*

### 🛠️ Development Practices  
- **[Testing Strategy](./testing.md)** - *Unit testing, integration testing, mock strategies, and coverage requirements*
- **[Error Handling](./error-handling.md)** - *Custom error classes, graceful degradation, fallback strategies, and resilience patterns*
- **[Performance](./performance.md)** - *Caching strategies, optimization techniques, background processing, and monitoring*

### 🎨 UI/UX Engineering
- **[Design System](./design-system.md)** - *Theme management, CSS architecture, responsive design, and animation systems*
- **[User Experience](./user-experience.md)** - *Loading states, progressive enhancement, accessibility, and interaction patterns*

### 🔧 Development Environment
- **[Build System](./build-system.md)** - *Next.js configuration, TypeScript setup, bundling, and optimization*
- **[Development Tools](./development-tools.md)** - *ESLint, TypeScript, debugging tools, and developer experience*

---

## 📚 Document Descriptions

### 🧠 LLM Processes
**Most Important Document** - Comprehensive technical analysis of our core value proposition: the two-pass LLM workflow that transforms terse inputs into professional prompts. Covers system prompt engineering, response processing, Ollama integration, error handling, and team collaboration guidelines for optimizing AI intelligence.

### 🏗️ Component Architecture  
Deep dive into React patterns used throughout the application: functional components with hooks, custom hook patterns (useRefine, useTokenCount), context providers (ThemeProvider), state management approaches, and component composition strategies.

### 🔗 API Design
Detailed analysis of our Next.js API architecture: RESTful design principles, route handlers, request/response contracts, schema validation, error handling patterns, and development vs production configurations.

### 📊 Data Flow
Technical examination of data management: immutable state patterns, diff/patch algorithms for text changes, linear history management for undo/redo, localStorage persistence, and state synchronization between UI and storage layers.

### 🧪 Testing Strategy
Comprehensive overview of quality assurance: Jest configuration, unit testing patterns, React Testing Library integration, API contract testing, mock strategies, coverage requirements, and TDD approaches used throughout the codebase.

### ⚠️ Error Handling
Analysis of resilience patterns: custom error classes (OllamaError), graceful degradation strategies, development fallbacks, timeout handling, input validation, and user feedback mechanisms.

### ⚡ Performance
Performance optimization techniques: token counting cache with LRU eviction, background processing patterns, React optimization (useMemo, useCallback), lazy loading strategies, and monitoring approaches.

### 🎨 Design System
UI engineering deep dive: CSS custom properties for theming, responsive design implementation, animation system, accessibility patterns, and maintainable styling approaches using Tailwind CSS.

### 👤 User Experience
UX engineering patterns: progressive loading states, animation timing, accessibility implementation (ARIA labels, keyboard navigation), responsive layouts, and interaction feedback systems.

### 🏗️ Build System
Development infrastructure: Next.js 15 configuration, TypeScript strict mode setup, module bundling, tree shaking, CSS processing (PostCSS, Tailwind), and production optimization strategies.

### 🛠️ Development Tools
Developer experience optimization: ESLint configuration, TypeScript integration, path mapping, debugging tools, hot reloading, and environment management patterns.

---

## 🎯 Getting Started

### For New Team Members
1. **Start with [LLM Processes](./llm-processes.md)** - Understand our core value proposition
2. **Read [Component Architecture](./architecture.md)** - Learn our React patterns  
3. **Review [Testing Strategy](./testing.md)** - Understand our quality approach
4. **Explore [API Design](./api-design.md)** - Learn our backend patterns

### For Frontend Developers
- [Component Architecture](./architecture.md) → [Design System](./design-system.md) → [User Experience](./user-experience.md)

### For Backend Developers  
- [API Design](./api-design.md) → [LLM Processes](./llm-processes.md) → [Error Handling](./error-handling.md)

### For Full-Stack Developers
- [LLM Processes](./llm-processes.md) → [Component Architecture](./architecture.md) → [Data Flow](./data-flow.md)

### For DevOps/Infrastructure
- [Build System](./build-system.md) → [Development Tools](./development-tools.md) → [Performance](./performance.md)

---

## 🔍 Key Techniques Index

### Architecture Patterns
- **Component-Based Architecture** - [Component Architecture](./architecture.md)
- **Custom Hook Pattern** - [Component Architecture](./architecture.md)  
- **Provider Pattern** - [Component Architecture](./architecture.md)
- **API Route Pattern** - [API Design](./api-design.md)

### State Management
- **Immutable Data Patterns** - [Data Flow](./data-flow.md)
- **Linear History Management** - [Data Flow](./data-flow.md)
- **Custom Hooks State** - [Component Architecture](./architecture.md)
- **Local Storage Persistence** - [Data Flow](./data-flow.md)

### Error Handling
- **Custom Error Classes** - [Error Handling](./error-handling.md)
- **Graceful Degradation** - [Error Handling](./error-handling.md)
- **Development Fallbacks** - [LLM Processes](./llm-processes.md)
- **Circuit Breaker Pattern** - [Error Handling](./error-handling.md)

### Performance  
- **Caching with LRU** - [Performance](./performance.md)
- **React Optimization** - [Performance](./performance.md)
- **Background Processing** - [Performance](./performance.md)
- **Lazy Loading** - [Performance](./performance.md)

### UI/UX Engineering
- **Responsive Design** - [Design System](./design-system.md)
- **Progressive Enhancement** - [User Experience](./user-experience.md)
- **Animation Systems** - [Design System](./design-system.md)
- **Accessibility Patterns** - [User Experience](./user-experience.md)

### Testing
- **Unit Testing with Jest** - [Testing Strategy](./testing.md)
- **Component Testing** - [Testing Strategy](./testing.md)
- **API Contract Testing** - [Testing Strategy](./testing.md)
- **Mock Strategies** - [Testing Strategy](./testing.md)

### Development Experience
- **TypeScript Integration** - [Development Tools](./development-tools.md)
- **Path Mapping** - [Development Tools](./development-tools.md)
- **ESLint Integration** - [Development Tools](./development-tools.md)
- **Hot Reloading** - [Build System](./build-system.md)

---

## 📖 Documentation Standards

### Writing Style
- **Technical Accuracy** - All code examples are verified and functional
- **Practical Focus** - Emphasis on implementation details and real-world usage
- **Team Collaboration** - Guidelines for working together effectively
- **Future-Oriented** - Consideration of optimization opportunities

### Code Examples
- **File Location References** - Precise line number citations (e.g., `app/page.tsx:71-122`)
- **Complete Context** - Sufficient surrounding code for understanding
- **Copy-Paste Ready** - All examples are functional and tested

### Maintenance
- **Living Documentation** - Updated with code changes
- **Version Tracking** - Aligned with project evolution
- **Team Input** - Incorporates collective knowledge and experience

---

## 🚀 Contributing to Documentation

### Adding New Sections
1. Create markdown file in `docs/developer-guide/`
2. Add entry to this README with description
3. Cross-reference from related documents
4. Update technique index

### Updating Existing Content
1. Verify code examples remain accurate
2. Update line number references
3. Add new patterns discovered during development
4. Maintain consistency with overall documentation style

This developer guide represents the collective knowledge of our engineering practices and serves as both learning resource and reference manual for building and maintaining Promptpad.