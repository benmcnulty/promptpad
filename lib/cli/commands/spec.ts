/**
 * Spec command implementation for Promptpad CLI
 * 
 * Generates comprehensive coding project specifications with intelligent
 * technology guidance based on brief input requirements.
 */

import { ollama } from '../../ollama'
import { buildSpecPrompt } from '../utils/prompts'
import { validateModel, parseTemperature, parseTimeout, handleCliError, formatDuration } from '../utils/helpers'
import { copyToClipboard, writeToFile } from '../utils/clipboard'

export interface SpecOptions {
  output?: string
  copy?: boolean
  model?: string
  temperature?: string
  timeout?: string
  verbose?: boolean
}

/**
 * Execute the spec command
 * 
 * Transforms brief project descriptions into comprehensive, production-ready
 * project specifications with technology recommendations.
 * 
 * @param input - Brief project description or requirements
 * @param options - Command options
 */
/**
 * Execute the spec command with global options support
 * 
 * @param input - Brief project description
 * @param options - Command options 
 * @param globalOptions - Global CLI options passed from commander
 */
export async function specCommand(input: string, options: SpecOptions, globalOptions?: any) {
  // Merge global options with command options  
  const mergedOptions = {
    ...options,
    model: options.model || globalOptions?.model,
    temperature: options.temperature || globalOptions?.temperature,
    timeout: options.timeout || globalOptions?.timeout,
    verbose: options.verbose || globalOptions?.verbose
  }
  
  const { verbose } = mergedOptions
  
  try {
    // Parse and validate options
    const model = mergedOptions.model || 'gpt-oss:20b'
    const temperature = parseTemperature(mergedOptions.temperature || '0.2')
    const timeout = parseTimeout(mergedOptions.timeout || '120000')
    
    if (verbose) {
      console.log('🔧 Spec Configuration:')
      console.log(`   Model: ${model}`)
      console.log(`   Temperature: ${temperature}`)
      console.log(`   Timeout: ${formatDuration(timeout)}`)
      console.log(`   Input: "${input.slice(0, 100)}${input.length > 100 ? '...' : ''}"`)
      console.log('')
    }
    
    // Validate model availability
    await validateModel(model, verbose)
    
    // Build system prompt for spec generation
    const systemPrompt = buildSpecPrompt(input)
    if (verbose) {
      console.log('📋 Generated system prompt:')
      console.log(`   Length: ${systemPrompt.length} characters`)
      console.log('')
    }
    
    // Generate specification
    console.log('🚀 Generating comprehensive project specification...')
    const startTime = Date.now()
    
    const { text, usage } = await ollama.generate(model, systemPrompt, { temperature })
    
    const duration = Date.now() - startTime
    
    // Clean up any unwanted prefixes the model might add
    const cleanedText = text
      .replace(/^\*\*Specification:\*\*\s*/i, '')
      .replace(/^Specification:\s*/i, '')
      .replace(/^# Specification\s*/i, '')
      .replace(/^Here's the (detailed|comprehensive) (project )?specification:\s*/i, '')
      .replace(/^"([\s\S]*)"$/, '$1') // Remove surrounding quotes
      .trim()
    
    if (verbose) {
      console.log('')
      console.log('📊 Generation Stats:')
      console.log(`   Duration: ${formatDuration(duration)}`)
      console.log(`   Input tokens: ${usage.input_tokens}`)
      console.log(`   Output tokens: ${usage.output_tokens}`)
      console.log(`   Token ratio: ${(usage.output_tokens / usage.input_tokens).toFixed(2)}x`)
      console.log(`   Output length: ${cleanedText.length} characters`)
      console.log('')
    }
    
    // Handle output
    if (options.output) {
      await writeToFile(options.output, cleanedText)
      console.log(`✅ Specification saved to: ${options.output}`)
    } else {
      console.log('')
      console.log(cleanedText)
    }
    
    // Copy to clipboard if requested
    if (options.copy) {
      await copyToClipboard(cleanedText)
      console.log('📋 Copied to clipboard!')
    }
    
    console.log('')
    console.log('🎉 Project specification generated successfully!')
    process.exit(0)
    
  } catch (error) {
    handleCliError('spec', error, verbose)
  }
}