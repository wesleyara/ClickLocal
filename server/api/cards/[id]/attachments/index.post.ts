import { cardRepository } from '../../../../repositories/cardRepository'
import { createAttachment } from '../../../../services/attachments'
import { MAX_VIDEO_SIZE } from '../../../../utils/storage'

// Allows multipart overhead on top of the largest file size
const MAX_BODY_SIZE = MAX_VIDEO_SIZE + 1024 * 1024

export default defineEventHandler(async (event) => {
  const cardId = Number(getRouterParam(event, 'id'))

  const contentLength = Number(getRequestHeader(event, 'content-length') ?? 0)
  if (contentLength > MAX_BODY_SIZE) {
    throw createError({ statusCode: 413, statusMessage: 'File too large' })
  }

  const card = await cardRepository.findById(cardId)
  if (!card) {
    throw createError({ statusCode: 404, statusMessage: 'Card not found' })
  }

  const parts = await readMultipartFormData(event)

  if (!parts?.length) {
    throw createError({ statusCode: 400, statusMessage: 'No file provided' })
  }

  const files = parts.filter(part => part.name === 'files' && part.filename && part.type)
  if (!files.length) {
    throw createError({ statusCode: 400, statusMessage: 'No file provided' })
  }

  const attachments = []
  for (const file of files) {
    const attachment = await createAttachment(cardId, {
      fileName: file.filename!,
      mimeType: file.type!,
      data: file.data
    })
    attachments.push({ id: attachment.id, url: `/api/attachments/${attachment.id}`, mimeType: attachment.mimeType })
  }

  return attachments
})
