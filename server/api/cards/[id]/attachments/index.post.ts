import { createAttachment } from '../../../../services/attachments'

export default defineEventHandler(async (event) => {
  const cardId = Number(getRouterParam(event, 'id'))
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
    attachments.push({ id: attachment.id, url: `/api/attachments/${attachment.id}` })
  }

  return attachments
})
