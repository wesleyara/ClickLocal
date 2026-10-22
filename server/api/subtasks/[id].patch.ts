import { updateSubtask } from '../../services/subtasks'
import { requireIdParam } from '../../utils/params'

export default defineEventHandler(async (event) => {
  const id = requireIdParam(event)
  const body = await readBody<{ title?: string, completed?: boolean }>(event)

  try {
    return await updateSubtask(id, body)
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'Subtask not found' })
  }
})
