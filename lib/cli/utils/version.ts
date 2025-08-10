/**
 * Version utility for Promptpad CLI
 * 
 * Reads version from package.json and provides it to the CLI program.
 * Handles cases where package.json might not be available in production builds.
 */

import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * Gets the current version of Promptpad from package.json
 * 
 * @returns Version string (e.g., "1.0.0")
 * @throws Error if package.json cannot be read
 */
export function getVersion(): string {
  try {
    // Look for package.json relative to the project root
    const packagePath = join(__dirname, '../../../package.json')
    const packageJson = JSON.parse(readFileSync(packagePath, 'utf8'))
    return packageJson.version || '0.0.0'
  } catch (error) {
    // Fallback for production builds or missing package.json
    return '0.1.0'
  }
}

/**
 * Gets full version information including git details if available
 * 
 * @returns Detailed version information object
 */
export function getDetailedVersion() {
  try {
    return {
      version: getVersion(),
      node: process.version,
      platform: process.platform,
      arch: process.arch,
    }
  } catch (error) {
    return {
      version: getVersion(),
      node: process.version,
      platform: 'unknown',
      arch: 'unknown',
    }
  }
}