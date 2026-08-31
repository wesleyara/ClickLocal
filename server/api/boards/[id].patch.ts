import { updateBoard } from '../../services/boards'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody<{ name?: string, description?: string | null }>(event)

  try {
    return await updateBoard(id, body)
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'Board not found' })
  }
})
