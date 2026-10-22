import { deleteColumn } from '../../services/columns'
import { requireIdParam } from '../../utils/params'

export default defineEventHandler(async (event) => {
  const id = requireIdParam(event)

  try {
    await deleteColumn(id)
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'Column not found' })
  }

  return { success: true }
})
