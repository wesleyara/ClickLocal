import { deleteBoard } from '../../services/boards'
import { requireIdParam } from '../../utils/params'

export default defineEventHandler(async (event) => {
  const id = requireIdParam(event)

  try {
    await deleteBoard(id)
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'Board not found' })
  }

  return { success: true }
})
