import { createColumn } from '../../../services/columns'
import { requireIdParam } from '../../../utils/params'

export default defineEventHandler(async (event) => {
  const boardId = requireIdParam(event)
  const body = await readBody<{ name?: string }>(event)

  if (!body?.name?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'name is required' })
  }

  return createColumn(boardId, { name: body.name })
})
