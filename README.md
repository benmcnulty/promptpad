# Promptpad ✨

> **Production Ready** local-first prompt drafting tool that transforms terse instructions into copy-ready prompts via Ollama.

**Built with**: Next.js 15.4.6 + TypeScript + Tailwind CSS + Ollama  
**Status**: ✅ Fully functional with comprehensive testing and modern UX  
**Default Model**: `gpt-oss:20b` (120s timeout for large model support)

---

## 🚀 Quick Start

```bash
# Prerequisites: Ollama with model installed
ollama pull gpt-oss:20b

# Install and run
pnpm install
pnpm dev
# → http://localhost:3000
```

---

## ⚡ How It Works

1. **Enter** a brief instruction (left panel)
2. **Refine** → AI expands it into a detailed, actionable prompt
3. **Edit** the output freely with real-time token counting  
4. **Reinforce** → AI optimizes your edited draft for clarity and effectiveness
5. **Copy** with one-click clipboard integration

**Two-pass workflow**: Refine (expand) → Edit → Reinforce (optimize) → Copy

---

## ✨ Production Features

### Core Functionality
- ✅ **Refine**: Expands terse input into comprehensive prompts with specific constraints
- ✅ **Reinforce**: Significantly improves existing prompts for precision and clarity  
- ✅ **Copy to Clipboard**: One-click copying with visual feedback
- ✅ **Real-time Token Counting**: TikToken with graceful fallbacks

### UI/UX Excellence  
- ✅ **Fully Responsive**: Works perfectly on all screen sizes
- ✅ **Loading Animations**: Thematic gradient spinners during AI processing
- ✅ **Welcome Modal**: First-run experience with setup instructions
- ✅ **Debug Terminal**: Full request/response logging with collapsible panel
- ✅ **Green/Blue Gradient Design**: Custom design system with glass morphism

### Developer Experience
- ✅ **Comprehensive Testing**: 110+ tests with high coverage
- ✅ **TypeScript**: Full type safety throughout
- ✅ **Error Handling**: Graceful fallbacks and user feedback
- ✅ **Git Integration**: Dynamic commit display
- ✅ **Enhanced Logging**: Detailed API operation tracking

---

## 🏗️ Architecture

```
app/
  page.tsx                # ✅ Complete responsive UI with loading states
  globals.css             # ✅ Green/blue gradient design system
  api/
    models/route.ts       # ✅ Lists Ollama models with health checking
    refine/route.ts       # ✅ Refine/reinforce with 120s timeout + cleanup
    git-info/route.ts     # ✅ Dynamic git commit info
components/
  ProgressTracker.tsx     # ✅ Animated 5-step progress indicator
  StatusBar.tsx           # ✅ Git SHA, model status, debug toggle
  TokenCounter.tsx        # ✅ Real-time token counting with TikToken
lib/
  ollama.ts              # ✅ Ollama client with error handling & timeouts
  tokens/                # ✅ Pluggable token counting system
  history.ts             # ✅ Undo/redo + localStorage persistence
  diff.ts                # ✅ Text diff/patch utilities
hooks/
  useRefine.ts           # ✅ State management for operations
  useTokenCount.ts       # ✅ Real-time token counting
__tests__/               # ✅ 110+ tests with comprehensive coverage
```

---

## 🧪 Testing & Development

### Running Tests
```bash
pnpm test                # Run all tests
pnpm test:coverage       # Run with coverage report
pnpm test:watch          # Watch mode for development
```

### Development Commands
```bash
pnpm dev                 # Start development server
pnpm build               # Build for production  
pnpm start               # Start production server
pnpm lint                # Run ESLint
pnpm typecheck           # TypeScript checking
```

### Test Coverage
- **110+ Tests** covering all functionality
- **API Tests**: All endpoints with validation and error handling
- **Component Tests**: UI components with user interactions
- **Integration Tests**: Full user workflows
- **Feature Tests**: New enhancements (copy, loading, debug, etc.)

---

## 🔧 API Reference

### GET /api/models
Lists available Ollama models with health checking.
```json
{ "models": [{"name": "gpt-oss:20b", "size": 13780173839, ...}] }
```

### GET /api/git-info  
Returns current git commit information.
```json
{ "sha": "abc1234", "branch": "main", "timestamp": "2025-01-10T..." }
```

