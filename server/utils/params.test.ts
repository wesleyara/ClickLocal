import { describe, expect, it } from 'vitest'
import { parseId } from './params'

describe('parseId', () => {
  it('accepts positive integers', () => {
    expect(parseId('1')).toBe(1)
    expect(parseId('483')).toBe(483)
  })

  it('rejects missing, zero, negative and non-numeric values', () => {
    for (const raw of [undefined, '', '0', '-1', 'abc', '1.5', '1e3', ' 2', '99999999999999999999']) {
      expect(parseId(raw)).toBeNull()
    }
  })
})
