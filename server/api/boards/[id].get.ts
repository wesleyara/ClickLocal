import { getBoard } from '../../services/boards'
import { requireIdParam } from '../../utils/params'

export default defineEventHandler(async (event) => {
  const id = requireIdParam(event)
  const board = await getBoard(id)

  if (!board) {
    throw createError({ statusCode: 404, statusMessage: 'Board not found' })
  }

  return board
})
