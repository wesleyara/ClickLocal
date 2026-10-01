import { describe, expect, it } from 'vitest'
import { parseRange } from './range'

describe('parseRange', () => {
  it('returns null without header', () => {
    expect(parseRange(undefined, 1000)).toBeNull()
  })

  it('parses start-end', () => {
    expect(parseRange('bytes=0-99', 1000)).toEqual({ start: 0, end: 99 })
  })

  it('parses open-ended range', () => {
    expect(parseRange('bytes=500-', 1000)).toEqual({ start: 500, end: 999 })
  })

  it('clamps end to file size', () => {
    expect(parseRange('bytes=900-5000', 1000)).toEqual({ start: 900, end: 999 })
  })

  it('parses suffix range', () => {
    expect(parseRange('bytes=-100', 1000)).toEqual({ start: 900, end: 999 })
  })

  it('rejects unsatisfiable or malformed ranges', () => {
    expect(parseRange('bytes=2000-', 1000)).toBe('invalid')
    expect(parseRange('bytes=50-10', 1000)).toBe('invalid')
    expect(parseRange('bytes=-', 1000)).toBe('invalid')
    expect(parseRange('items=0-1', 1000)).toBe('invalid')
  })
})