### POST /api/refine
Main refine/reinforce endpoint with enhanced response format.

**Request:**
```json
{
  "mode": "refine" | "reinforce",
  "input": "Brief instruction",     // for refine mode
  "draft": "Existing prompt",       // for reinforce mode  
  "model": "gpt-oss:20b",
  "temperature": 0.2
}
```

**Response:**
```json
{
  "output": "Detailed, actionable prompt...",
  "usage": { "input_tokens": 42, "output_tokens": 187 },
  "patch": [{"op": "replace", "from": [0, 58], "to": "improved text"}],
  "systemPrompt": "You are Promptpad...",
  "fallbackUsed": false
}
```

---

## ⚙️ Configuration

### Ollama Settings
- **Default Model**: `gpt-oss:20b`  
- **Timeout**: 120 seconds (for large model support)
- **Base URL**: `http://localhost:11434`
- **Temperature**: Clamped to ≤0.3 for consistent results

### Environment Variables
```bash
OLLAMA_BASE_URL=http://localhost:11434    # Custom Ollama endpoint
OLLAMA_TIMEOUT=120000                     # Timeout in milliseconds  
OLLAMA_MOCK=1                            # Use mock responses for testing
```

---

## 🎨 Design System

### Color Palette
- **Primary Gradient**: Emerald-500 → Blue-500  
- **Secondary Gradient**: Cyan-500 → Violet-500
- **Glass Morphism**: Semi-transparent backgrounds with backdrop blur
- **Focus States**: Emerald/blue gradient focus rings

### Responsive Breakpoints
- **Mobile First**: Base styles for mobile
- **Tablet**: `sm:` (640px+)  
- **Desktop**: `lg:` (1024px+)
- **Wide**: `xl:` (1280px+)

---

## 🚀 Recent Enhancements (2025)

### Major UI/UX Updates
- **🎨 Complete Visual Redesign**: Green/blue gradient system with glass morphism
- **📱 Responsive Layout Fix**: Now properly fills screen at all widths
- **🔄 Loading Animations**: Thematic gradient spinners with interaction blocking
- **📋 Copy to Clipboard**: One-click copying with visual feedback

### Technical Improvements  
- **⏱️ Ollama Timeout Fix**: Increased to 120s for large model support (gpt-oss:20b)
- **🧹 Response Cleanup**: Automatic removal of unwanted AI prefixes/meta-text
- **🔍 Enhanced Prompting**: Eliminated technical parameters in user-facing output
- **💪 Better Reinforce**: Now makes significant improvements vs. minimal changes

### Developer Experience
- **🖥️ Debug Terminal**: Full request/response logging with collapsible interface
- **👋 Welcome Modal**: First-run experience with multiple dismiss options
- **📊 Git Integration**: Dynamic commit SHA display
- **🧪 Test Improvements**: Updated for new UI enhancements, added feature coverage

---

## 📚 Documentation

- **CLAUDE.md**: Comprehensive guidance for AI development agents
- **docs/**: Detailed architecture, testing strategy, and development guides  
- **__tests__/**: Extensive test suite with real functionality testing
- **Type definitions**: Full TypeScript coverage for all APIs and components

---

## 🤝 Contributing

1. **Fork & Clone** the repository
2. **Install** dependencies: `pnpm install`
3. **Run tests** to ensure everything works: `pnpm test`
4. **Start development** server: `pnpm dev`
5. **Make changes** with comprehensive tests
6. **Run validation**: `pnpm typecheck && pnpm lint && pnpm test`
7. **Submit PR** with detailed description

### Code Standards
- **TypeScript**: All code must be properly typed
- **Testing**: New features require comprehensive test coverage
- **Accessibility**: Follow WCAG guidelines for UI components
- **Performance**: Optimize for fast loading and smooth interactions

---

## 📄 License

MIT License - see LICENSE file for details.

---

## 🙏 Acknowledgments

- Built with Next.js, Tailwind CSS, and the Ollama ecosystem
- Comprehensive testing with Jest and Testing Library
- Design inspired by modern gradient and glass morphism trends
- Token counting powered by TikToken with graceful fallbacks

---

**Ready to transform your rough ideas into polished prompts?** 🚀

```bash
ollama pull gpt-oss:20b && pnpm install && pnpm dev
```