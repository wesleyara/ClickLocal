import { deleteSubtask } from '../../services/subtasks'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  try {
    await deleteSubtask(id)
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'Subtask not found' })
  }

  return { success: true }
})
