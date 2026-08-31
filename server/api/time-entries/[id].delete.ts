import { deleteEntry } from '../../services/timeEntries'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  try {
    await deleteEntry(id)
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'Time entry not found' })
  }

  return { success: true }
})
