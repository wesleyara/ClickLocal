import { createSubtask } from '../../../../services/subtasks'
import { requireIdParam } from '../../../../utils/params'

export default defineEventHandler(async (event) => {
  const cardId = requireIdParam(event)
  const body = await readBody<{ title?: string }>(event)

  if (!body?.title?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'title is required' })
  }

  return createSubtask(cardId, { title: body.title })
})
