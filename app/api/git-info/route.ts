import { NextResponse } from 'next/server'
import { execSync } from 'child_process'

export const dynamic = 'force-dynamic'

/**
 * GET /api/git-info
 * Returns git commit information
 */
export async function GET() {
  try {
    // Try to get current git SHA
    const sha = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()
    const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim()
    
    return NextResponse.json({
      sha,
      branch,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    // Fallback if git is not available
    return NextResponse.json({
      sha: '0327471',
      branch: 'main',
      timestamp: new Date().toISOString()
    })
  }
}