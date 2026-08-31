import { getCard } from '../../services/cards'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const card = await getCard(id)

  if (!card) {
    throw createError({ statusCode: 404, statusMessage: 'Card not found' })
  }

  return card
})
