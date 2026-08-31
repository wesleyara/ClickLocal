import { addManualEntry, startTimer } from '../../../../services/timeEntries'

interface Body {
  source: 'timer' | 'manual'
  startedAt?: string
  durationMs?: number
  note?: string
}

export default defineEventHandler(async (event) => {
  const cardId = Number(getRouterParam(event, 'id'))
  const body = await readBody<Body>(event)

  if (body?.source === 'manual') {
    if (!body.startedAt || !body.durationMs || body.durationMs <= 0) {
      throw createError({ statusCode: 400, statusMessage: 'startedAt and a positive durationMs are required' })
    }
    return addManualEntry(cardId, { startedAt: body.startedAt, durationMs: body.durationMs, note: body.note })
  }

  return startTimer(cardId)
})
