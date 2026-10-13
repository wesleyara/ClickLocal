import { describe, expect, it } from 'vitest'
import { extractAttachmentIds, isPastGracePeriod, ORPHAN_GRACE_MS } from './orphanAttachments'

describe('extractAttachmentIds', () => {
  it('finds links in images, links and bare urls, across texts', () => {
    const ids = extractAttachmentIds([
      '![a](/api/attachments/12) texto [video](/api/attachments/7)',
      null,
      'http://localhost:8880/api/attachments/12 e /api/attachments/300',
      undefined
    ])
    expect([...ids].sort((a, b) => a - b)).toEqual([7, 12, 300])
  })

  it('ignores other urls', () => {
    expect(extractAttachmentIds(['/api/cards/5', '/api/attachments/abc']).size).toBe(0)
  })
})

describe('isPastGracePeriod', () => {
  it('only accepts attachments older than the grace period', () => {
    const now = Date.now()
    expect(isPastGracePeriod(new Date(now - ORPHAN_GRACE_MS + 1000), now)).toBe(false)
    expect(isPastGracePeriod(new Date(now - ORPHAN_GRACE_MS), now)).toBe(true)
  })
})
