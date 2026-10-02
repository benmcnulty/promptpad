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

// Use the installed tsx entry point through Node; avoid shell-specific npx.cmd lookup.
const child = spawn(process.execPath, [require.resolve('tsx/cli'), cliPath, ...process.argv.slice(2)], {
  stdio: 'inherit',
  cwd: path.resolve(__dirname, '..')
})

child.on('exit', (code) => {
  process.exit(code === null ? 1 : code)
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
