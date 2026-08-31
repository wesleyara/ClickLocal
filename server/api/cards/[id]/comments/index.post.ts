import { createComment } from '../../../../services/comments'

export default defineEventHandler(async (event) => {
  const cardId = Number(getRouterParam(event, 'id'))
  const body = await readBody<{ body?: string }>(event)

  if (!body?.body?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'body is required' })
  }

  return createComment(cardId, { body: body.body })
})
