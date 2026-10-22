import { createChildCard } from '../../../../services/cards'
import { requireIdParam } from '../../../../utils/params'

export default defineEventHandler(async (event) => {
  const parentId = requireIdParam(event)
  const body = await readBody<{ title?: string }>(event)

  if (!body?.title?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'title is required' })
  }

  return createChildCard(parentId, { title: body.title })
})
