/**
 * Minimal string history manager (immutable snapshots).
 * Keeps linear history; pushing after undo truncates future.
 */
export class HistoryManager {
  private states: string[] = []
  private index = -1

  constructor(initial = '') {
    this.push(initial)
  }

  current(): string { return this.states[this.index] }
  canUndo(): boolean { return this.index > 0 }
  canRedo(): boolean { return this.index < this.states.length - 1 }

  push(next: string) {
    const prev = this.current() ?? ''
    if (prev === next) return
    if (this.index < this.states.length - 1) {
      this.states = this.states.slice(0, this.index + 1)
    }
    this.states.push(next)
    this.index = this.states.length - 1
  }

  undo(): string | undefined {
    if (!this.canUndo()) return undefined
    this.index--
    return this.current()
  }

  redo(): string | undefined {
    if (!this.canRedo()) return undefined
    this.index++
    return this.current()
  }
}
