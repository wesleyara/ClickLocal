import { pushHours } from '../../../services/azureDevOps/hours'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ cardIds?: number[] }>(event)

  if (!Array.isArray(body?.cardIds) || body.cardIds.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'expected a non-empty cardIds array' })
  }

  return pushHours(body.cardIds)
})
