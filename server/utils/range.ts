export type ByteRange = { start: number, end: number }

/** Returns the range, null when no header was sent, or 'invalid' when unsatisfiable. */
export function parseRange(header: string | undefined, size: number): ByteRange | null | 'invalid' {
  if (!header) return null
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim())
  if (!match) return 'invalid'

  const [, rawStart, rawEnd] = match
  if (rawStart === '' && rawEnd === '') return 'invalid'

  let start: number
  let end: number
  if (rawStart === '') {
    const suffix = Number(rawEnd)
    if (suffix === 0) return 'invalid'
    start = Math.max(size - suffix, 0)
    end = size - 1
  } else {
    start = Number(rawStart)
    end = rawEnd === '' ? size - 1 : Math.min(Number(rawEnd), size - 1)
  }

  if (start >= size || start > end) return 'invalid'
  return { start, end }
}
