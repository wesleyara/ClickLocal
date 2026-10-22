import { listArchivedCards } from '../../../services/boards'
import { requireIdParam } from '../../../utils/params'

export default defineEventHandler((event) => {
  const boardId = requireIdParam(event)
  return listArchivedCards(boardId)
})
