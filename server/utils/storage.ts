import { randomUUID } from 'node:crypto'
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

const UPLOAD_DIR = join(process.cwd(), 'data', 'uploads')

const ALLOWED_MIME_TYPES: Record<string, string> = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'image/svg+xml': '.svg'
}

const MAX_IMAGE_SIZE = 10 * 1024 * 1024

export function isAllowedImageType(mimeType: string) {
  return mimeType in ALLOWED_MIME_TYPES
}

export async function saveImage(mimeType: string, data: Buffer) {
  if (!isAllowedImageType(mimeType)) {
    throw createError({ statusCode: 400, statusMessage: 'Unsupported image type' })
  }
  if (data.length > MAX_IMAGE_SIZE) {
    throw createError({ statusCode: 400, statusMessage: 'Image too large (max 10MB)' })
  }

  await mkdir(UPLOAD_DIR, { recursive: true })
  const storageKey = `${randomUUID()}${ALLOWED_MIME_TYPES[mimeType]}`
  await writeFile(join(UPLOAD_DIR, storageKey), data)
  return storageKey
}

export function readImage(storageKey: string) {
  return readFile(join(UPLOAD_DIR, storageKey))
}

export function deleteImage(storageKey: string) {
  return unlink(join(UPLOAD_DIR, storageKey)).catch(() => {})
}
