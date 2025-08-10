/**
 * Clipboard utilities for Promptpad CLI
 * 
 * Cross-platform clipboard operations for copying refined prompts
 * directly from the command line.
 */

import { execSync } from 'child_process'
import { platform } from 'os'

/**
 * Copies text to the system clipboard
 * 
 * Uses platform-specific commands to interact with the system clipboard.
 * Supports macOS, Linux, and Windows with appropriate fallbacks.
 * 
 * @param text - Text to copy to clipboard
 * @throws Error if clipboard operation fails
 * 
 * @example
 * ```typescript
 * await copyToClipboard('Hello, world!')
 * console.log('Text copied successfully!')
 * ```
 */
export async function copyToClipboard(text: string): Promise<void> {
  const currentPlatform = platform()
  
  try {
    switch (currentPlatform) {
      case 'darwin': // macOS
        execSync('pbcopy', { input: text, encoding: 'utf8' })
        break
        
      case 'linux':
        // Try xclip first, then xsel as fallback
        try {
          execSync('xclip -selection clipboard', { input: text, encoding: 'utf8' })
        } catch {
          execSync('xsel --clipboard --input', { input: text, encoding: 'utf8' })
        }
        break
        
      case 'win32': // Windows
        // Use PowerShell for better Unicode support
        execSync('powershell -command "Set-Clipboard -Value $input"', { 
          input: text, 
          encoding: 'utf8' 
        })
        break
        
      default:
        throw new Error(`Unsupported platform: ${currentPlatform}`)
    }
  } catch (error) {
    // Provide platform-specific installation instructions
    const installInstructions = getClipboardInstallInstructions(currentPlatform)
    throw new Error(
      `Failed to copy to clipboard: ${error instanceof Error ? error.message : error}\n${installInstructions}`
    )
  }
}

/**
 * Gets installation instructions for clipboard utilities on different platforms
 * 
 * @param platform - Operating system platform
 * @returns Installation instructions string
 */
function getClipboardInstallInstructions(platform: string): string {
  switch (platform) {
    case 'linux':
      return 'Install clipboard utilities: sudo apt-get install xclip xsel  (or equivalent for your distro)'
    case 'darwin':
      return 'pbcopy should be available by default on macOS'
    case 'win32':
      return 'PowerShell should be available by default on Windows'
    default:
      return 'Clipboard functionality may not be available on this platform'
  }
}

/**
 * Checks if clipboard functionality is available on the current platform
 * 
 * @returns true if clipboard operations are supported
 */
export function isClipboardAvailable(): boolean {
  const currentPlatform = platform()
  
  try {
    switch (currentPlatform) {
      case 'darwin':
        execSync('which pbcopy', { stdio: 'ignore' })
        return true
        
      case 'linux':
        try {
          execSync('which xclip', { stdio: 'ignore' })
          return true
        } catch {
          try {
            execSync('which xsel', { stdio: 'ignore' })
            return true
          } catch {
            return false
          }
        }
        
      case 'win32':
        // PowerShell is generally available on Windows 10+
        execSync('powershell -command "Get-Command Set-Clipboard"', { stdio: 'ignore' })
        return true
        
      default:
        return false
    }
  } catch {
    return false
  }
}