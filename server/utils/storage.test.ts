import { describe, expect, it } from 'vitest'
import { hasValidVideoSignature, isAllowedImageType, maxSizeFor } from './storage'

describe('storage helpers', () => {
  it('allows mp4 and webm but not mov', () => {
    expect(isAllowedImageType('video/mp4')).toBe(true)
    expect(isAllowedImageType('video/webm')).toBe(true)
    expect(isAllowedImageType('video/quicktime')).toBe(false)
  })

  it('uses a larger limit for videos', () => {
    expect(maxSizeFor('video/mp4')).toBe(100 * 1024 * 1024)
    expect(maxSizeFor('image/png')).toBe(10 * 1024 * 1024)
  })

  it('validates mp4 signature', () => {
    const mp4 = Buffer.concat([Buffer.from([0, 0, 0, 24]), Buffer.from('ftypisom'), Buffer.alloc(8)])
    expect(hasValidVideoSignature('video/mp4', mp4)).toBe(true)
    expect(hasValidVideoSignature('video/mp4', Buffer.from('MZ not a video file'))).toBe(false)
  })

  it('validates webm signature', () => {
    const webm = Buffer.from([0x1A, 0x45, 0xDF, 0xA3, 0, 0])
    expect(hasValidVideoSignature('video/webm', webm)).toBe(true)
    expect(hasValidVideoSignature('video/webm', Buffer.from('nope nope'))).toBe(false)
  })
})
