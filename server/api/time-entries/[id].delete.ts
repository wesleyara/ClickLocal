import { deleteEntry, PushedTimeEntryError } from '../../services/timeEntries'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  try {
    await deleteEntry(id)
  } catch (error) {
    if (error instanceof PushedTimeEntryError) {
      throw createError({ statusCode: 409, statusMessage: error.message })
    }
    throw createError({ statusCode: 404, statusMessage: 'Time entry not found' })
  }

  return { success: true }
})
