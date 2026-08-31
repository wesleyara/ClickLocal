import { reorderCards } from '../../services/cards'

export default defineEventHandler(async (event) => {
  const body = await readBody<{ id: number, columnId: number, position: number }[]>(event)

  if (!Array.isArray(body) || body.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'expected a non-empty array of {id, columnId, position}' })
  }

  await reorderCards(body)
  return { success: true }
})
