// Mock Next.js navigation redirect
jest.mock('next/navigation', () => ({
  redirect: jest.fn()
}))

describe('Home Page (Root Redirect)', () => {
  it('is a server component that implements redirect', async () => {
    // Import the component module
    const homeModule = await import('@/app/page')
    
    // Should export a default function
    expect(typeof homeModule.default).toBe('function')
    expect(homeModule.default.name).toBe('Home')
  })

  it('uses Next.js redirect API', () => {
    // Verify that redirect is imported and used
    const fs = require('fs')
    const path = require('path')
    const homePagePath = path.join(process.cwd(), 'app/page.tsx')
    const homePageContent = fs.readFileSync(homePagePath, 'utf8')
    
    // Should import redirect from next/navigation
    expect(homePageContent).toContain("import { redirect } from 'next/navigation'")
    // Should call redirect with /prompt-enhancer
    expect(homePageContent).toContain("redirect('/prompt-enhancer')")
  })
})
