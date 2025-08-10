/**
 * Refine command implementation for Promptpad CLI
 * 
 * Expands terse instructions into detailed, actionable prompts using
 * the same logic as the web application but optimized for CLI usage.
 */

import { writeFileSync } from 'fs'
import { ollama } from '../../ollama'
import { buildRefinePrompt } from '../utils/prompts'
import { handleCliError, validateModel, parseTemperature } from '../utils/helpers'
import { copyToClipboard } from '../utils/clipboard'

/**
 * Options for the refine command
 */
interface RefineOptions {
  output?: string
  copy?: boolean
  model?: string
  temperature?: string
  verbose?: boolean
  timeout?: string
}

/**
 * Refine command handler
 * 
 * Takes terse input and expands it into a detailed, structured prompt
 * suitable for use with AI systems like Claude Code.
 * 
 * @param input - Terse instruction to expand
 * @param options - Command options from CLI
 */
export async function refineCommand(input: string, options: RefineOptions) {
  const startTime = Date.now()
  
  try {
    // Validate and parse options
    const model = options.model || 'gpt-oss:20b'
    const temperature = parseTemperature(options.temperature || '0.2')
    const verbose = options.verbose || false
    
    if (verbose) {
      console.log(`🔄 Refining prompt using ${model} (temp=${temperature})`)
      console.log(`📝 Input: "${input.slice(0, 100)}${input.length > 100 ? '...' : ''}"`)
    }

    // Validate model availability
    if (verbose) {
      console.log('🔍 Checking Ollama service...')
    }
    
    await validateModel(model, verbose)

    // Build system prompt and generate
    const systemPrompt = buildRefinePrompt(input)
    
    if (verbose) {
      console.log(`🤖 Sending to Ollama...`)
    }

    const { text, usage } = await ollama.generate(model, systemPrompt, { temperature })

    // Clean response (same logic as web app)
    const cleanedOutput = text
      .replace(/^\*\*Prompt:\*\*\s*/i, '')
      .replace(/^Prompt:\s*/i, '')
      .replace(/^# Prompt\s*/i, '')
      .replace(/^Here's the (refined|reinforced) prompt:\s*/i, '')
      .replace(/^"([\s\S]*)"$/, '$1')
      .trim()

    const duration = Date.now() - startTime

    // Output results
    if (verbose) {
      console.log(`✅ Refined in ${duration}ms`)
      console.log(`📊 Tokens: ${usage.input_tokens} → ${usage.output_tokens} (${(usage.output_tokens / usage.input_tokens).toFixed(2)}x expansion)`)
      console.log('')
    }

    // Handle output
    if (options.output) {
      writeFileSync(options.output, cleanedOutput, 'utf8')
      console.log(`💾 Saved to ${options.output}`)
    } else {
      // Print to stdout with a separator for clarity
      if (verbose) {
        console.log('📋 Refined prompt:')
        console.log('─'.repeat(50))
      }
      console.log(cleanedOutput)
      if (verbose) {
        console.log('─'.repeat(50))
      }
    }

    // Copy to clipboard if requested
    if (options.copy) {
      try {
        await copyToClipboard(cleanedOutput)
        console.log('📋 Copied to clipboard!')
      } catch (error) {
        console.warn('⚠️ Could not copy to clipboard:', error instanceof Error ? error.message : error)
      }
    }

    // Success exit
    process.exit(0)

  } catch (error) {
    handleCliError('refine', error, options.verbose)
  }
}