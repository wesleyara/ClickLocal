import { deleteBoard } from '../../services/boards'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  try {
    await deleteBoard(id)
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'Board not found' })
  }

  return { success: true }
})
