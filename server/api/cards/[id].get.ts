import { getCard } from '../../services/cards'
import { requireIdParam } from '../../utils/params'

export default defineEventHandler(async (event) => {
  const id = requireIdParam(event)
  const card = await getCard(id)

  if (!card) {
    throw createError({ statusCode: 404, statusMessage: 'Card not found' })
  }

  return card
})
