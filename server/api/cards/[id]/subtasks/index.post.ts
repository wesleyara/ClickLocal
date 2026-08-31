import { createSubtask } from '../../../../services/subtasks'

export default defineEventHandler(async (event) => {
  const cardId = Number(getRouterParam(event, 'id'))
  const body = await readBody<{ title?: string }>(event)

  if (!body?.title?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'title is required' })
  }

  return createSubtask(cardId, { title: body.title })
})
