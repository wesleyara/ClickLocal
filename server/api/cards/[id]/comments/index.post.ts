import { createComment } from '../../../../services/comments'
import { requireIdParam } from '../../../../utils/params'

export default defineEventHandler(async (event) => {
  const cardId = requireIdParam(event)
  const body = await readBody<{ body?: string }>(event)

  if (!body?.body?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'body is required' })
  }

  return createComment(cardId, { body: body.body })
})
