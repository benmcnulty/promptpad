// Mock NextResponse similar to other API tests so we don't need full runtime
jest.mock('next/server', () => ({
  NextResponse: {
    json: (data: any) => ({
      status: 200,
      ok: true,
      async json() { return data },
    }),
  },
}))

jest.mock('child_process', () => ({
  execSync: jest.fn((cmd: string) => {
    if (cmd.includes('rev-parse')) return 'abcdef\n'
    if (cmd.includes('branch')) return 'main\n'
    return ''
  })
}))

describe('/api/git-info route', () => {
  it('returns git sha and branch on success', async () => {
    const { GET } = await import('@/app/api/git-info/route')
    const res: any = await GET()
    const json = await res.json()
    expect(json.sha).toBe('abcdef')
    expect(json.branch).toBe('main')
    expect(typeof json.timestamp).toBe('string')
  })

  it('returns unknown values on failure', async () => {
    const { execSync } = require('child_process')
    execSync.mockImplementationOnce(() => { throw new Error('fail') })
    const { GET } = await import('@/app/api/git-info/route')
    const res: any = await GET()
    const json = await res.json()
    expect(json.sha).toBe('unknown')
    expect(json.branch).toBe('unknown')
  })
})
