import { createColumn } from '../../../services/columns'

export default defineEventHandler(async (event) => {
  const boardId = Number(getRouterParam(event, 'id'))
  const body = await readBody<{ name?: string }>(event)

  if (!body?.name?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'name is required' })
  }

  return createColumn(boardId, { name: body.name })
})
