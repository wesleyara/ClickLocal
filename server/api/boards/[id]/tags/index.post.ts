import { createTag } from '../../../../services/tags'

export default defineEventHandler(async (event) => {
  const boardId = Number(getRouterParam(event, 'id'))
  const body = await readBody<{ name?: string, color?: string }>(event)

  if (!body?.name?.trim() || !body?.color?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'name and color are required' })
  }

  return createTag(boardId, { name: body.name, color: body.color })
})
