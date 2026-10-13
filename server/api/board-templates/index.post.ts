import { createTemplateFromBoard } from '../../services/boardTemplates'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ boardId?: number, name?: string }>(event)

  if (!body?.name?.trim()) {
    throw createError({ statusCode: 400, statusMessage: 'name is required' })
  }
  if (!Number.isInteger(body.boardId)) {
    throw createError({ statusCode: 400, statusMessage: 'boardId is required' })
  }

  const template = await createTemplateFromBoard(body.boardId as number, body.name)
  if (!template) {
    throw createError({ statusCode: 404, statusMessage: 'Board not found' })
  }

  return template
})
