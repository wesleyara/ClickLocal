import { createBoard } from '../../services/boards'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ name?: string, description?: string }>(event)

  if (!body?.name?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'name is required' })
  }

  return createBoard({ name: body.name, description: body.description })
})
