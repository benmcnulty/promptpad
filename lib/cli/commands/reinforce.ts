/**
 * Reinforce command implementation for Promptpad CLI
 * 
 * Optimizes and tightens existing prompts for better clarity and effectiveness,
 * using the same reinforcement logic as the web application.
 */

import { writeFileSync } from 'fs'
import { ollama } from '../../ollama'
import { buildReinforcePrompt } from '../utils/prompts'
import { handleCliError, validateModel, parseTemperature } from '../utils/helpers'
import { copyToClipboard } from '../utils/clipboard'

/**
 * Options for the reinforce command
 */
interface ReinforceOptions {
  output?: string
  copy?: boolean
  model?: string
  temperature?: string
  verbose?: boolean
  timeout?: string
}

/**
 * Reinforce command handler
 * 
 * Takes an existing draft prompt and optimizes it for better precision,
 * clarity, and effectiveness while preserving the original intent.
 * 
 * @param draft - Draft prompt to optimize
 * @param options - Command options from CLI
 */
export async function reinforceCommand(draft: string, options: ReinforceOptions) {
  const startTime = Date.now()
  
  try {
    // Validate and parse options
    const model = options.model || 'gpt-oss:20b'
    const temperature = parseTemperature(options.temperature || '0.2')
    const verbose = options.verbose || false

    if (verbose) {
      console.log(`🔄 Reinforcing prompt using ${model} (temp=${temperature})`)
      console.log(`📝 Draft: "${draft.slice(0, 100)}${draft.length > 100 ? '...' : ''}"`)
    }

    // Validate model availability
    if (verbose) {
      console.log('🔍 Checking Ollama service...')
    }
    
    await validateModel(model, verbose)

    // Build system prompt and generate
    const systemPrompt = buildReinforcePrompt(draft)
    
    if (verbose) {
      console.log(`🤖 Sending to Ollama...`)
    }

    const { text, usage } = await ollama.generate(model, systemPrompt, { temperature })

    // Clean response (same logic as web app)
    const cleanedOutput = text
      .replace(/^\*\*Prompt:\*\*\s*/i, '')
      .replace(/^Prompt:\s*/i, '')
      .replace(/^# Prompt\s*/i, '')
      .replace(/^Here's (an? )?(enhanced|improved|refined|reinforced) (version of the )?.*?prompt:\s*/i, '')
      .replace(/^"([\s\S]*)"$/, '$1')
      .replace(/\n\n(I made the following improvements|Let me know if|The improvements include)[\s\S]*$/i, '')
      .trim()

    const duration = Date.now() - startTime

    // Output results
    if (verbose) {
      console.log(`✅ Reinforced in ${duration}ms`)
      console.log(`📊 Tokens: ${usage.input_tokens} → ${usage.output_tokens} (${(usage.output_tokens / usage.input_tokens).toFixed(2)}x ratio)`)
      console.log('')
    }

    // Handle output
    if (options.output) {
      writeFileSync(options.output, cleanedOutput, 'utf8')
      console.log(`💾 Saved to ${options.output}`)
    } else {
      // Print to stdout with a separator for clarity
      if (verbose) {
        console.log('📋 Reinforced prompt:')
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
    handleCliError('reinforce', error, options.verbose)
  }
}