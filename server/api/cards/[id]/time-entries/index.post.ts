import { addManualEntry, startTimer, TimerAlreadyRunningError } from '../../../../services/timeEntries'
import { requireIdParam } from '../../../../utils/params'

interface Body {
  source: 'timer' | 'manual'
  startedAt?: string
  durationMs?: number
  note?: string
  stopOthers?: boolean
}

export default defineEventHandler(async (event) => {
  const cardId = requireIdParam(event)
  const body = await readBody<Body>(event)

  if (body?.source === 'manual') {
    if (!body.startedAt || !body.durationMs || body.durationMs <= 0) {
      throw createError({ statusCode: 400, statusMessage: 'startedAt and a positive durationMs are required' })
    }
    return addManualEntry(cardId, { startedAt: body.startedAt, durationMs: body.durationMs, note: body.note })
  }

  try {
    return await startTimer(cardId, { stopOthers: body?.stopOthers === true })
  } catch (error) {
    if (error instanceof TimerAlreadyRunningError) {
      throw createError({ statusCode: 409, statusMessage: error.message })
    }
    throw error
  }
})
