/**
 * Minimal string history manager for undo/redo functionality
 * 
 * Maintains an immutable sequence of string snapshots with linear history.
 * Pushing new states after undoing will truncate future states, providing
 * intuitive undo/redo behavior similar to text editors.
 * 
 * Features:
 * - Linear history with branching truncation
 * - Duplicate state prevention
 * - Memory efficient with string deduplication
 * - Safe boundary checking for all operations
 * 
 * @example
 * ```typescript
 * const history = new HistoryManager('initial text')
 * history.push('edited text')
 * history.push('final text')
 * 
 * console.log(history.undo())     // 'edited text'
 * console.log(history.undo())     // 'initial text'
 * console.log(history.canUndo())  // false
 * 
 * console.log(history.redo())     // 'edited text'
 * console.log(history.redo())     // 'final text'
 * console.log(history.canRedo())  // false
 * ```
 */
export class HistoryManager {
  private states: string[] = []
  private index = -1

  /**
   * Creates a new HistoryManager with an initial state
   * @param initial - Initial string content (default: empty string)
   */
  constructor(initial = '') {
    this.push(initial)
  }

  /**
   * Gets the current state without modifying history position
   * @returns Current string state
   */
  current(): string { return this.states[this.index] }

  /**
   * Checks if undo operation is available
   * @returns True if there are previous states to undo to
   */
  canUndo(): boolean { return this.index > 0 }

  /**
   * Checks if redo operation is available  
   * @returns True if there are future states to redo to
   */
  canRedo(): boolean { return this.index < this.states.length - 1 }

  /**
   * Adds a new state to history, potentially truncating future states
   * 
   * Prevents duplicate consecutive states for efficiency. If called after
   * an undo operation, truncates all future states and adds the new state,
   * creating a new timeline branch.
   * 
   * @param next - New string state to add to history
   * @example
   * ```typescript
   * const history = new HistoryManager('start')
   * history.push('edit1')
   * history.push('edit1') // Ignored - duplicate
   * history.push('edit2') // Added
   * 
   * history.undo()        // Back to 'edit1'
   * history.push('edit3') // Truncates 'edit2', adds 'edit3'
   * ```
   */
  push(next: string) {
    const prev = this.current() ?? ''
    if (prev === next) return
    if (this.index < this.states.length - 1) {
      this.states = this.states.slice(0, this.index + 1)
    }
    this.states.push(next)
    this.index = this.states.length - 1
  }

  /**
   * Moves back one state in history
   * 
   * Safe operation that checks bounds and returns the previous state.
   * Use canUndo() to check availability before calling.
   * 
   * @returns Previous string state, or undefined if already at beginning
   * @example
   * ```typescript
   * const history = new HistoryManager('state1')
   * history.push('state2')
   * history.push('state3')
   * 
   * console.log(history.undo()) // 'state2'
   * console.log(history.undo()) // 'state1'
   * console.log(history.undo()) // undefined (no more states)
   * ```
   */
  undo(): string | undefined {
    if (!this.canUndo()) return undefined
    this.index--
    return this.current()
  }

  /**
   * Moves forward one state in history
   * 
   * Safe operation that checks bounds and returns the next state.
   * Use canRedo() to check availability before calling.
   * 
   * @returns Next string state, or undefined if already at end
   * @example
   * ```typescript
   * const history = new HistoryManager('state1')
   * history.push('state2')
   * history.push('state3')
   * history.undo() // Back to 'state2'
   * 
   * console.log(history.redo()) // 'state3'
   * console.log(history.redo()) // undefined (no more states)
   * ```
   */
  redo(): string | undefined {
    if (!this.canRedo()) return undefined
    this.index++
    return this.current()
  }
}
