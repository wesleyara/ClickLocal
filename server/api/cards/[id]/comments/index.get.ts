import { listComments } from '../../../../services/comments'
import { requireIdParam } from '../../../../utils/params'

export default defineEventHandler((event) => {
  const cardId = requireIdParam(event)
  return listComments(cardId)
})
