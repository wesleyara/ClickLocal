import { updateSubtask } from '../../services/subtasks'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody<{ title?: string, completed?: boolean }>(event)

  try {
    return await updateSubtask(id, body)
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'Subtask not found' })
  }
})
