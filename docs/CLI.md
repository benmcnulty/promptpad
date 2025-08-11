# Promptpad CLI

Command line interface for Promptpad's local-first prompt refinement and optimization.

## 🚀 Quick Start

### Prerequisites

1. **Ollama**: Install and start Ollama with a language model
2. **Node.js 18+**: Required for running the CLI
3. **Promptpad**: Clone and set up the Promptpad repository

```bash
# 1. Install and start Ollama
ollama pull gpt-oss:20b
ollama serve

# 2. Set up Promptpad CLI
git clone <promptpad-repo>
cd promptpad
pnpm install

# 3. Link CLI globally (optional)
pnpm cli:install
```

## 📖 Usage

### Basic Commands

```bash
# Show help
promptpad --help

# Refine a terse instruction into a detailed prompt
promptpad refine "write a blog post about AI"

# Optimize an existing prompt for better clarity
promptpad reinforce "Write a comprehensive blog post about artificial intelligence..."

# Use verbose output for debugging
promptpad refine "create a landing page" --verbose

# Save output to a file
promptpad refine "design a logo" --output logo-brief.md

# Copy result to clipboard (macOS/Linux/Windows)
promptpad refine "plan a marketing campaign" --copy
```

### Global Options

- `-v, --verbose` - Enable detailed operation logging
- `--model <model>` - Specify Ollama model (default: `gpt-oss:20b`)
- `--temperature <temp>` - Set generation temperature 0.0-0.3 (default: `0.2`)
- `--timeout <ms>` - Request timeout in milliseconds (default: `120000`)
- `--help` - Show help information
- `--version` - Show version information

### Refine Command

**Purpose**: Expand terse instructions into detailed, actionable prompts

```bash
promptpad refine <input> [options]

# Examples
promptpad refine "write documentation"
promptpad refine "create API endpoints" --model llama3.1:8b
promptpad refine "design user interface" --temperature 0.1 --verbose
```

**Options**:
- `-o, --output <file>` - Save refined prompt to file
- `--copy` - Copy result to system clipboard

### Reinforce Command

**Purpose**: Optimize and tighten existing prompts for better precision

```bash
promptpad reinforce <draft> [options]

# Examples  
promptpad reinforce "Write a blog post about AI. Make it informative and engaging."
promptpad reinforce "$(cat my-draft-prompt.md)" --output improved-prompt.md
```

**Options**:
- `-o, --output <file>` - Save reinforced prompt to file  
- `--copy` - Copy result to system clipboard

### Spec Command

**Purpose**: Generate comprehensive coding project specifications with intelligent technology guidance

```bash
promptpad spec <input> [options]

# Examples
promptpad spec "build a task management app"
promptpad spec "e-commerce platform for small businesses" --model llama3.1:8b
promptpad spec "real-time chat application" --temperature 0.1 --verbose --copy
```

**Options**:
- `-o, --output <file>` - Save project specification to file
- `--copy` - Copy result to system clipboard

## 🔧 Installation Options

### Local Development

```bash
# Run directly from repository
node bin/promptpad.cjs <command>

# Or use pnpm script
pnpm cli:test  # Shows help
```

### Global Installation

```bash
# Link for global access
pnpm cli:install

# Now available globally
promptpad refine "build a React app"

# Uninstall global link
pnpm cli:uninstall
```

### Package Distribution

For distributing to other users:

```bash
# Package for distribution
npm pack

# Install from tarball
npm install -g promptpad-0.1.0.tgz
```

## 💡 Use Cases

### 1. Enhanced Claude Code Prompts

Transform simple requests into detailed prompts for Claude Code:

```bash
# Before
promptpad refine "help with testing"

# Outputs detailed testing guidance
promptpad refine "help with testing" --copy
# Then paste into Claude Code for comprehensive testing assistance
```

### 2. Documentation Generation

Create detailed documentation briefs:

```bash
promptpad refine "document the API" --output api-docs-brief.md
```

### 3. Code Review Guidelines

Generate comprehensive code review prompts:

```bash
promptpad refine "review this code" --temperature 0.1 > code-review-template.md
```

### 4. Project Specifications

Generate detailed technical specifications for coding projects:

```bash
# Web application specification
promptpad spec "social media dashboard for small businesses" --output dashboard-spec.md

# Mobile app specification  
promptpad spec "fitness tracking app with wearable integration" --copy

# API service specification
promptpad spec "REST API for inventory management system" --verbose --output inventory-api-spec.md
```

### 5. Batch Processing

Process multiple prompts efficiently:

