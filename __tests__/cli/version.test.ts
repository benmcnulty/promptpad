import { getVersion, getDetailedVersion } from '@/lib/cli/utils/version'
import * as fs from 'fs'

describe('version utils', () => {
  it('returns version from package.json', () => {
    const v = getVersion()
    expect(typeof v).toBe('string')
    expect(v.length).toBeGreaterThan(0)
  })

  it('falls back when read fails', () => {
    const readSpy = jest.spyOn(fs, 'readFileSync').mockImplementation(() => { throw new Error('nope') })
    const v = getVersion()
    expect(v).toBe('0.1.0')
    readSpy.mockRestore()
  })

  it('provides detailed version info', () => {
    const info = getDetailedVersion()
    expect(info).toHaveProperty('version')
    expect(info).toHaveProperty('node')
    expect(info).toHaveProperty('platform')
  })
})
