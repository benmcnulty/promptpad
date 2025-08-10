#!/usr/bin/env node
/**
 * Promptpad CLI - Command line interface for prompt refinement
 * 
 * Provides terminal access to Promptpad's refine and reinforce functionality
 * for enhanced prompt creation and optimization workflows.
 * 
 * @example
 * ```bash
 * # Refine a terse instruction into a detailed prompt
 * promptpad refine "write a blog post about AI"
 * 
 * # Reinforce an existing prompt for better clarity
 * promptpad reinforce "Write a comprehensive blog post..."
 * 
 * # Use custom model and settings
 * promptpad refine "help with documentation" --model llama3.1:8b --temperature 0.1
 * ```
 */

import { program } from 'commander'
import { refineCommand } from './commands/refine'
import { reinforceCommand } from './commands/reinforce'
import { getVersion } from './utils/version'

/**
 * Main CLI program setup and execution
 * 
 * Configures the commander.js program with global options and subcommands,
 * handles error cases, and provides consistent CLI experience.
 */
async function main() {
  try {
    program
      .name('promptpad')
      .description('Local-first prompt refinement and optimization')
      .version(getVersion())
      .option('-v, --verbose', 'Enable verbose output')
      .option('--model <model>', 'Ollama model to use', 'gpt-oss:20b')
      .option('--temperature <temp>', 'Generation temperature (0.0-0.3)', '0.2')
      .option('--timeout <ms>', 'Request timeout in milliseconds', '120000')

    // Refine command - expand terse instructions
    program
      .command('refine')
      .description('Expand terse instructions into detailed, actionable prompts')
      .argument('<input>', 'Input text or prompt to refine')
      .option('-o, --output <file>', 'Output file path (default: stdout)')
      .option('--copy', 'Copy result to clipboard')
      .action(refineCommand)

    // Reinforce command - optimize existing prompts  
    program
      .command('reinforce')
      .description('Optimize and tighten existing prompts for better clarity')
      .argument('<input>', 'Draft prompt to reinforce')
      .option('-o, --output <file>', 'Output file path (default: stdout)')
      .option('--copy', 'Copy result to clipboard')
      .action(reinforceCommand)

    // Interactive mode for multiple operations
    program
      .command('interactive')
      .alias('i')
      .description('Start interactive prompt refinement session')
      .action(() => {
        console.log('🚀 Interactive mode coming soon!')
        console.log('For now, use individual refine/reinforce commands.')
        process.exit(0)
      })

    await program.parseAsync(process.argv)
  } catch (error) {
    console.error('❌ CLI error:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled promise rejection at:', promise, 'reason:', reason)
  process.exit(1)
})

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught exception:', error)
  process.exit(1)
})

// Run CLI if executed directly (ES module compatible)
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })
}

export { main }