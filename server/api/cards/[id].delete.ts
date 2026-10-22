import { deleteCard, LinkedCardError } from '../../services/cards'
import { requireIdParam } from '../../utils/params'

export default defineEventHandler(async (event) => {
  const id = requireIdParam(event)

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
