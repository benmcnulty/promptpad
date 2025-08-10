import { HistoryManager } from '@/lib/history'

describe('HistoryManager', () => {
  it('push/undo/redo cycle', () => {
    const h = new HistoryManager('a')
    h.push('ab')
    h.push('abc')
    expect(h.current()).toBe('abc')
    expect(h.undo()).toBe('ab')
    expect(h.current()).toBe('ab')
    expect(h.undo()).toBe('a')
    expect(h.redo()).toBe('ab')
    expect(h.redo()).toBe('abc')
  })

  it('ignores identical pushes', () => {
    const h = new HistoryManager('x')
    h.push('x')
    expect(h.current()).toBe('x')
  })

  it('truncates future on new branch', () => {
    const h = new HistoryManager('start')
    h.push('one')
    h.push('two')
    h.undo() // back to one
    h.push('one-mod')
    expect(h.current()).toBe('one-mod')
    expect(h.canRedo()).toBe(false)
  })

  it('canUndo/canRedo flags behave correctly at boundaries', () => {
    const h = new HistoryManager('a')
    expect(h.canUndo()).toBe(false)
    h.push('b')
    expect(h.canUndo()).toBe(true)
    h.undo()
    expect(h.canUndo()).toBe(false)
    expect(h.canRedo()).toBe(true)
    h.redo()
    expect(h.canRedo()).toBe(false)
  })
})
