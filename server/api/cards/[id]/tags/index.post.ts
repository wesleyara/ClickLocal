import { attachTag } from '../../../../services/tags'

export default defineEventHandler(async (event) => {
  const cardId = Number(getRouterParam(event, 'id'))
  const body = await readBody<{ tagId?: number }>(event)

  if (!body?.tagId) {
    throw createError({ statusCode: 400, statusMessage: 'tagId is required' })
  }

  await attachTag(cardId, body.tagId)
  return { success: true }
})
