import { listComments } from '../../../../services/comments'

export default defineEventHandler((event) => {
  const cardId = Number(getRouterParam(event, 'id'))
  return listComments(cardId)
})
