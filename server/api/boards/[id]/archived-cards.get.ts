import { listArchivedCards } from '../../../services/boards'

export default defineEventHandler((event) => {
  const boardId = Number(getRouterParam(event, 'id'))
  return listArchivedCards(boardId)
})
