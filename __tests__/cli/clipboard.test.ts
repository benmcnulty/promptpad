import { copyToClipboard, isClipboardAvailable, writeToFile } from '@/lib/cli/utils/clipboard'
import { platform } from 'os'
import fs from 'fs'

jest.mock('child_process', () => ({ execSync: jest.fn() }))
jest.mock('os', () => ({ platform: jest.fn(() => 'darwin') }))

describe('clipboard utilities', () => {
  it('copyToClipboard on supported platform', async () => {
    const { execSync } = require('child_process')
    await copyToClipboard('text')
    expect(execSync).toHaveBeenCalled()
  })
  it('isClipboardAvailable returns true on darwin', () => {
    const { execSync } = require('child_process')
    execSync.mockReturnValueOnce(undefined)
    expect(isClipboardAvailable()).toBe(true)
  })
  it('writeToFile writes content', async () => {
    const spy = jest.spyOn(fs, 'writeFileSync').mockImplementation(() => {})
    await writeToFile('./tmp/test-output.txt', 'hello')
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })
  it('copyToClipboard unsupported platform throws', async () => {
    ;(platform as jest.Mock).mockReturnValueOnce('sunos')
    await expect(copyToClipboard('x')).rejects.toThrow(/Unsupported platform/)
  })
})
