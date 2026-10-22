import { getBoardFull } from '../../../services/boards'
import { requireIdParam } from '../../../utils/params'

export default defineEventHandler(async (event) => {
  const id = requireIdParam(event)
  const result = await getBoardFull(id)

  if (!result) {
    throw createError({ statusCode: 404, statusMessage: 'Board not found' })
  }

  return result
})
