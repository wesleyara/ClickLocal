import { createChildCard } from '../../../../services/cards'

export default defineEventHandler(async (event) => {
  const parentId = Number(getRouterParam(event, 'id'))
  const body = await readBody<{ title?: string }>(event)

  if (!body?.title?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'title is required' })
  }

  return createChildCard(parentId, { title: body.title })
})
