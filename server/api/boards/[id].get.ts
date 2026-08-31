import { getBoard } from '../../services/boards'

export default defineEventHandler(async (event) => {
  const id = Number(getRouterParam(event, 'id'))
  const board = await getBoard(id)

  if (!board) {
    throw createError({ statusCode: 404, statusMessage: 'Board not found' })
  }

  return board
})
