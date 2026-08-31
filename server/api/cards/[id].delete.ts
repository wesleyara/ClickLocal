import { deleteCard } from '../../services/cards'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  try {
    await deleteCard(id)
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'Card not found' })
  }

  return { success: true }
})
