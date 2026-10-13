import { PushedTimeEntryError, stopTimer, updateManualEntry } from '../../services/timeEntries'

interface Body {
  stop?: boolean
  startedAt?: string
  durationMs?: number
  note?: string
}

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody<Body>(event)

  try {
    if (body?.stop) {
      return await stopTimer(id)
    }
    return await updateManualEntry(id, body)
  } catch (error) {
    if (error instanceof PushedTimeEntryError) {
      throw createError({ statusCode: 409, statusMessage: error.message })
    }
    throw createError({ statusCode: 404, statusMessage: 'Time entry not found' })
  }
})
