import { deleteSubtask } from '../../services/subtasks'
import { requireIdParam } from '../../utils/params'

export default defineEventHandler(async (event) => {
  const id = requireIdParam(event)

  try {
    await deleteSubtask(id)
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'Subtask not found' })
  }

  return { success: true }
})
