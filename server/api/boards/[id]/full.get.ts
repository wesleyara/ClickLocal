import { getBoardFull } from '../../../services/boards'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const result = await getBoardFull(id)

  if (!result) {
    throw createError({ statusCode: 404, statusMessage: 'Board not found' })
  }

  return result
})
