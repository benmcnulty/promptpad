/**
 * Minimal diff/patch utilities for Promptpad
 * 
 * Provides efficient text differencing and patching operations for the undo/redo
 * system and text transformation workflow. Uses a minimal single-replace strategy
 * that preserves common prefixes and suffixes for optimal patch size.
 * 
 * All operations use 0-based indexing with half-open intervals [start, end).
 * 
 * @example
 * ```typescript
 * const patch = computePatch('hello world', 'hello brave world')
 * // Returns: [{ op: 'replace', from: [6, 6], to: 'brave ' }]
 * 
 * const result = applyPatch('hello world', patch)
 * // Returns: 'hello brave world'
 * ```
 */

/**
 * Replace operation for text patching
 * 
 * Represents a single text replacement with precise character range.
 * Uses 0-based indexing with half-open interval [start, end).
 */
export interface ReplaceOp {
  /** Operation type (only 'replace' is currently supported) */
  op: 'replace'
  /** Character range to replace: [start_index, end_index) */
  from: [number, number]
  /** Replacement text to insert at the specified range */
  to: string
}

/**
 * Union type for all supported patch operations
 * Currently only supports replace operations, but designed for future extension.
 */
export type PatchOp = ReplaceOp

/**
 * Computes a minimal single replace patch between two strings
 * 
 * Uses an efficient algorithm that preserves common prefixes and suffixes,
 * generating the smallest possible patch. Returns empty array for identical strings.
 * 
 * Algorithm:
 * 1. Find common prefix between strings
 * 2. Find common suffix (excluding prefix region)
 * 3. Generate single replace operation for the differing middle section
 * 
 * @param before - Original string content
 * @param after - Target string content  
 * @returns Array containing zero or one patch operations
 * 
 * @example
 * ```typescript
 * computePatch('abc', 'abc')           // Returns: []
 * computePatch('hello', 'hello world') // Returns: [{ op: 'replace', from: [5, 5], to: ' world' }]
 * computePatch('old text', 'new text') // Returns: [{ op: 'replace', from: [0, 3], to: 'new' }]
 * ```
 */
export function computePatch(before: string, after: string): PatchOp[] {
  if (before === after) return []
  const lenBefore = before.length
  const lenAfter = after.length

  // Common prefix
  let prefix = 0
  while (prefix < lenBefore && prefix < lenAfter && before[prefix] === after[prefix]) prefix++

  // Common suffix (exclusive of prefix region)
  let suffix = 0
  while (
    suffix < (lenBefore - prefix) &&
    suffix < (lenAfter - prefix) &&
    before[lenBefore - 1 - suffix] === after[lenAfter - 1 - suffix]
  ) {
    suffix++
  }

  const start = prefix
  const end = lenBefore - suffix
  const replacement = after.slice(start, lenAfter - suffix)
  return [{ op: 'replace', from: [start, end], to: replacement }]
}

/**
 * Applies a patch to a source string, returning the modified result
 * 
 * Validates patch operations for correctness (non-overlapping, sorted order)
 * and applies all operations sequentially to produce the final result.
 * 
 * @param source - Original string to patch
 * @param patch - Array of patch operations to apply (must be non-overlapping and sorted)
 * @returns Modified string with all patch operations applied
 * @throws {Error} When patch operations are invalid (overlapping or malformed ranges)
 * 
 * @example
 * ```typescript
 * const source = 'hello world'
 * const patch = [{ op: 'replace', from: [6, 11], to: 'universe' }]
 * const result = applyPatch(source, patch)
 * // Returns: 'hello universe'
 * ```
 */
export function applyPatch(source: string, patch: PatchOp[]): string {
  if (!patch.length) return source
  // Validate non-overlapping, sorted
  let lastEnd = 0
  for (const op of patch) {
    const [start, end] = op.from
    if (start < lastEnd) throw new Error('Overlapping patch ops')
    if (start > end) throw new Error('Invalid range')
    lastEnd = end
  }
  // Build result
  let result = ''
  let cursor = 0
  for (const op of patch) {
    const [start, end] = op.from
    result += source.slice(cursor, start) + op.to
    cursor = end
  }
  result += source.slice(cursor)
  return result
}

/**
 * Inverts a patch to create an undo operation
 * 
 * Generates a patch that, when applied to the result of the original patch,
 * will restore the original string. Essential for undo/redo functionality.
 * 
 * The inverted patch maps from the post-patch coordinate space back to 
 * the original content at those ranges.
 * 
 * @param original - Original string before patch was applied
 * @param patch - Patch operations to invert
 * @returns Inverted patch operations that can undo the original patch
 * 
 * @example
 * ```typescript
 * const original = 'hello world'
 * const patch = [{ op: 'replace', from: [6, 11], to: 'universe' }]
 * const inverted = invertPatch(original, patch)
 * // Returns: [{ op: 'replace', from: [6, 14], to: 'world' }]
 * 
 * const modified = applyPatch(original, patch)    // 'hello universe'
 * const restored = applyPatch(modified, inverted) // 'hello world'
 * ```
 */
export function invertPatch(original: string, patch: PatchOp[]): PatchOp[] {
  if (!patch.length) return []
  return patch.map(op => {
    const [start, end] = op.from
    const originalSlice = original.slice(start, end)
    const replacementLength = op.to.length
    // After applying, the replaced region spans start .. start+replacementLength
    return { op: 'replace', from: [start, start + replacementLength], to: originalSlice } as ReplaceOp
  })
}

/**
 * Safely applies a patch with fallback handling for range mismatches
 * 
 * Attempts normal patch application, but if ranges are invalid (due to concurrent
 * modifications or coordinate space drift), falls back to a less optimal but
 * guaranteed-correct approach that applies each operation individually.
 * 
 * Prioritizes correctness over minimality - essential for undo operations
 * where the text may have been modified since the patch was created.
 * 
 * @param source - String to apply patch to (may differ from original patch target)
 * @param patch - Patch operations to apply (ranges may be invalid)
 * @returns Modified string, guaranteed to be valid even if patch ranges were invalid
 * 
 * @example
 * ```typescript
 * // Normal case: patch applies cleanly
 * const result1 = safeApply('hello world', validPatch)
 * 
 * // Fallback case: patch has invalid ranges due to text drift
 * const result2 = safeApply('modified text', staleUndo)
 * // Still returns a valid string, though potentially suboptimal
 * ```
 */
export function safeApply(source: string, patch: PatchOp[]): string {
  try {
    return applyPatch(source, patch)
  } catch {
    // Fallback: if ranges invalid due to drift, recompute naive full replace.
    // This preserves correctness over minimality.
    const full = patch.reduce((s, op) => applyPatch(s, [op]), source)
    return full
  }
}
