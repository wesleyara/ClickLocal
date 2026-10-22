import { createTag } from '../../../../services/tags'
import { requireIdParam } from '../../../../utils/params'

export default defineEventHandler(async (event) => {
  const boardId = requireIdParam(event)
  const body = await readBody<{ name?: string, color?: string }>(event)

  if (!body?.name?.trim() || !body?.color?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'name and color are required' })
  }

  return createTag(boardId, { name: body.name, color: body.color })
})
