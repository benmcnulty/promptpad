import { HistoryManager } from '@/lib/history'

describe('HistoryManager boundary branches', () => {
  it('returns undefined when undo not possible', () => {
    const h = new HistoryManager('start')
    expect(h.canUndo()).toBe(false)
    expect(h.undo()).toBeUndefined()
  })

  it('returns undefined when redo not possible', () => {
    const h = new HistoryManager('a')
    h.push('b')
    h.undo()
    h.redo()
    expect(h.canRedo()).toBe(false)
    expect(h.redo()).toBeUndefined()
  })
})
