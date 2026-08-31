import { deleteColumn } from '../../services/columns'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  try {
    await deleteColumn(id)
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'Column not found' })
  }

  return { success: true }
})
