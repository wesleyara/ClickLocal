import { updateCard } from '../../services/cards'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const body = await readBody(event)

  try {
    return await updateCard(id, body)
  } catch {
    throw createError({ statusCode: 404, statusMessage: 'Card not found' })
  }
})
