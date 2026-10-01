import { getAttachment } from '../../services/attachments'
import { parseRange } from '../../utils/range'
import { statFile, streamFile } from '../../utils/storage'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const attachment = await getAttachment(id)

  if (!attachment) {
    throw createError({ statusCode: 404, statusMessage: 'Attachment not found' })
  }

  const file = await statFile(attachment.storageKey).catch(() => null)
  if (!file) {
    throw createError({ statusCode: 404, statusMessage: 'Attachment file not found' })
  }

  setHeader(event, 'Content-Type', attachment.mimeType)
  setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
  setHeader(event, 'Accept-Ranges', 'bytes')
  setHeader(event, 'X-Content-Type-Options', 'nosniff')

  const range = parseRange(getRequestHeader(event, 'range'), file.size)
  if (range === 'invalid') {
    setResponseStatus(event, 416)
    setHeader(event, 'Content-Range', `bytes */${file.size}`)
    return ''
  }

  if (range) {
    setResponseStatus(event, 206)
    setHeader(event, 'Content-Range', `bytes ${range.start}-${range.end}/${file.size}`)
    setHeader(event, 'Content-Length', range.end - range.start + 1)
    return sendStream(event, streamFile(attachment.storageKey, range))
  }

  setHeader(event, 'Content-Length', file.size)
  return sendStream(event, streamFile(attachment.storageKey))
})
