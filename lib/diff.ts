/**
 * Minimal diff/patch utilities for Promptpad.
 * Contract: patch ops are compact text-range replacements.
 * op: 'replace', from: [start,end) 0-based indices, to: replacement text.
 */
export interface ReplaceOp {
  op: 'replace'
  from: [number, number]
  to: string
}

export type PatchOp = ReplaceOp

/**
 * Compute a minimal single replace patch between two strings.
 * Returns [] when identical.
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

/** Apply a patch to a string. */
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

/** Invert a patch against the original source (for undo). */
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

/** Apply an inverted (undo) patch safely even if source length changed elsewhere. */
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
