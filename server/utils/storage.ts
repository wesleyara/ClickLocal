import { randomUUID } from 'node:crypto'
import { createReadStream } from 'node:fs'
import { mkdir, readFile, stat, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const UPLOAD_DIR = join(process.cwd(), 'data', 'uploads')

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
  'video/mp4': '.mp4',
  'video/webm': '.webm'
}

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024
export const MAX_VIDEO_SIZE = 100 * 1024 * 1024

export function isAllowedImageType(mimeType: string) {
  return mimeType in ALLOWED_MIME_TYPES
}

export function isVideoType(mimeType: string) {
  return mimeType.startsWith('video/')
}

export function maxSizeFor(mimeType: string) {
  return isVideoType(mimeType) ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE
}

export function hasValidVideoSignature(mimeType: string, data: Buffer) {
  if (mimeType === 'video/mp4') {
    return data.length > 12 && data.subarray(4, 8).toString('ascii') === 'ftyp'
  }
  if (mimeType === 'video/webm') {
    return data.length > 4 && data.readUInt32BE(0) === 0x1A45DFA3
  }
  return false
}

export async function saveImage(mimeType: string, data: Buffer) {
  if (!isAllowedImageType(mimeType)) {
    throw createError({ statusCode: 400, statusMessage: 'Unsupported file type' })
  }
  if (data.length > maxSizeFor(mimeType)) {
    const label = isVideoType(mimeType) ? 'Video too large (max 100MB)' : 'Image too large (max 10MB)'
    throw createError({ statusCode: 400, statusMessage: label })
  }
  if (isVideoType(mimeType) && !hasValidVideoSignature(mimeType, data)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid video file' })
  }

  await mkdir(UPLOAD_DIR, { recursive: true })
  const storageKey = `${randomUUID()}${ALLOWED_MIME_TYPES[mimeType]}`
  await writeFile(join(UPLOAD_DIR, storageKey), data)
  return storageKey
}

export function readImage(storageKey: string) {
  return readFile(join(UPLOAD_DIR, storageKey))
}

export function statFile(storageKey: string) {
  return stat(join(UPLOAD_DIR, storageKey))
}

export function streamFile(storageKey: string, range?: { start: number, end: number }) {
  return createReadStream(join(UPLOAD_DIR, storageKey), range)
}

export function deleteImage(storageKey: string) {
  return unlink(join(UPLOAD_DIR, storageKey)).catch(() => {})
}
