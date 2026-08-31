import { listActivity } from '../../../../services/activity'

export default defineEventHandler((event) => {
  const cardId = Number(getRouterParam(event, 'id'))
  return listActivity(cardId)
})
