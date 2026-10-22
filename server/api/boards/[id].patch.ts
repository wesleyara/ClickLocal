import { updateBoard } from '../../services/boards'
import { requireIdParam } from '../../utils/params'

export default defineEventHandler(async (event) => {
  const id = requireIdParam(event)
  const body = await readBody<{ name?: string, description?: string | null }>(event)

  try {
    return await updateBoard(id, body)
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'Board not found' })
  }
})
