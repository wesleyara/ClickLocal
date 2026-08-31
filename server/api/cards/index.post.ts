import { createCard } from '../../services/cards'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ columnId?: number, title?: string, description?: string }>(event)

  if (!body?.columnId || !body?.title?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'columnId and title are required' })
  }

  return createCard(body.columnId, { title: body.title, description: body.description })
})
