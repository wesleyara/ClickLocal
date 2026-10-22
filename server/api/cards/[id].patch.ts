import { updateCard } from '../../services/cards'
import { requireIdParam } from '../../utils/params'

export default defineEventHandler(async (event) => {
  const id = requireIdParam(event)
  const body = await readBody(event)

  try {
    return await updateCard(id, body)
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'Card not found' })
  }
})
