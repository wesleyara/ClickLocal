import { deleteCard, LinkedCardError } from '../../services/cards'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))

  try {
    await deleteCard(id)
  } catch (error) {
    if (error instanceof LinkedCardError) {
      throw createError({ statusCode: 409, statusMessage: error.message })
    }
    throw createError({ statusCode: 404, statusMessage: 'Card not found' })
  }

  return { success: true }
})
