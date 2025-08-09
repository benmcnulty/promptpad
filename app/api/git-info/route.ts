import { NextResponse } from 'next/server'
import { execSync } from 'child_process'

export const dynamic = 'force-dynamic'

/**
 * GET /api/git-info
 * Returns git commit information for the running instance.
 */
export async function GET() {
  try {
    const sha = execSync('git rev-parse --short HEAD', { encoding: 'utf8' }).trim()
    const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim()
    return NextResponse.json({ sha, branch, timestamp: new Date().toISOString() })
  } catch {
    return NextResponse.json({ sha: 'unknown', branch: 'unknown', timestamp: new Date().toISOString() })
  }
}