```bash
#!/bin/bash
# process-prompts.sh
for prompt in "design database" "create tests" "write docs"; do
  promptpad refine "$prompt" --output "${prompt// /-}-brief.md"
done
```

## 🔍 Troubleshooting

### Common Issues

**1. "Ollama service is not running"**
```bash
# Start Ollama service
ollama serve

# Verify it's running
curl http://localhost:11434/api/tags
```

**2. "Model not found"**
```bash
# List available models
ollama list

# Pull the default model
ollama pull gpt-oss:20b

# Or use a different model
promptpad refine "test" --model llama3.1:8b
```

**3. "CLI command not found"**
```bash
# Make sure dependencies are installed
pnpm install

# Verify CLI works locally
node bin/promptpad.cjs --help

# Link globally if needed
pnpm cli:install
```

**4. "Clipboard not working"**
```bash
# macOS - should work by default
# Linux - install xclip or xsel
sudo apt-get install xclip xsel

# Windows - should work by default with PowerShell
```

### Performance Tips

**1. Model Selection**
- `gpt-oss:20b` - Best quality, slower (20-40s)
- `llama3.1:8b` - Good balance, faster (10-20s)
- `mistral:7b` - Fastest option (5-15s)

**2. Temperature Settings**
- `0.1` - Very focused, deterministic output
- `0.2` - Default, good balance
- `0.3` - Maximum allowed, more creative

**3. Verbose Mode**
Use `--verbose` for debugging slow operations:

```bash
promptpad refine "complex task" --verbose
# Shows: model validation, timing, token usage, etc.
```

## 🔗 Integration Examples

### With Git Hooks

```bash
#!/bin/bash
# .git/hooks/prepare-commit-msg
if [ -z "$2" ]; then
  # Enhance commit message prompts
  BRIEF=$(promptpad refine "write commit message for: $(git diff --cached --name-only)")
  echo "# $BRIEF" > "$1.tmp"
  cat "$1" >> "$1.tmp"
  mv "$1.tmp" "$1"
fi
```

### With VSCode Tasks

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Refine Prompt",
      "type": "shell",
      "command": "promptpad",
      "args": ["refine", "${input:promptText}", "--copy"],
      "group": "build"
    }
  ],
  "inputs": [
    {
      "id": "promptText",
      "description": "Enter prompt to refine",
      "default": "",
      "type": "promptString"
    }
  ]
}
```

### With Shell Aliases

```bash
# Add to ~/.bashrc or ~/.zshrc
alias pr='promptpad refine'
alias pre='promptpad reinforce'
alias prc='promptpad refine --copy'

# Usage
pr "build a website"
prc "create documentation"
```

## 🔧 Development

### Architecture

```
bin/promptpad.cjs     # Executable entry point (uses tsx)
lib/cli/
├── index.ts          # Main CLI program setup
├── commands/         # Individual command implementations  
│   ├── refine.ts     # Refine command logic
│   └── reinforce.ts  # Reinforce command logic
└── utils/            # CLI utilities
    ├── prompts.ts    # System prompt builders (reused from web app)
    ├── helpers.ts    # Validation and error handling
    ├── clipboard.ts  # Cross-platform clipboard operations
    └── version.ts    # Version information
```

### Dependencies

- **commander** - Command line interface framework
- **tsx** - TypeScript execution engine
- **ollama client** - Reused from main application

### Testing

```bash
# Test help
pnpm cli:test

# Test specific commands (requires Ollama)
node bin/promptpad.cjs refine "test prompt" --verbose
node bin/promptpad.cjs reinforce "Test prompt content" --verbose

# Test clipboard functionality
node bin/promptpad.cjs refine "test" --copy
```

## 📝 Contributing

When adding new CLI features:

1. **Follow existing patterns** - Commands use consistent option naming
2. **Add comprehensive help** - All commands should have clear descriptions
3. **Include examples** - Both in help text and documentation
4. **Handle errors gracefully** - Provide helpful troubleshooting guidance
5. **Test thoroughly** - Verify with different models and options

### Adding New Commands

```typescript
// lib/cli/commands/new-command.ts
export async function newCommand(input: string, options: NewOptions) {
  try {
    // Validate options
    const model = options.model || 'gpt-oss:20b'
    await validateModel(model, options.verbose)
    
    // Execute command logic
    const result = await executeNewCommand(input, options)
    
    // Handle output
    console.log(result)
    process.exit(0)
  } catch (error) {
    handleCliError('new-command', error, options.verbose)
  }
}
```

This CLI tool brings Promptpad's powerful prompt refinement capabilities to the command line, enabling seamless integration with developer workflows and enhanced prompting for AI coding assistants like Claude Code.