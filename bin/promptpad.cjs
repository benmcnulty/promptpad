#!/usr/bin/env node

/**
 * Promptpad CLI executable entry point
 * 
 * Uses tsx to run TypeScript ES modules directly.
 * This provides excellent TypeScript support with ES modules.
 */

const { spawn } = require('child_process')
const path = require('path')

// Path to the TypeScript CLI entry point
const cliPath = path.resolve(__dirname, '../lib/cli/index.ts')

// Run with tsx for excellent TypeScript ES module support
const child = spawn('npx', ['tsx', cliPath, ...process.argv.slice(2)], {
  stdio: 'inherit',
  cwd: path.resolve(__dirname, '..')
})

child.on('exit', (code) => {
  process.exit(code || 0)
})

child.on('error', (error) => {
  console.error('❌ Failed to start Promptpad CLI:', error.message)
  console.error('')
  console.error('💡 Make sure tsx is available:')
  console.error('   npm install -g tsx')
  console.error('')
  console.error('💡 Or install project dependencies:')
  console.error('   pnpm install')
  process.exit(1)
})