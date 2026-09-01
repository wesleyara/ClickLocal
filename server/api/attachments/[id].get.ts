import { getAttachment } from '../../services/attachments'
import { readImage } from '../../utils/storage'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const attachment = await getAttachment(id)

  if (!attachment) {
    throw createError({ statusCode: 404, statusMessage: 'Attachment not found' })
  }

  const data = await readImage(attachment.storageKey)
  setHeader(event, 'Content-Type', attachment.mimeType)
  setHeader(event, 'Cache-Control', 'public, max-age=31536000, immutable')
  return data
})
